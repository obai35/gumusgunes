'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePosAuth } from '@/lib/pos-auth-store'
import { usePos } from './hooks/usePos'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import PosLayout from './components/PosLayout'
import BarcodeInput from './components/BarcodeInput'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import DiscountSection from './components/DiscountSection'
import PaymentSection from './components/PaymentSection'
import TotalsDisplay from './components/TotalsDisplay'
import CheckoutButton from './components/CheckoutButton'
import ReceiptView from './components/ReceiptView'
import ShiftStartModal from './components/ShiftStartModal'
import ShiftCloseModal from './components/ShiftCloseModal'
import AssessmentView from './components/AssessmentView'
import CustomerDisplay from './components/CustomerDisplay'
import type { Shift, ShiftSummary } from './types'

export default function POSPage() {
  const router = useRouter()
  const { token, user, logout } = usePosAuth()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (hydrated && !token) router.replace('/pos/login')
  }, [hydrated, token, router])

  const pos = usePos()

  const [shift, setShift] = useState<Shift | null>(null)
  const [showStartShift, setShowStartShift] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [endingCash, setEndingCash] = useState('')
  const [shiftNotes, setShiftNotes] = useState('')
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
  const [view, setView] = useState<'pos' | 'assessment'>('pos')
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)

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
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/pos/products?search=${encodeURIComponent(pos.search)}`)
        if (res.ok) pos.setProducts(await res.json())
      } catch {}
    }, pos.search.length < 1 ? 0 : 300)
    return () => clearTimeout(timer)
  }, [pos.search])

  async function handleStartShift() {
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
  }

  async function handleCloseShift() {
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
  }

  async function handleApplyDiscount() {
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
  }

  async function handleCheckout() {
    if (pos.cart.length === 0) return
    const validationError = validatePayment()
    if (validationError) { toast.error(validationError); return }
    pos.setCheckoutLoading(true)
    try {
      const body: any = {
        items: pos.cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discountCode: pos.appliedDiscount?.code,
        paymentMethod: pos.paymentMethod,
        shiftId: shift?.id,
      }
      if (pos.paymentMethod === 'cash' || pos.paymentMethod === 'split') body.cashAmount = pos.parsedCash
      if (pos.paymentMethod === 'split') body.cardAmount = pos.parsedCard

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
        })
        toast.success('Order completed!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Checkout failed')
      }
    } catch { toast.error('Checkout failed') }
    pos.setCheckoutLoading(false)
  }

  function validatePayment(): string | null {
    if (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total) {
      return `Amount tendered ($${pos.parsedCash.toFixed(2)}) is less than total ($${pos.total.toFixed(2)})`
    }
    if (pos.paymentMethod === 'split') {
      if (pos.parsedCash <= 0 || pos.parsedCard <= 0) return 'Both amounts must be greater than 0 for split payment'
      if (Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01) return 'Split amounts must equal total'
    }
    return null
  }

  function handleLogout() { logout(); router.replace('/pos/login') }

  const checkoutDisabled =
    pos.cart.length === 0 ||
    pos.checkoutLoading ||
    (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total && pos.parsedCash > 0) ||
    (pos.paymentMethod === 'split' && (pos.parsedCash <= 0 || pos.parsedCard <= 0 || Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01))

  useKeyboardShortcuts({
    onF1: () => pos.setPaymentMethod('cash'),
    onF2: () => pos.setPaymentMethod('card'),
    onF3: () => pos.setPaymentMethod('split'),
    onF4: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onF6: () => document.querySelector<HTMLInputElement>('input[placeholder*="SKU"]')?.focus(),
    onEnter: () => { if (!checkoutDisabled) handleCheckout() },
    onEscape: () => { if (pos.cart.length > 0) pos.newSale() },
  })

  if (!hydrated || !token) return null

  if (pos.receipt) return <ReceiptView receipt={pos.receipt} onNewSale={pos.newSale} />

  if (shiftSummary) {
    return (
      <div className="flex items-start justify-center min-h-[60vh] pt-8">
        <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Shift Closed</h2>
          <p className="text-sm text-muted-foreground mb-6">Shift has been closed successfully</p>
          <div className="space-y-2 text-sm text-left bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Starting Cash</span>
              <span className="font-medium text-navy">${(shiftSummary.startingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ending Cash</span>
              <span className="font-medium text-navy">${(shiftSummary.endingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Sales</span>
              <span className="font-medium text-navy">${(shiftSummary.totalSales || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Count</span>
              <span className="font-medium text-navy">{shiftSummary.orderCount || 0}</span>
            </div>
          </div>
          <button onClick={() => { setShiftSummary(null); setView('pos') }} className="w-full px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
            Start New Shift
          </button>
        </div>
      </div>
    )
  }

  if (!shift && view === 'pos') {
    return (
      <ShiftStartModal
        startingCash={startingCash}
        onStartingCashChange={setStartingCash}
        onStartShift={handleStartShift}
      />
    )
  }

  if (view === 'assessment') {
    return (
      <AssessmentView
        assessmentData={assessmentData}
        loading={assessmentLoading}
        onBack={() => setView('pos')}
      />
    )
  }

  return (
    <PosLayout
      branchName={user?.name || 'Branch'}
      shift={shift}
      onAssessment={() => setView('assessment')}
      onCloseShift={() => setShowCloseShift(true)}
      onLogout={handleLogout}
    >
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3">
            <BarcodeInput
              onProductFound={(p) => pos.addToCart(p)}
            />
          </div>
          <ProductGrid
            products={pos.products}
            search={pos.search}
            onSearchChange={pos.setSearch}
            onAddToCart={pos.addToCart}
          />
        </div>
        <CartPanel
          cart={pos.cart}
          onUpdateQuantity={pos.updateQuantity}
          onRemove={pos.removeFromCart}
          discountSection={
            <DiscountSection
              discountCode={pos.discountCode}
              onDiscountCodeChange={pos.setDiscountCode}
              onApplyDiscount={handleApplyDiscount}
              appliedDiscount={pos.appliedDiscount}
              onRemoveDiscount={() => { pos.setAppliedDiscount(null); pos.setDiscountCode('') }}
              discountAmount={pos.discountAmount}
            />
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
          totalsDisplay={<TotalsDisplay subtotal={pos.subtotal} discountAmount={pos.discountAmount} total={pos.total} />}
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

      {showCloseShift && (
        <ShiftCloseModal
          endingCash={endingCash}
          onEndingCashChange={setEndingCash}
          shiftNotes={shiftNotes}
          onShiftNotesChange={setShiftNotes}
          onClose={handleCloseShift}
          onCancel={() => setShowCloseShift(false)}
        />
      )}

      {pos.cart.length > 0 && (
        <CustomerDisplay itemCount={pos.cart.length} total={pos.total} />
      )}
    </PosLayout>
  )
}
