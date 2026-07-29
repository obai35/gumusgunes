'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePosAuth } from '@/lib/pos-auth-store'
import { usePos } from './hooks/usePos'
import { usePosStore } from './stores/posStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import PosLayout from './components/PosLayout'
import BarcodeInput from './components/BarcodeInput'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import DiscountSection from './components/DiscountSection'
import DiscountPresets from './components/DiscountPresets'
import RecentOrders from './components/RecentOrders'
import PaymentSection from './components/PaymentSection'
import TotalsDisplay from './components/TotalsDisplay'
import CheckoutButton from './components/CheckoutButton'
import ReceiptView from './components/ReceiptView'
import ShiftStartModal from './components/ShiftStartModal'
import ShiftCloseModal from './components/ShiftCloseModal'
import AssessmentView from './components/AssessmentView'
import OrdersTab from './components/OrdersTab'
import RecordsTab from './components/RecordsTab'
import HallSaleTab from './components/HallSaleTab'
import ReturnsTab from './components/ReturnsTab'
import CustomerDisplay from './components/CustomerDisplay'
import CustomerSearch from './components/CustomerSearch'
import OfflineBanner from './components/OfflineBanner'
import OfflineSyncManager from './components/OfflineSyncManager'
import ShortcutsCheatSheet from './components/ShortcutsCheatSheet'
import { formatPrice } from '@/lib/format'
import { registerSW } from '@/lib/offline'
import { queueOrder, cacheProducts, storeOfflineOrder, getCachedProducts } from '@/lib/pos-db'
import type { Shift, ShiftSummary, Category, ReceiptData } from './types'

type View = 'pos' | 'orders' | 'records' | 'returns' | 'hall-sale' | 'assessment'

