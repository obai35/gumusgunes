'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { ArrowLeft, Plus, Trash2, Save, X } from 'lucide-react'
import Link from 'next/link'

type ProductBrief = { id: string; name: string; sku: string; price: number; costPrice: number | null; imageUrl: string | null }

type PriceListDetail = {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  value: number | null
  currency: string
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  items: { id: string; product: ProductBrief; price: number; minQuantity: number }[]
}

export default function PriceListDetailPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const params = useParams()
  const router = useRouter()
  const [list, setList] = useState<PriceListDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', type: 'markup', value: '', currency: 'EGP', isActive: true })
  const [addProduct, setAddProduct] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<ProductBrief[]>([])
  const [newPrice, setNewPrice] = useState('')

  const fetchList = () =>
    fetch(`/api/admin/pricing/price-lists/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d)
        setForm({
          name: d.name, description: d.description || '', type: d.type,
          value: d.value?.toString() || '', currency: d.currency, isActive: d.isActive,
        })
      })
      .finally(() => setLoading(false))

  useEffect(() => { fetchList() }, [params.id])

  const saveList = async () => {
    const res = await fetch(`/api/admin/pricing/price-lists/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, description: form.description,
        type: form.type, value: form.value ? Number(form.value) : null,
        currency: form.currency, isActive: form.isActive,
      }),
    })
    if (!res.ok) { toast.error(ta('Failed to save')); return }
    toast.success(ta('Saved'))
    setEditing(false)
    fetchList()
  }

  const searchProducts = async (q: string) => {
    setSearch(q)
    if (q.length < 2) { setSearchResults([]); return }
    const res = await fetch(`/api/admin/products?search=${encodeURIComponent(q)}&limit=10`)
    if (res.ok) setSearchResults(await res.json())
  }

  const addItem = async (productId: string) => {
    const price = Number(newPrice) || 0
    if (!price) { toast.error(ta('Enter a price')); return }
    const res = await fetch(`/api/admin/pricing/price-lists/${params.id}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, price, minQuantity: 1 }),
    })
    if (!res.ok) { toast.error(ta('Failed to add')); return }
    toast.success(ta('Item added'))
    setAddProduct(false)
    setSearch('')
    setNewPrice('')
    setSearchResults([])
    fetchList()
  }

  const removeItem = async (itemId: string) => {
    if (!confirm(ta('Remove this item?'))) return
    const res = await fetch(`/api/admin/pricing/price-lists/${params.id}/items/${itemId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error(ta('Failed to remove')); return }
    toast.success(ta('Removed'))
    fetchList()
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">{ta('Loading...')}</div>
  if (!list) return <div className="p-8 text-center text-muted-foreground">{ta('Not found')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing/lists" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{list.name}</h1>
            <p className="text-sm text-muted-foreground">{list.slug} · {list.currency}</p>
          </div>
        </div>
        <button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm">
          <Save className="h-4 w-4" /> {ta(editing ? 'Cancel' : 'Edit')}
        </button>
      </div>

      {editing && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded border px-3 py-2 text-sm" placeholder={ta('Name')} />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2 text-sm" placeholder={ta('Description')} />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="markup">{ta('Markup %')}</option>
              <option value="fixed">{ta('Fixed Price')}</option>
            </select>
            <input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="rounded border px-3 py-2 text-sm" placeholder={ta('Default value')} />
            <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="rounded border px-3 py-2 text-sm" placeholder={ta('Currency')} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              {ta('Active')}
            </label>
          </div>
          <button onClick={saveList} className="rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground">
            <Save className="inline h-4 w-4 mr-1" /> {ta('Save Changes')}
          </button>
        </motion.div>
      )}

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">{ta('Items')} ({fmtNum(list.items.length)})</span>
          <button onClick={() => setAddProduct(!addProduct)} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <Plus className="h-4 w-4" /> {ta('Add Product')}
          </button>
        </div>

        {addProduct && (
          <div className="border-b bg-muted/30 p-4 space-y-3">
            <input
              value={search}
              onChange={(e) => searchProducts(e.target.value)}
              placeholder={ta('Search products...')}
              className="w-full rounded border px-3 py-2 text-sm"
            />
            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded bg-background px-3 py-2 text-sm">
                    <span>{p.name} ({p.sku})</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={ta('Price')}
                        className="w-24 rounded border px-2 py-1 text-xs"
                        onChange={(e) => setNewPrice(e.target.value)}
                      />
                      <button onClick={() => addItem(p.id)} className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground">{ta('Add')}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="divide-y">
          {list.items.map((item) => (
            <div key={item.id} className="px-4 py-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                {item.product.imageUrl && <img src={item.product.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />}
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product.sku} · {ta('Cost')}: {item.product.costPrice?.toFixed(2) ?? '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-semibold">{item.price.toFixed(2)} {list.currency}</p>
                {item.product.costPrice && item.product.costPrice > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {ta('Margin')}: {((item.price - item.product.costPrice) / item.price * 100).toFixed(1)}%
                  </span>
                )}
                {item.minQuantity > 1 && <span className="text-xs text-muted-foreground">{ta('Min')}: {fmtNum(item.minQuantity)}</span>}
                <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {list.items.length === 0 && <p className="px-4 py-8 text-center text-muted-foreground">{ta('No items yet')}</p>}
        </div>
      </div>
    </div>
  )
}
