'use client'

import { posFetch } from '@/lib/pos-client-fetch'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart } from 'lucide-react'
import { usePosAuth } from '@/lib/pos-auth-store'
import { usePos } from './hooks/usePos'
import { usePosSettings } from './hooks/usePosSettings'
import { usePosStore } from './stores/posStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import PosLayout from './components/PosLayout'
import BarcodeInput from './components/BarcodeInput'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import RecentOrders from './components/RecentOrders'
import ShiftStartModal from './components/ShiftStartModal'
import ShiftCloseModal from './components/ShiftCloseModal'
import AssessmentView from './components/AssessmentView'
import OrdersTab from './components/OrdersTab'
import RecordsTab from './components/RecordsTab'
import HallSaleTab from './components/HallSaleTab'
import ReturnsTab from './components/ReturnsTab'
import CustomerDisplay from './components/CustomerDisplay'
import OfflineBanner from './components/OfflineBanner'
import OfflineSyncManager from './components/OfflineSyncManager'
import ShortcutsCheatSheet from './components/ShortcutsCheatSheet'
import { formatPrice } from '@/lib/format'
import { registerSW } from '@/lib/offline'
import { cacheProducts, getCachedProducts } from '@/lib/pos-db'
import type { Shift, ShiftSummary, Category } from './types'

type View = 'pos' | 'orders' | 'records' | 'returns' | 'hall-sale' | 'assessment'

export default function POSPage() {
  const router = useRouter()
  const { user, logout } = usePosAuth()
  const authLoading = usePosAuth((s) => s.loading)

  useEffect(() => {
    usePosAuth.getState().fetchUser()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) router.replace('/pos/login')
  }, [authLoading, user, router])

  const pos = usePos()
  const [posHydrated, setPosHydrated] = useState(false)

  usePosSettings(true)

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
  const offlineMode = usePosStore((s) => s.offlineMode)
  const setOfflineMode = usePosStore((s) => s.setOfflineMode)
  const setOfflineReceipt = usePosStore((s) => s.setOfflineReceipt)
  const search = usePosStore((s) => s.search)
  const setProductPage = usePosStore((s) => s.setProductPage)
  const setLoadingProducts = usePosStore((s) => s.setLoadingProducts)
  const addToCart = usePosStore((s) => s.addToCart)
  const setSearch = usePosStore((s) => s.setSearch)

  useEffect(() => {
    if (user?.branchId) {
      posFetch(`/api/admin/pos/shifts/active?branchId=${user.branchId}`)
        .then((res) => res.json())
        .then((data) => { if (data.ok && data.shift) setShift(data.shift) })
        .catch(() => {})
    }
  }, [user?.branchId])

  useEffect(() => {
    if (view === 'assessment' && shift?.id) {
      setAssessmentLoading(true)
      posFetch(`/api/admin/pos/shifts/summary?shiftId=${shift.id}`)
        .then((res) => res.json())
        .then((data) => setAssessmentData(data))
        .catch(() => toast.error('Failed to load assessment'))
        .finally(() => setAssessmentLoading(false))
    }
  }, [view, shift?.id])

  useEffect(() => {
    posFetch('/api/categories?flat=true')
      .then((res) => res.json())
      .then((data) => { if (data.ok) setCategories(data.categories) })
      .catch(() => {})
  }, [])

  useEffect(() => { registerSW() }, [])

  const fetchProducts = useCallback(async (pageNum: number, append: boolean) => {
    const store = usePosStore.getState()
    if (store.isLoadingProducts) return
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams({ search: store.search, page: String(pageNum) })
      const branchId = user?.branchId || usePosAuth.getState().user?.branchId
      if (branchId) params.set('branchId', branchId)
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
      const res = await posFetch(`/api/admin/pos/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          setProductPage(data.items, data.total, data.page, data.totalPages, append)
          if (pageNum === 1) cacheProducts(data.items)
        }
      } else if (!offlineMode) {
        const cached = await getCachedProducts()
        if (cached.length > 0 && !append) setProductPage(cached, cached.length, 1, 1)
      }
    } catch {
      if (!offlineMode) {
        const cached = await getCachedProducts()
        if (cached.length > 0 && !append) setProductPage(cached, cached.length, 1, 1)
      }
    }
    setLoadingProducts(false)
  }, [user?.branchId, selectedCategoryId, offlineMode, setProductPage, setLoadingProducts])

  useEffect(() => {
    if (offlineMode) {
      getCachedProducts().then(cached => {
        if (cached.length > 0) setProductPage(cached, cached.length, 1, 1)
      })
      return
    }
    const timer = setTimeout(() => {
      fetchProducts(1, false)
    }, search.length < 1 && !selectedCategoryId ? 0 : 300)
    return () => clearTimeout(timer)
  }, [search, user?.branchId, selectedCategoryId, offlineMode, fetchProducts, setProductPage])

  const loadMore = useCallback(() => {
    const store = usePosStore.getState()
    if (store.isLoadingProducts || store.currentPage >= store.totalPages) return
    fetchProducts(store.currentPage + 1, true)
  }, [fetchProducts])

  const handleStartShift = useCallback(async () => {
    if (!user?.branchId) return
    try {
      const res = await posFetch('/api/admin/pos/shifts/start', {
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
      const res = await posFetch('/api/admin/pos/shifts/close', {
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

  const handleAddCustomPrice = useCallback(() => {
    const name = customPriceName.trim() || 'Custom Item'
    const price = parseFloat(customPriceAmount)
    if (!price || price <= 0) { toast.error('Enter a valid price'); return }
    pos.addToCart({ id: `custom-${Date.now()}`, name, price, stock: 999, imageUrl: '', sku: '' })
    setShowCustomPrice(false)
    setCustomPriceName('')
    setCustomPriceAmount('')
    toast.success(`Added ${name}`)
  }, [customPriceName, customPriceAmount, addToCart])

  const handleCategoryChange = useCallback((id: string | null) => {
    setSelectedCategoryId(id)
    if (id) setSearch('')
  }, [setSearch])

  useEffect(() => {
    if (showCustomPrice) customPriceRef.current?.querySelector('input')?.focus()
  }, [showCustomPrice])

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/pos/auth/logout', { method: 'POST' }) } catch {}
    logout()
    router.replace('/pos/login')
  }, [logout, router])

  const handleTabChange = useCallback((tab: View) => {
    if (tab !== 'pos' && !shift) {
      toast.error('Start a shift first')
      return
    }
    setView(tab)
  }, [shift])

  useKeyboardShortcuts({
    onF4: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onF6: () => document.querySelector<HTMLInputElement>('input[placeholder*="SKU"]')?.focus(),
    onEscape: () => { if (pos.cart.length > 0) pos.newSale() },
    onCtrlNumber: (n) => {
      const p = pos.products[n - 1]
      if (p && p.stock > 0) pos.addToCart(p)
    },
  })

  if (authLoading || !user || !posHydrated) return null

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
            paymentButton={
              <button
                onClick={() => {
                  pos.setReceipt(null)
                  setOfflineReceipt(null)
                  router.push('/pos/payment')
                }}
                disabled={pos.cart.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-gold to-amber-400 text-navy-deep text-sm font-bold uppercase tracking-wider hover:from-gold/90 hover:to-amber-400/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_-6px_rgba(212,175,55,0.5)] transition-all"
              >
                <ShoppingCart className="h-4 w-4" />
                Proceed to Payment · {formatPrice(pos.total)}
              </button>
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

      {view === 'pos' && <ShortcutsCheatSheet page="pos" />}
    </PosLayout>
  )
}
