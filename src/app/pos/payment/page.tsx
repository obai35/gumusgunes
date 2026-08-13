'use client'

import { posFetch } from '@/lib/pos-client-fetch'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, History, Receipt, ShoppingCart } from 'lucide-react'
import { usePosAuth } from '@/lib/pos-auth-store'
import { usePos } from '../hooks/usePos'
import { usePosSettings } from '../hooks/usePosSettings'
import { usePosStore } from '../stores/posStore'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import CustomerSearch from '../components/CustomerSearch'
import DiscountSection from '../components/DiscountSection'
import DiscountPresets from '../components/DiscountPresets'
import PaymentSection from '../components/PaymentSection'
import TotalsDisplay from '../components/TotalsDisplay'
import CheckoutButton from '../components/CheckoutButton'
import ReceiptView from '../components/ReceiptView'
import ShortcutsCheatSheet from '../components/ShortcutsCheatSheet'
import CartItemComponent from '../components/CartItem'
import { formatPrice } from '@/lib/format'
import { queueOrder, storeOfflineOrder } from '@/lib/pos-db'
import type { Shift } from '../types'

export default function POSPaymentPage() {
  const router = useRouter()
  const { user } = usePosAuth()
  const authLoading = usePosAuth((s) => s.loading)
  const [posHydrated, setPosHydrated] = useState(false)
  const [shift, setShift] = useState<Shift | null>(null)

  useEffect(() => {
    usePosAuth.getState().fetchUser()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) router.replace('/pos/login')
  }, [authLoading, user, router])

  useEffect(() => {
    if (usePosStore.persist.hasHydrated()) {
      setPosHydrated(true)
    } else {
      const unsub = usePosStore.persist.onFinishHydration(() => setPosHydrated(true))
      return () => unsub()
    }
  }, [])

  const pos = usePos()
  const offlineMode = usePosStore((s) => s.offlineMode)
  const offlineReceipt = usePosStore((s) => s.offlineReceipt)
  const setOfflineReceipt = usePosStore((s) => s.setOfflineReceipt)
  const saleIdRef = useRef<string | null>(null)

  usePosSettings(true)
  const [showRecent, setShowRecent] = useState(false)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentLoading, setRecentLoading] = useState(false)

  const loadRecentOrders = useCallback(async () => {
    if (!shift?.id) return
    setRecentLoading(true)
    try {
      const res = await posFetch(`/api/admin/pos/orders/recent?shiftId=${shift.id}&limit=5&full=1`)
      const data = await res.json()
      if (data.ok) setRecentOrders((data.orders || []).filter((o: any) => o.status !== 'cancelled'))
    } catch {}
    setRecentLoading(false)
  }, [shift?.id])

  useEffect(() => {
    if (showRecent) loadRecentOrders()
  }, [showRecent, loadRecentOrders])

  const handleRepeatOrder = useCallback((order: any) => {
    const items: any[] = order?.items || []
    if (items.length === 0) return
    for (const item of pos.cart) pos.removeFromCart(item.productId)
    pos.setDiscountCode('')
    pos.setAppliedDiscount(null)
    usePosStore.getState().setCashAmount('')
    usePosStore.getState().setCardAmount('')
    for (const it of items) {
      pos.addToCart({ id: it.product.id, name: it.product.name, price: it.price, stock: 9999, imageUrl: '', sku: it.product.sku || '' })
      if ((it.discount || 0) > 0) pos.setItemDiscount(it.product.id, it.discount)
    }
    setShowRecent(false)
    toast.success('Order repeated — review before checkout')
  }, [pos])

  useEffect(() => {
    if (user && posHydrated && pos.cart.length === 0 && !pos.receipt && !offlineReceipt) {
      router.replace('/pos')
    }
  }, [user, posHydrated, pos.cart.length, pos.receipt, offlineReceipt, router])

  const handleApplyDiscount = useCallback(async () => {
    if (!pos.discountCode.trim()) return
    try {
      const res = await posFetch('/api/admin/pos/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pos.discountCode,
          subtotal: pos.subtotal,
          items: pos.cart.map(i => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        pos.setAppliedDiscount({ code: pos.discountCode, ...data })
        toast.success('Discount applied')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Invalid discount')
        pos.setAppliedDiscount(null)
      }
    } catch { toast.error('Failed to apply discount') }
  }, [pos.discountCode, pos.subtotal, pos.cart])

  const handleApplyPresetDiscount = useCallback((label: string, amount: number) => {
    const cart = usePosStore.getState().cart
    if (cart.length === 0) return
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
    if (subtotal <= 0) return
    usePosStore.setState((state) => ({
      cart: state.cart.map((i) => {
        const itemSubtotal = i.price * i.quantity
        const itemDiscount = Math.round((itemSubtotal / subtotal) * amount * 100) / 100
        return { ...i, discount: itemDiscount > 0 ? itemDiscount : 0 }
      }),
    }))
  }, [])

  function validatePayment(): string | null {
    if (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total) {
      return `Amount tendered (${formatPrice(pos.parsedCash)}) is less than total (${formatPrice(pos.total)})`
    }
    if (pos.paymentMethod === 'split') {
      if (pos.parsedCash <= 0 || pos.parsedCard <= 0) return 'Both amounts must be greater than 0 for split payment'
      if (Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01) return 'Split amounts must equal total'
    }
    return null
  }

  const checkoutDisabled = useMemo(() =>
    pos.cart.length === 0 ||
    pos.checkoutLoading ||
    (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total && pos.parsedCash > 0) ||
    (pos.paymentMethod === 'split' && (pos.parsedCash <= 0 || pos.parsedCard <= 0 || Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01))
  , [pos.cart.length, pos.checkoutLoading, pos.paymentMethod, pos.parsedCash, pos.parsedCard, pos.total])

  const handleCheckout = useCallback(async () => {
    if (pos.cart.length === 0 || pos.checkoutLoading) return
    const validationError = validatePayment()
    if (validationError) { toast.error(validationError); return }
    if (!saleIdRef.current) saleIdRef.current = `sale_${crypto.randomUUID()}`
    pos.setCheckoutLoading(true)
    try {
      const items = pos.cart.map((i) => ({ productId: i.productId, quantity: i.quantity, discount: i.discount }))
      const body: any = {
        items,
        discountCode: pos.appliedDiscount?.code,
        paymentMethod: pos.paymentMethod,
        shiftId: shift?.id,
        notes: pos.orderNotes || undefined,
        taxRate: pos.taxRate,
        taxAmount: pos.taxAmount,
        idempotencyKey: saleIdRef.current,
      }
      if (pos.customer) {
        body.customerId = pos.customer.id
        body.customerName = pos.customer.name
        body.customerEmail = pos.customer.email
        body.customerPhone = pos.customer.phone
      }
      if (pos.paymentMethod === 'cash' || pos.paymentMethod === 'split') body.cashAmount = pos.parsedCash
      if (pos.paymentMethod === 'split') body.cardAmount = pos.parsedCard

      if (offlineMode) {
        const itemsForReceipt = pos.cart.map((i) => ({
          id: i.productId,
          quantity: i.quantity,
          price: i.price,
          product: { name: i.name, sku: i.productId },
        }))
        const { tempReceiptNumber } = await storeOfflineOrder({
          items,
          subtotal: pos.subtotal,
          discountAmount: pos.discountAmount,
          total: pos.total,
          paymentMethod: pos.paymentMethod,
          cashAmount: pos.parsedCash || null,
          cardAmount: pos.parsedCard || null,
          taxRate: pos.taxRate,
          taxAmount: pos.taxAmount,
          customerId: pos.customer?.id || null,
          customerName: pos.customer?.name || null,
          customerEmail: pos.customer?.email || null,
          customerPhone: pos.customer?.phone || null,
          discountCode: pos.appliedDiscount?.code || null,
          shiftId: shift?.id || null,
          notes: pos.orderNotes || null,
        })
        setOfflineReceipt({
          orderId: tempReceiptNumber,
          receiptNumber: tempReceiptNumber,
          total: pos.total,
          items: itemsForReceipt,
          subtotal: pos.subtotal,
          discount: pos.discountAmount,
          paymentMethod: pos.paymentMethod,
          cashAmount: pos.parsedCash || null,
          cardAmount: pos.parsedCard || null,
          taxRate: pos.taxRate,
          taxAmount: pos.taxAmount,
        })
        toast.success(`Order saved as ${tempReceiptNumber}`)
        saleIdRef.current = null
        pos.setCheckoutLoading(false)
        return
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueOrder(body)
        toast.success('Order queued for sync when back online')
        saleIdRef.current = null
        pos.setCheckoutLoading(false)
        return
      }

      const res = await posFetch('/api/admin/pos/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const data = await res.json()
        pos.setReceipt({
          orderId: data.orderId,
          receiptNumber: data.order?.receiptNumber || '',
          total: data.total,
          items: data.order?.items || [],
          subtotal: data.order?.subtotal || pos.subtotal,
          discount: data.order?.discountAmount || pos.discountAmount,
          paymentMethod: data.order?.paymentMethod || pos.paymentMethod,
          cashAmount: data.order?.cashAmount || null,
          cardAmount: data.order?.cardAmount || null,
          taxRate: pos.taxRate,
          taxAmount: data.order?.tax ?? pos.taxAmount,
        })
        saleIdRef.current = null
        toast.success('Order completed!')
        loadRecentOrders()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Checkout failed')
      }
    } catch { toast.error('Checkout failed') }
    pos.setCheckoutLoading(false)
  }, [pos.cart, pos.appliedDiscount?.code, pos.paymentMethod, pos.parsedCash, pos.parsedCard, pos.customer, pos.orderNotes, pos.taxRate, pos.taxAmount, pos.subtotal, pos.discountAmount, pos.total, shift?.id, offlineMode, loadRecentOrders])

  const handleNewSale = useCallback(() => {
    setOfflineReceipt(null)
    saleIdRef.current = null
    pos.newSale()
    router.push('/pos')
  }, [pos, router])

  useKeyboardShortcuts({
    onF1: () => pos.setPaymentMethod('cash'),
    onF2: () => pos.setPaymentMethod('card'),
    onF3: () => pos.setPaymentMethod('split'),
    onF10: () => pos.setPaymentMethod('bank_transfer'),
    onF11: () => pos.setPaymentMethod('instapay'),
    onF12: () => pos.setPaymentMethod('wallet'),
    onEnter: () => { if (!checkoutDisabled) handleCheckout() },
    onEscape: () => {
      if (pos.receipt || offlineReceipt) {
        setOfflineReceipt(null)
        pos.newSale()
      } else {
        router.push('/pos')
      }
    },
  })

  if (authLoading || !user || !posHydrated) return null

  if (offlineReceipt) return (
    <div className="navy-radial min-h-screen">
      <ReceiptView receipt={offlineReceipt} onNewSale={handleNewSale} isOffline />
    </div>
  )

  if (pos.receipt) return (
    <div className="navy-radial min-h-screen">
      <ReceiptView receipt={pos.receipt} onNewSale={handleNewSale} />
    </div>
  )

  if (pos.cart.length === 0) return null

  if (!shift) {
    return (
      <div className="navy-radial min-h-screen flex items-center justify-center">
        <div className="pos-glass-strong rounded-xl w-full max-w-md p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-silver-soft">No Open Shift</h2>
          <p className="text-sm text-white/50">Start a shift before completing a sale.</p>
          <button onClick={() => router.push('/pos')} className="w-full px-6 py-2.5 bg-gold text-navy-deep rounded-lg text-sm font-semibold hover:bg-gold/90 transition-all">
            Back to POS
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="navy-radial min-h-screen">
      <div className="flex flex-col min-h-screen pos-interface">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <button onClick={() => router.push('/pos')} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/40 hover:text-silver-soft hover:bg-white/5 rounded-lg transition-all">
            <ArrowLeft className="h-4 w-4" /> Back to Cart
          </button>
          <h1 className="font-display text-lg font-semibold text-silver-soft flex items-center gap-2">
            <Receipt className="h-5 w-5 text-gold" /> Payment
          </h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowRecent(v => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 text-silver-soft text-xs font-medium rounded-lg border border-white/10 transition-all"
              >
                <History className="h-4 w-4 text-gold" /> Recent
              </button>
              {showRecent && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRecent(false)} />
                  <div className="absolute right-0 top-full mt-2 z-50 w-80 bg-[rgba(10,22,40,0.98)] border border-gold/25 rounded-xl shadow-2xl p-3 space-y-2 max-h-[60dvh] overflow-y-auto scroll-luxury">
                    <p className="text-xs font-semibold text-white/40 uppercase tracking-wide">Recent orders</p>
                    {recentLoading ? (
                      <p className="text-xs text-white/40 py-4 text-center">Loading…</p>
                    ) : recentOrders.length === 0 ? (
                      <p className="text-xs text-white/40 py-4 text-center">No recent orders</p>
                    ) : (
                      recentOrders.map((o) => (
                        <div key={o.id} className="flex items-center gap-2 bg-white/5 rounded-lg p-2 border border-white/5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-silver-soft truncate">
                              {o.items.map((i: any) => `${i.quantity}× ${i.product.name}`).join(', ')}
                            </p>
                            <p className="text-[11px] text-white/40">
                              {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {formatPrice(o.totalAmount)} · {o.paymentMethod}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRepeatOrder(o)}
                            className="flex-shrink-0 px-2.5 py-1 bg-gold text-navy-deep rounded-md text-xs font-semibold hover:bg-gold/90 transition-all"
                          >
                            Repeat
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
            {offlineMode && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                Offline Mode
              </span>
            )}
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {user?.name || 'Branch'} · {formatPrice(pos.total)}
            </span>
          </div>
        </div>

        <div className="flex gap-4 flex-1 min-h-0 items-start">
          <div className="w-[380px] min-w-[380px] flex flex-col bg-[rgba(10,22,40,0.95)] rounded-xl border border-gold/30 p-4 shadow-[0_0_20px_-8px_rgba(212,175,55,0.3)] max-h-[calc(100dvh-10rem)]">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="font-semibold text-silver-soft flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gold" /> Order ({pos.cart.length})
              </h2>
              {pos.cart.length > 0 && (
                <button onClick={() => pos.cart.forEach(i => pos.removeFromCart(i.productId))} className="text-xs text-white/40 hover:text-red-400 transition-colors">
                  Clear all
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0 scroll-luxury">
              {pos.cart.map((item) => (
                <CartItemComponent
                  key={item.productId}
                  item={item}
                  onUpdateQuantity={pos.updateQuantity}
                  onRemove={pos.removeFromCart}
                  onSetDiscount={pos.setItemDiscount}
                />
              ))}
            </div>
            <div className="flex-shrink-0 mt-3 pt-3 border-t border-white/10 space-y-1.5 text-sm">
              <div className="flex justify-between text-white/40"><span>Subtotal</span><span>{formatPrice(pos.subtotal)}</span></div>
              {pos.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400"><span>Discount</span><span>-{formatPrice(pos.discountAmount)}</span></div>
              )}
              {pos.taxAmount > 0 && (
                <div className="flex justify-between text-white/40"><span>Tax ({pos.taxRate}%)</span><span>{formatPrice(pos.taxAmount)}</span></div>
              )}
              <div className="flex justify-between text-lg font-bold text-gold pt-1 border-t border-white/10"><span>Total</span><span>{formatPrice(pos.total)}</span></div>
            </div>
          </div>

          <div className="flex-1 min-w-0 max-w-2xl flex flex-col gap-4">
            <div className="pos-glass rounded-xl p-4 space-y-4">
              <CustomerSearch
                customer={pos.customer}
                setCustomer={pos.setCustomer}
                customerSearch={pos.customerSearch}
                setCustomerSearch={pos.setCustomerSearch}
              />
              <div className="space-y-2">
                <DiscountPresets
                  subtotal={pos.subtotal}
                  cartTotal={pos.total}
                  cartLength={pos.cart.length}
                  onApplyPreset={handleApplyPresetDiscount}
                />
                <DiscountSection
                  discountCode={pos.discountCode}
                  onDiscountCodeChange={pos.setDiscountCode}
                  onApplyDiscount={handleApplyDiscount}
                  appliedDiscount={pos.appliedDiscount}
                  onRemoveDiscount={() => { pos.setAppliedDiscount(null); pos.setDiscountCode('') }}
                  discountAmount={pos.discountAmount}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Notes</p>
                <textarea
                  value={pos.orderNotes}
                  onChange={(e) => pos.setOrderNotes(e.target.value)}
                  placeholder="Order notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                />
              </div>
              <PaymentSection
                paymentMethod={pos.paymentMethod}
                onPaymentMethodChange={pos.setPaymentMethod}
                cashAmount={pos.cashAmount}
                onCashChange={pos.handleCashChange}
                cardAmount={pos.cardAmount}
                onCardChange={pos.handleCardChange}
                total={pos.total}
                change={pos.change}
              />
              <TotalsDisplay subtotal={pos.subtotal} discountAmount={pos.discountAmount} total={pos.total} itemDiscountTotal={pos.itemDiscountTotal} couponDiscount={pos.appliedDiscount?.amount || 0} taxAmount={pos.taxAmount} />
              <CheckoutButton
                total={pos.total}
                paymentMethod={pos.paymentMethod}
                disabled={checkoutDisabled}
                loading={pos.checkoutLoading}
                onClick={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      <ShortcutsCheatSheet page="payment" />
    </div>
  )
}
