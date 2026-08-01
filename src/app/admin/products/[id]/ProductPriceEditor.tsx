'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp, History, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type CostEntry = {
  id: string
  unitCost: number
  quantity: number
  totalCost: number
  beforeCost: number | null
  afterCost: number | null
  reference: string | null
  note: string | null
  type: string
  createdAt: string
}

type PriceListItem = {
  id: string
  price: number
  minQuantity: number
  productId: string
  product?: { id: string; name: string; sku: string; price: number; costPrice: number | null; imageUrl: string | null }
}

type PriceList = {
  id: string
  name: string
  slug: string
  type: string
  value: number | null
  currency: string
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  items: PriceListItem[]
  _count: { items: number }
}

export default function ProductPriceEditor({ productId, costPrice, price }: { productId: string; costPrice: number | null; price: number }) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [costHistory, setCostHistory] = useState<CostEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [recordCost, setRecordCost] = useState(false)
  const [unitCost, setUnitCost] = useState('')
  const [costNote, setCostNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/pricing/price-lists?productId=${productId}`).then(r => r.json()),
      fetch(`/api/admin/pricing/cost-history?productId=${productId}&limit=10`).then(r => r.json()),
    ]).then(([lists, historyRes]) => {
      setPriceLists(Array.isArray(lists) ? lists : [])
      const history = historyRes.items ?? historyRes
      setCostHistory(Array.isArray(history) ? history : [])
    }).catch(() => {
      toast.error(ta('Failed to load pricing data'))
    }).finally(() => setLoading(false))
  }, [productId])

  const margin = costPrice && costPrice > 0 && price > 0 ? ((price - costPrice) / price * 100) : null

  async function handleRecordCost(e: React.FormEvent) {
    e.preventDefault()
    if (!unitCost || parseFloat(unitCost) <= 0) { toast.error(ta('Enter a valid cost')); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/pricing/cost-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, unitCost: parseFloat(unitCost), quantity: 1, note: costNote || undefined }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(ta('Cost recorded'))
      setUnitCost(''); setCostNote(''); setRecordCost(false)
      const historyRes = await fetch(`/api/admin/pricing/cost-history?productId=${productId}&limit=10`).then(r => r.json())
      const history = historyRes.items ?? historyRes
      setCostHistory(Array.isArray(history) ? history : [])
    } catch { toast.error(ta('Failed to record cost')) } finally { setSaving(false) }
  }

  async function handleToggleItem(priceListId: string, action: 'add' | 'remove') {
    if (action === 'add') {
      const priceVal = prompt(ta('Enter price for this product in the list:'))
      if (!priceVal || parseFloat(priceVal) <= 0) return
      try {
        const res = await fetch(`/api/admin/pricing/price-lists/${priceListId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, price: parseFloat(priceVal) }),
        })
        if (!res.ok) throw new Error('Failed')
        toast.success(ta('Product added to price list'))
        const lists = await fetch(`/api/admin/pricing/price-lists?productId=${productId}`).then(r => r.json())
        setPriceLists(Array.isArray(lists) ? lists : [])
      } catch { toast.error(ta('Failed to add product')) }
    }
  }

  if (loading) return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6 space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6">
      <h2 className="font-display font-semibold text-navy mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5" /> {ta('Pricing & Cost')}
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="p-3 rounded-lg bg-secondary/20">
          <p className="text-xs text-muted-foreground">{ta('Selling Price')}</p>
          <p className="text-xl font-semibold text-navy">{fmtCurrency(price)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/20">
          <p className="text-xs text-muted-foreground">{ta('Cost Price')}</p>
          <p className="text-xl font-semibold text-navy">{costPrice ? fmtCurrency(costPrice) : '—'}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/20">
          <p className="text-xs text-muted-foreground">{ta('Margin')}</p>
          <p className={`text-xl font-semibold ${margin !== null && margin >= 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            {margin !== null ? `${margin.toFixed(1)}%` : '—'}
          </p>
        </div>
      </div>

      <div className="mb-5">
        <button onClick={() => setRecordCost(!recordCost)} className="flex items-center gap-2 text-sm font-medium text-navy mb-3">
          <Plus className="h-4 w-4" /> {ta('Record Cost')}
        </button>
        {recordCost && (
          <form onSubmit={handleRecordCost} className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground">{ta('Unit Cost')}</label>
              <input type="number" step="0.01" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-28 px-3 py-2 rounded-lg border border-border text-sm mt-1" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">{ta('Note (optional)')}</label>
              <input value={costNote} onChange={e => setCostNote(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" />
            </div>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {ta(saving ? 'Saving...' : 'Save')}
            </button>
          </form>
        )}
      </div>

      <div className="mb-5">
        <h3 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> {ta('Price Lists')}
        </h3>
        <div className="space-y-2">
          {priceLists.length === 0 ? (
            <p className="text-sm text-muted-foreground">{ta('No price lists configured')}</p>
          ) : (
            priceLists.map(pl => {
              const item = pl.items?.[0]
              return (
                <div key={pl.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pl.name}</span>
                    {pl.isDefault && <span className="text-xs px-1.5 py-0.5 rounded bg-gold/10 text-gold">{ta('Default')}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {item ? (
                      <span className="font-semibold">{fmtCurrency(item.price)} {pl.currency}</span>
                    ) : (
                      <button onClick={() => handleToggleItem(pl.id, 'add')} className="text-xs text-gold hover:text-gold/80 transition-colors">{ta('Add')}</button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-navy mb-3 flex items-center gap-2">
          <History className="h-4 w-4" /> {ta('Recent Cost History')}
        </h3>
        {costHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">{ta('No cost history recorded')}</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {costHistory.map(entry => (
              <div key={entry.id} className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0">
                <div>
                  <span className="font-medium">{fmtCurrency(entry.unitCost)}</span>
                  <span className="text-muted-foreground ml-2">× {fmtNum(entry.quantity)}</span>
                  {entry.note && <span className="text-muted-foreground ml-2">— {entry.note}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{fmtDate(entry.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}