export default function POSPage() {
  const router = useRouter()
  const { token, user, logout } = usePosAuth()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (usePosAuth.persist.hasHydrated()) {
      setHydrated(true)
    } else {
      const unsub = usePosAuth.persist.onFinishHydration(() => setHydrated(true))
      return () => unsub()
    }
  }, [])

  useEffect(() => {
    if (hydrated && !token) router.replace('/pos/login')
  }, [hydrated, token, router])

  const pos = usePos()
  const [posHydrated, setPosHydrated] = useState(false)

  useEffect(() => {
    if (usePosStore.persist.hasHydrated()) {
      setPosHydrated(true)
    } else {
      const unsub = usePosStore.persist.onFinishHydration(() => setPosHydrated(true))
      return () => unsub()
    }
  }, [])

  const [shift, setShift] = useState<Shift | null>(null)
  const [showStartShift, setShowStartShift] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [endingCash, setEndingCash] = useState('')
  const [shiftNotes, setShiftNotes] = useState('')
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
  const [view, setView] = useState<View>('pos')
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [showCustomPrice, setShowCustomPrice] = useState(false)
  const [customPriceName, setCustomPriceName] = useState('')
  const [customPriceAmount, setCustomPriceAmount] = useState('')
  const customPriceRef = useRef<HTMLDivElement>(null)
  const [returnOrderId, setReturnOrderId] = useState<string | null>(null)
  const [showNotes, setShowNotes] = useState(false)
  const [offlineMode, setOfflineMode] = useState(false)
  const [offlineReceipt, setOfflineReceipt] = useState<ReceiptData | null>(null)

  useEffect(() => {
    if (hydrated && token && user?.branchId) {
      fetch(`/api/admin/pos/shifts/active?branchId=${user.branchId}`)
        .then((res) => res.json())
        .then((data) => { if (data.ok && data.shift) setShift(data.shift) })
        .catch(() => {})
    }
  }, [hydrated, token, user?.branchId])

  useEffect(() => {
    if (view === 'assessment' && shift?.id) {
      setAssessmentLoading(true)
      fetch(`/api/admin/pos/shifts/summary?shiftId=${shift.id}`)
        .then((res) => res.json())
        .then((data) => setAssessmentData(data))
        .catch(() => toast.error('Failed to load assessment'))
        .finally(() => setAssessmentLoading(false))
    }
  }, [view, shift?.id])

  useEffect(() => {
    fetch('/api/categories?flat=true')
      .then((res) => res.json())
      .then((data) => { if (data.ok) setCategories(data.categories) })
      .catch(() => {})
  }, [])

  useEffect(() => { registerSW() }, [])

  const fetchProducts = useCallback(async (pageNum: number, append: boolean) => {
    const store = usePosStore.getState()
    if (store.isLoadingProducts) return
    pos.setLoadingProducts(true)
    try {
      const params = new URLSearchParams({ search: store.search, page: String(pageNum) })
      const branchId = user?.branchId || usePosAuth.getState().user?.branchId
      if (branchId) params.set('branchId', branchId)
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
      const res = await fetch(`/api/admin/pos/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          pos.setProductPage(data.items, data.total, data.page, data.totalPages, append)
          if (pageNum === 1) cacheProducts(data.items)
        }
      } else if (!offlineMode) {
        const cached = await getCachedProducts()
        if (cached.length > 0 && !append) pos.setProductPage(cached, cached.length, 1, 1)
      }
    } catch {
      if (!offlineMode) {
        const cached = await getCachedProducts()
        if (cached.length > 0 && !append) pos.setProductPage(cached, cached.length, 1, 1)
      }
    }
    pos.setLoadingProducts(false)
  }, [user?.branchId, selectedCategoryId, offlineMode, pos])

  useEffect(() => {
    if (offlineMode) {
      getCachedProducts().then(cached => {
        if (cached.length > 0) pos.setProductPage(cached, cached.length, 1, 1)
      })
      return
    }
    const timer = setTimeout(() => {
      fetchProducts(1, false)
    }, pos.search.length < 1 && !selectedCategoryId ? 0 : 300)
    return () => clearTimeout(timer)
  }, [pos.search, user?.branchId, selectedCategoryId, offlineMode, fetchProducts, pos])

  const loadMore = useCallback(() => {
    const store = usePosStore.getState()
    if (store.isLoadingProducts || store.currentPage >= store.totalPages) return
    fetchProducts(store.currentPage + 1, true)
  }, [fetchProducts])

  const handleStartShift = useCallback(async () => {
    if (!user?.branchId) return
    try {
      const res = await fetch('/api/admin/pos/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: user.branchId, startingCash: parseFloat(startingCash) || 0 }),
      })
      if (res.ok) {
        const data = await res.json()
        setShift(data.shift)
        setShowStartShift(false)
        setStartingCash('')
        toast.success('Shift started')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to start shift')
      }
    } catch { toast.error('Failed to start shift') }
  }, [user?.branchId, startingCash])

  const handleCloseShift = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pos/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift?.id, endingCash: parseFloat(endingCash) || 0, notes: shiftNotes }),
      })
      if (res.ok) {
        const data = await res.json()
        setShiftSummary(data.shift)
        setShift(null)
        setShowCloseShift(false)
        setEndingCash('')
        setShiftNotes('')
        toast.success('Shift closed')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to close shift')
      }
    } catch { toast.error('Failed to close shift') }
  }, [shift?.id, endingCash, shiftNotes])

  const handleApplyDiscount = useCallback(async () => {
    if (!pos.discountCode.trim()) return
    try {
      const res = await fetch('/api/admin/pos/validate-discount', {
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

  const handleCheckout = useCallback(async () => {
    if (pos.cart.length === 0) return
    const validationError = validatePayment()
    if (validationError) { toast.error(validationError); return }
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
        pos.setCheckoutLoading(false)
        return
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueOrder(body)
        toast.success('Order queued for sync when back online')
        pos.setCheckoutLoading(false)
        return
      }

      const res = await fetch('/api/admin/pos/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
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
        toast.success('Order completed!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Checkout failed')
      }
    } catch { toast.error('Checkout failed') }
    pos.setCheckoutLoading(false)
  }, [pos.cart, pos.appliedDiscount?.code, pos.paymentMethod, pos.parsedCash, pos.parsedCard, pos.customer, pos.orderNotes, shift?.id])

  const handleAddCustomPrice = useCallback(() => {
    const name = customPriceName.trim() || 'Custom Item'
    const price = parseFloat(customPriceAmount)
    if (!price || price <= 0) { toast.error('Enter a valid price'); return }
    pos.addToCart({ id: `custom-${Date.now()}`, name, price, stock: 999, imageUrl: '', sku: '' })
    setShowCustomPrice(false)
    setCustomPriceName('')
    setCustomPriceAmount('')
    toast.success(`Added ${name}`)
  }, [customPriceName, customPriceAmount, pos])

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

  const handleCategoryChange = useCallback((id: string | null) => {
    setSelectedCategoryId(id)
    if (id) pos.setSearch('')
  }, [pos])

  useEffect(() => {
    if (showCustomPrice) customPriceRef.current?.querySelector('input')?.focus()
  }, [showCustomPrice])

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

  const handleLogout = useCallback(() => { logout(); router.replace('/pos/login') }, [logout, router])

  const handleTabChange = useCallback((tab: View) => {
    if (tab !== 'pos' && !shift) {
      toast.error('Start a shift first')
      return
    }
    setView(tab)
  }, [shift])

  const checkoutDisabled = useMemo(() =>
    pos.cart.length === 0 ||
    pos.checkoutLoading ||
    (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total && pos.parsedCash > 0) ||
    (pos.paymentMethod === 'split' && (pos.parsedCash <= 0 || pos.parsedCard <= 0 || Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01))
  , [pos.cart.length, pos.checkoutLoading, pos.paymentMethod, pos.parsedCash, pos.parsedCard, pos.total])

  useKeyboardShortcuts({
    onF1: () => pos.setPaymentMethod('cash'),
    onF2: () => pos.setPaymentMethod('card'),
    onF3: () => pos.setPaymentMethod('split'),
    onF4: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onF6: () => document.querySelector<HTMLInputElement>('input[placeholder*="SKU"]')?.focus(),
    onF10: () => pos.setPaymentMethod('bank_transfer'),
    onF11: () => pos.setPaymentMethod('instapay'),
    onF12: () => pos.setPaymentMethod('wallet'),
    onEnter: () => { if (!checkoutDisabled) handleCheckout() },
    onEscape: () => { if (pos.cart.length > 0) pos.newSale() },
    onCtrlNumber: (n) => {
      const p = pos.products[n - 1]
      if (p && p.stock > 0) pos.addToCart(p)
    },
  })

  if (!hydrated || !token || !posHydrated) return null

  if (offlineReceipt) return (
    <div className="navy-radial min-h-screen">
      <ReceiptView receipt={offlineReceipt} onNewSale={() => setOfflineReceipt(null)} isOffline />
    </div>
  )

  if (pos.receipt) return (
    <div className="navy-radial min-h-screen">
      <ReceiptView receipt={pos.receipt} onNewSale={pos.newSale} />
    </div>
  )

  if (shiftSummary) {
    return (
      <div className="navy-radial min-h-screen flex items-start justify-center pt-8">
        <div className="pos-glass-strong rounded-xl w-full max-w-md p-6 text-center">
          <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-emerald-400">✓</span>
          </div>
          <h2 className="text-xl font-bold text-silver-soft mb-2">Shift Closed</h2>
          <p className="text-sm text-white/50 mb-6">Shift has been closed successfully</p>
          <div className="space-y-2 text-sm text-left bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex justify-between">
              <span className="text-white/50">Starting Cash</span>
              <span className="font-medium text-silver-soft">E£{(shiftSummary.startingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Ending Cash</span>
              <span className="font-medium text-silver-soft">E£{(shiftSummary.endingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Total Sales</span>
              <span className="font-medium text-silver-soft">E£{(shiftSummary.totalSales || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Order Count</span>
              <span className="font-medium text-silver-soft">{shiftSummary.orderCount || 0}</span>
            </div>
          </div>
          <button onClick={() => { setShiftSummary(null); setView('pos') }} className="w-full px-6 py-2.5 bg-gold text-navy-deep rounded-lg text-sm font-medium hover:bg-gold/90 transition-all font-semibold">
            Start New Shift
          </button>
        </div>
      </div>
    )
  }

  if (!shift && view === 'pos') {
    return (
      <div className="navy-radial min-h-screen">
        <ShiftStartModal
          startingCash={startingCash}
          onStartingCashChange={setStartingCash}
          onStartShift={handleStartShift}
        />
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="navy-radial min-h-screen flex items-center justify-center">
        <div className="text-white/50 text-sm">Start a shift to access this section</div>
      </div>
    )
  }

  if (view === 'assessment') {
    return (
      <div className="navy-radial min-h-screen p-6">
        <AssessmentView
          assessmentData={assessmentData}
          loading={assessmentLoading}
          onBack={() => setView('pos')}
        />
      </div>
    )
  }

  return (
    <PosLayout
      branchName={user?.name || 'Branch'}
      shift={shift}
      activeTab={view}
      onTabChange={handleTabChange}
      onAssessment={() => setView('assessment')}
      onCloseShift={() => setShowCloseShift(true)}
      onLogout={handleLogout}
      offlineMode={offlineMode}
      onToggleOffline={() => setOfflineMode(!offlineMode)}
    >
      <OfflineBanner />
      {view === 'pos' && (
        <div className="flex gap-3 flex-1 min-h-0 min-w-0">
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div className="mb-2 flex-shrink-0">
              <BarcodeInput onProductFound={(p) => pos.addToCart(p)} />
            </div>
            <ProductGrid
              products={pos.products}
              search={pos.search}
              onSearchChange={pos.setSearch}
              onAddToCart={pos.addToCart}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              hasMore={pos.currentPage < pos.totalPages}
              loading={pos.isLoadingProducts}
              onLoadMore={loadMore}
            />
            <button
              onClick={() => setShowCustomPrice(true)}
              className="mt-2 flex-shrink-0 w-full py-1.5 rounded-lg border border-dashed border-white/10 text-[11px] text-white/30 hover:text-white/50 hover:border-white/20 transition-all"
            >
              + Custom Price
            </button>
            <div className={'mt-2 flex-shrink-0 flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ' + (offlineMode ? 'border-amber-500/30 bg-amber-500/[0.06] shadow-[0_0_15px_-6px_rgba(251,191,36,0.2)]' : 'border-white/5 bg-white/[0.02]')}>
              <div className="flex items-center gap-2">
                <div className={'h-6 w-10 rounded-full relative cursor-pointer transition-all duration-300 ' + (offlineMode ? 'bg-amber-500/40' : 'bg-white/10')} onClick={() => setOfflineMode(!offlineMode)}>
                  <div className={'absolute top-0.5 left-0.5 h-5 w-5 rounded-full shadow-md transition-all duration-300 ' + (offlineMode ? 'translate-x-4 bg-amber-400' : 'translate-x-0 bg-white/40')} />
                </div>
                <div>
                  <p className={'font-medium leading-tight ' + (offlineMode ? 'text-amber-300' : 'text-white/50')}>Offline Mode</p>
                  <p className="text-[10px] text-white/25 leading-tight mt-0.5">{offlineMode ? 'Orders saved locally' : 'Sync to server'}</p>
                </div>
              </div>
              <div className={'text-[10px] font-mono px-1.5 py-0.5 rounded ' + (offlineMode ? 'text-amber-400/60 bg-amber-500/10' : 'text-white/15 bg-white/5')}>
                {offlineMode ? 'LOCAL' : 'LIVE'}
              </div>
            </div>
            <OfflineSyncManager />
            <RecentOrders shiftId={shift.id} />
          </div>
          <CartPanel
            cart={pos.cart}
            onUpdateQuantity={pos.updateQuantity}
            onRemove={pos.removeFromCart}
            onSetDiscount={pos.setItemDiscount}
            heldOrders={pos.heldOrders}
            onHoldOrder={pos.holdOrder}
            onRecallOrder={pos.recallOrder}
            onRemoveHeldOrder={pos.removeHeldOrder}
            customerSection={
              <CustomerSearch
                customer={pos.customer}
                setCustomer={pos.setCustomer}
                customerSearch={pos.customerSearch}
                setCustomerSearch={pos.setCustomerSearch}
              />
            }
            discountSection={
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
            }
            notesSection={
              <div>
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wide mb-2">Notes</p>
                {(showNotes || pos.orderNotes) ? (
                  <textarea
                    value={pos.orderNotes}
                    onChange={(e) => pos.setOrderNotes(e.target.value)}
                    placeholder="Order notes..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-gold/30 resize-none"
                  />
                ) : (
                  <button onClick={() => setShowNotes(true)} className="w-full py-2 px-3 rounded-lg border border-dashed border-white/10 text-xs text-white/40 hover:text-white/60 hover:border-white/20 transition-all text-left">
                    + Add Note
                  </button>
                )}
              </div>
            }
            paymentSection={
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
            }
            totalsDisplay={<TotalsDisplay subtotal={pos.subtotal} discountAmount={pos.discountAmount} total={pos.total} itemDiscountTotal={pos.itemDiscountTotal} couponDiscount={pos.appliedDiscount?.amount || 0} taxAmount={pos.taxAmount} />}
            checkoutButton={
              <CheckoutButton
                total={pos.total}
                paymentMethod={pos.paymentMethod}
                disabled={checkoutDisabled}
                loading={pos.checkoutLoading}
                onClick={handleCheckout}
              />
            }
          />
        </div>
      )}

      {view === 'orders' && (
        <div className="flex-1 min-h-0">
          <OrdersTab shiftId={shift.id} onReturnOrder={(id) => { setReturnOrderId(id); setView('returns') }} />
        </div>
      )}

      {view === 'records' && (
        <div className="flex-1 min-h-0">
          <RecordsTab shiftId={shift.id} />
        </div>
      )}

      {view === 'returns' && (
        <div className="flex-1 min-h-0">
          <ReturnsTab shiftId={shift.id} branchId={user?.branchId} returnOrderId={returnOrderId} onReturnOrderIdConsumed={() => setReturnOrderId(null)} />
        </div>
      )}

      {view === 'hall-sale' && (
        <div className="flex-1 min-h-0">
          <HallSaleTab shiftId={shift.id} />
        </div>
      )}

      {showCustomPrice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCustomPrice(false)}>
          <div ref={customPriceRef} className="pos-glass-strong rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-silver-soft">Custom Price Item</h3>
            <input
              value={customPriceName}
              onChange={(e) => setCustomPriceName(e.target.value)}
              placeholder="Item name (optional)"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomPrice() }}
            />
            <input
              value={customPriceAmount}
              onChange={(e) => setCustomPriceAmount(e.target.value)}
              placeholder="Price"
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomPrice() }}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCustomPrice(false)} className="flex-1 py-2 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-all">Cancel</button>
              <button onClick={handleAddCustomPrice} className="flex-1 py-2 rounded-lg bg-gold text-navy-deep text-sm font-semibold hover:bg-gold/90 transition-all">Add</button>
            </div>
          </div>
        </div>
      )}

      {showCloseShift && (
        <ShiftCloseModal
          endingCash={endingCash}
          onEndingCashChange={setEndingCash}
          shiftNotes={shiftNotes}
          onShiftNotesChange={setShiftNotes}
          onClose={handleCloseShift}
          onCancel={() => setShowCloseShift(false)}
          shiftId={shift?.id}
        />
      )}

      {pos.cart.length > 0 && view === 'pos' && (
        <CustomerDisplay itemCount={pos.cart.length} total={pos.total} />
      )}

      {view === 'pos' && <ShortcutsCheatSheet />}
    </PosLayout>
  )
}
