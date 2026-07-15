'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Supplier = { id: string; name: string }

export default function NewPurchaseOrder() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; productName: string; sku: string; quantity: number; unitCost: number }>>([])
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/purchase-orders/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers || [])).catch(() => {})
    fetch('/api/admin/products?limit=500').then(r => r.json()).then(d => setProducts(Array.isArray(d.products) ? d.products : [])).catch(() => {})
  }, [])

  function addItem(productId: string) {
    const p = products.find(x => x.id === productId)
    if (!p || items.find(i => i.productId === productId)) return
    setItems([...items, { productId, productName: p.name, sku: p.sku, quantity: 1, unitCost: 0 }])
    setSearchTerm('')
  }

  function removeItem(productId: string) {
    setItems(items.filter(i => i.productId !== productId))
  }

  function updateField(productId: string, field: string, value: number) {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i))
  }

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const total = items.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  async function handleSubmit() {
    if (!supplierId) { toast.error('Select a supplier'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          notes: notes || undefined,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
        }),
      })
      const data = await res.json()
      if (data.ok) { toast.success('Purchase order created'); router.push('/admin/purchase-orders') }
      else toast.error(data.error || 'Failed to create')
    } catch { toast.error('Failed to create purchase order') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">New Purchase Order</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Supplier</h2>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Items</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
            </div>
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg mb-4">
                {filtered.slice(0, 10).map((p: any) => (
                  <button key={p.id} onClick={() => addItem(p.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-border/50 last:border-0 flex items-center gap-2">
                    <Plus className="h-3 w-3 text-gold" />
                    {p.name} <span className="text-muted-foreground">({p.sku})</span>
                  </button>
                ))}
                {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No products found</p>}
              </div>
            )}
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-navy flex-1 truncate">{item.productName} <span className="text-muted-foreground">({item.sku})</span></span>
                  <input type="number" min={1} value={item.quantity} onChange={e => updateField(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border border-border rounded text-sm text-center" placeholder="Qty" />
                  <input type="number" min={0} step={0.01} value={item.unitCost} onChange={e => updateField(item.productId, 'unitCost', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-border rounded text-sm text-center" placeholder="Cost" />
                  <span className="text-sm font-medium text-navy w-20 text-right">${(item.unitCost * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items added</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={3} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 h-fit">
          <h2 className="font-semibold text-navy mb-4">Summary</h2>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-medium text-navy">{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Qty</span><span className="font-medium text-navy">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between border-t border-border pt-2"><span className="font-medium text-navy">Total</span><span className="font-bold text-navy">${total.toFixed(2)}</span></div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{loading ? 'Creating...' : 'Create Purchase Order'}</button>
        </div>
      </div>
    </div>
  )
}
