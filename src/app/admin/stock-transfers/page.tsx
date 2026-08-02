'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ArrowLeftRight, Building2, History, Search, Plus, X } from 'lucide-react'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Tab = 'transfer' | 'view' | 'history'

export default function StockTransfersPage() {
  const [tab, setTab] = useState<Tab>('transfer')
  const { ta } = useAdminTranslate()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">{ta('Stock Transfers')}</h1>
      </div>
      <div className="flex gap-1 mb-6 border-b border-border">
        {([
          { id: 'transfer' as Tab, label: ta('New Transfer'), icon: Plus },
          { id: 'view' as Tab, label: ta('Branch Stock'), icon: Building2 },
          { id: 'history' as Tab, label: ta('History'), icon: History },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'transfer' && <NewTransfer />}
      {tab === 'view' && <BranchStockView />}
      {tab === 'history' && <TransferHistory />}
    </div>
  )
}

function NewTransfer() {
  const { user } = useAdminAuth()
  const { ta } = useAdminTranslate()
  const [branches, setBranches] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [categoryFilter, setCategoryFilter] = useState('')
  const [fromType, setFromType] = useState('warehouse')
  const [fromId, setFromId] = useState('')
  const [toType, setToType] = useState('branch')
  const [toId, setToId] = useState('')
  const [transferItems, setTransferItems] = useState<Array<{ productId: string; productName: string; quantity: number }>>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/branches').then((r) => r.json()).then((data) => setBranches(Array.isArray(data.branches) ? data.branches : [])).catch(() => {})
    fetch('/api/admin/categories').then((r) => r.json()).then((data) => setCategories(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (categoryFilter) params.set('categoryId', categoryFilter)
    fetch(`/api/admin/products?${params}`).then((r) => r.json()).then((data) => setProducts(Array.isArray(data.products) ? data.products : [])).catch(() => {})
  }, [categoryFilter])

  function addItem(productId: string) {
    const p = products.find((p: any) => p.id === productId)
    if (!p || transferItems.find((i) => i.productId === productId)) return
    setTransferItems([...transferItems, { productId, productName: p.name, quantity: 1 }])
    setSearchTerm('')
  }

  function removeItem(productId: string) {
    setTransferItems(transferItems.filter((i) => i.productId !== productId))
  }

  function updateQty(productId: string, qty: number) {
    setTransferItems(transferItems.map((i) => i.productId === productId ? { ...i, quantity: Math.max(1, qty) } : i))
  }

  async function handleSubmit() {
    if (fromType === 'branch' && !fromId) { toast.error(ta('Select source branch')); return }
    if (toType === 'branch' && !toId) { toast.error(ta('Select destination branch')); return }
    if (transferItems.length === 0) { toast.error(ta('Add at least one product')); return }
    if (fromType === 'branch' && toType === 'branch' && fromId === toId) { toast.error(ta('Cannot transfer to same branch')); return }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromType, fromId: fromType === 'branch' ? fromId : undefined,
          toType, toId: toType === 'branch' ? toId : undefined,
          items: transferItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          note: note || undefined,
          createdById: user?.id || '',
        }),
      })
      if (res.ok) { toast.success(ta('Transfer completed')); setTransferItems([]); setNote('') }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error(ta('Transfer failed')) }
    finally { setLoading(false) }
  }

  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-navy mb-4">{ta('Source & Destination')}</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-navy block mb-1">{ta('Source')}</label>
              <select value={fromType} onChange={(e) => { setFromType(e.target.value); setFromId('') }} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="warehouse">{ta('Warehouse (Main Stock)')}</option>
                <option value="branch">{ta('Branch')}</option>
              </select>
              {fromType === 'branch' && (
                <select value={fromId} onChange={(e) => setFromId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-2">
                  <option value="">{ta('Select branch...')}</option>
                  {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">{ta('Destination')}</label>
              <select value={toType} onChange={(e) => { setToType(e.target.value); setToId('') }} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="branch">{ta('Branch')}</option>
                <option value="warehouse">{ta('Warehouse (Main Stock)')}</option>
              </select>
              {toType === 'branch' && (
                <select value={toId} onChange={(e) => setToId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-2">
                  <option value="">{ta('Select branch...')}</option>
                  {branches.filter((b: any) => b.id !== fromId).map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-navy block mb-1">{ta('Note')}</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" placeholder={ta('Optional note...')} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-semibold text-navy mb-4">{ta('Transfer Items')}</h2>
          <div className="flex gap-2 mb-4">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm min-w-[160px]">
              <option value="">{ta('All Categories')}</option>
              {Array.isArray(categories) && categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={ta('Search products...')} className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
            </div>
          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg mb-4">
              {filteredProducts.slice(0, 10).map((p: any) => (
                <button key={p.id} onClick={() => addItem(p.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-border/50 last:border-0">
                  {p.name} <span className="text-muted-foreground">({p.sku})</span>
                  {p.category && <span className="text-xs text-muted-foreground ml-2">— {p.category.name}</span>}
                </button>
              ))}
              {filteredProducts.length === 0 && <p className="p-3 text-sm text-muted-foreground">{ta('No products found')}</p>}
            </div>
          )}
          <div className="space-y-2">
            {transferItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-sm text-navy flex-1 truncate">{item.productName}</span>
                <input type="number" min={1} value={item.quantity} onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border border-border rounded text-sm text-center" />
                <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
              </div>
            ))}
            {transferItems.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{ta('No items added yet')}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5 h-fit">
        <h2 className="font-semibold text-navy mb-4">{ta('Summary')}</h2>
        <div className="space-y-2 text-sm mb-6">
          <div className="flex justify-between"><span className="text-muted-foreground">{ta('Source')}</span><span className="font-medium text-navy">{fromType === 'warehouse' ? ta('Warehouse') : branches.find((b: any) => b.id === fromId)?.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{ta('Destination')}</span><span className="font-medium text-navy">{toType === 'warehouse' ? ta('Warehouse') : branches.find((b: any) => b.id === toId)?.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{ta('Items')}</span><span className="font-medium text-navy">{transferItems.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{ta('Total Qty')}</span><span className="font-medium text-navy">{transferItems.reduce((s, i) => s + i.quantity, 0)}</span></div>
        </div>
        <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 flex items-center justify-center gap-2">
          <ArrowLeftRight className="h-4 w-4" /> {loading ? ta('Transferring...') : ta('Execute Transfer')}
        </button>
      </div>
    </div>
  )
}

function BranchStockView() {
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [stocks, setStocks] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [allData, setAllData] = useState<any>(null)
  const { ta } = useAdminTranslate()

  useEffect(() => {
    fetch('/api/admin/branches').then((r) => r.json()).then((data) => setBranches(Array.isArray(data.branches) ? data.branches : [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBranch) return
    fetch(`/api/admin/branch-stock?branchId=${selectedBranch}`)
      .then((r) => r.json()).then((data) => setStocks(Array.isArray(data) ? data : [])).catch(() => setStocks([]))
  }, [selectedBranch])

  useEffect(() => {
    fetch('/api/admin/branch-stock?all=true')
      .then((r) => r.json()).then(setAllData).catch(() => {})
  }, [])

  const filtered = stocks.filter((s) =>
    s.productName.toLowerCase().includes(search.toLowerCase()) || s.sku.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm min-w-[200px]">
          <option value="">{ta('Select a branch...')}</option>
          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ta('Search products...')} className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
        </div>
      </div>

      {selectedBranch && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium">{ta('SKU')}</th>
              <th className="p-3 font-medium text-right">{ta('Branch Stock')}</th><th className="p-3 font-medium text-right">{ta('Warehouse Stock')}</th>
            </tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.productId} className="border-b border-border/50">
                  <td className="p-3 font-medium text-navy">{s.productName}</td>
                  <td className="p-3 text-muted-foreground">{s.sku}</td>
                  <td className="p-3 text-right font-medium text-navy">{s.quantity}</td>
                  <td className="p-3 text-right text-muted-foreground">{s.mainStock}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{ta('No stock records')}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {!selectedBranch && allData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allData.branches?.map((branch: any) => (
            <div key={branch.branchId} className="bg-white rounded-xl border border-border p-5">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2"><Building2 className="h-4 w-4" /> {branch.branchName}</h3>
              <div className="space-y-1 text-sm">
                {Array.isArray(branch.stocks) && branch.stocks.slice(0, 5).map((s: any) => (
                  <div key={s.productId} className="flex justify-between"><span className="text-muted-foreground truncate">{s.productName}</span><span className="font-medium text-navy">{s.quantity}</span></div>
                ))}
                {branch.stocks.length > 5 && <p className="text-xs text-muted-foreground">{ta('...and')} {branch.stocks.length - 5} {ta('more')}</p>}
                {branch.stocks.length === 0 && <p className="text-xs text-muted-foreground">{ta('No stock')}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TransferHistory() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [branchFilter, setBranchFilter] = useState('')
  const { ta } = useAdminTranslate()

  useEffect(() => {
    fetch('/api/admin/branches').then((r) => r.json()).then((data) => setBranches(Array.isArray(data.branches) ? data.branches : [])).catch(() => {})
  }, [])

  useEffect(() => {
    const params = branchFilter ? `?branchId=${branchFilter}` : ''
    fetch(`/api/admin/stock-transfers${params}`)
      .then((r) => r.json()).then((data) => setTransfers(Array.isArray(data) ? data : [])).catch(() => setTransfers([]))
  }, [branchFilter])

  const locationName = (type: string, id: string | null) => {
    if (type === 'warehouse') return ta('Warehouse')
    return branches.find((b: any) => b.id === id)?.name || id || '—'
  }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">{ta('All Branches')}</option>
          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">{ta('Date')}</th><th className="p-3 font-medium">{ta('From')}</th><th className="p-3 font-medium">{ta('To')}</th>
            <th className="p-3 font-medium">{ta('Product')}</th><th className="p-3 font-medium text-right">{ta('Qty')}</th><th className="p-3 font-medium">{ta('Note')}</th><th className="p-3 font-medium">{ta('Admin')}</th>
          </tr></thead>
          <tbody>
            {Array.isArray(transfers) && transfers.map((t) => (
              <tr key={t.id} className="border-b border-border/50">
                <td className="p-3 text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleString()}</td>
                <td className="p-3 font-medium text-navy">{locationName(t.fromType, t.fromId)}</td>
                <td className="p-3 font-medium text-navy">{locationName(t.toType, t.toId)}</td>
                <td className="p-3 text-navy">{t.productName} <span className="text-muted-foreground">({t.sku})</span></td>
                <td className="p-3 text-right font-medium text-navy">{t.quantity}</td>
                <td className="p-3 text-muted-foreground text-xs">{t.note || '—'}</td>
                <td className="p-3 text-muted-foreground">{t.adminName}</td>
              </tr>
            ))}
            {transfers.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">{ta('No transfers yet')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
