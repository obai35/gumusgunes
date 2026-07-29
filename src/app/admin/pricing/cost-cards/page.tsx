'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Search, ArrowLeft, Calculator, RefreshCw, TrendingDown, TrendingUp, ExternalLink, BarChart3, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '../../accounting/format'

type CostCard = {
  id: string; name: string; sku: string; imageUrl: string | null
  price: number; costPrice: number | null
  category: { id: string; name: string } | null
  breakdown: {
    materialCost: number; laborCost: number; mfgOverhead: number
    adminOverhead: number; sellingOverhead: number
    totalCost: number; currentPrice: number; margin: number | null
    lastAllocatedAt: string
  } | null
  margin: number | null
}

export default function CostCardsPage() {
  const [items, setItems] = useState<CostCard[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCosted, setFilterCosted] = useState(false)
  const [allocating, setAllocating] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)

  function fetchData() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterCosted) params.set('hasCost', 'true')

    fetch(`/api/admin/pricing/cost-cards?${params}`)
      .then(r => r.json()).then(setItems).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filterCosted])

  async function runAllocation() {
    setAllocating(true)
    try {
      const res = await fetch('/api/admin/pricing/calculate', { method: 'POST' })
      const data = await res.json()
      if (data.errors?.length) toast.warning(`${data.productsCosted} costed with ${data.errors.length} errors`)
      else toast.success(`Costed ${data.productsCosted} products`)
      fetchData()
    } catch { toast.error('Allocation failed') } finally { setAllocating(false) }
  }

  const filtered = items.filter(i =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const breakdownBars = (b: NonNullable<CostCard['breakdown']>) => {
    const max = Math.max(b.materialCost, b.laborCost, b.mfgOverhead, b.adminOverhead, b.sellingOverhead, 1)
    const bar = (val: number, color: string) => (
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex-1">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${(val / max) * 100}%` }} />
      </div>
    )
    return (
      <div className="space-y-1.5 mt-2">
        {[{ label: 'Material', val: b.materialCost, color: 'bg-blue-500' },
          { label: 'Labor', val: b.laborCost, color: 'bg-green-500' },
          { label: 'Mfg OH', val: b.mfgOverhead, color: 'bg-amber-500' },
          { label: 'Admin OH', val: b.adminOverhead, color: 'bg-purple-500' },
          { label: 'Selling OH', val: b.sellingOverhead, color: 'bg-rose-500' },
        ].map(r => (
          <div key={r.label} className="flex items-center gap-2 text-[10px]">
            <span className="w-14 text-muted-foreground">{r.label}</span>
            {bar(r.val, r.color)}
            <span className="w-16 text-right font-mono">{formatCurrency(r.val)}</span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing" className="text-muted-foreground hover:text-primary"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">Cost Cards</h1>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={filterCosted} onChange={e => setFilterCosted(e.target.checked)} className="rounded" />
            Costed only
          </label>
          <button onClick={runAllocation} disabled={allocating} className="inline-flex items-center gap-1.5 rounded-lg bg-navy text-silver px-3 py-2 text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${allocating ? 'animate-spin' : ''}`} />
            {allocating ? 'Allocating...' : 'Run Allocation'}
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products by name or SKU..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map(item => {
          const marginColor = item.breakdown?.margin != null
            ? (item.breakdown.margin >= 30 ? 'text-green-600' : item.breakdown.margin >= 10 ? 'text-amber-600' : 'text-red-600')
            : 'text-muted-foreground'

          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border bg-card p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelected(selected === item.id ? null : item.id)
                if (selected !== item.id) {
                  fetch(`/api/admin/pricing/cost-cards/${item.id}`).then(r => r.json()).then(setDetail)
                }
              }}>
              <div className="flex items-center gap-3 mb-2">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" width={32} height={32} className="rounded object-cover" />
                ) : (
                  <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center"><DollarSign className="h-4 w-4 text-muted-foreground" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{formatCurrency(item.price)}</p>
                  {item.breakdown?.totalCost && <p className="text-xs text-muted-foreground">Cost: {formatCurrency(item.breakdown.totalCost)}</p>}
                </div>
              </div>

              {item.breakdown ? (
                <>
                  {breakdownBars(item.breakdown)}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border text-xs">
                    <span className={`font-medium ${marginColor}`}>
                      {item.breakdown.margin != null ? `${item.breakdown.margin.toFixed(1)}% margin` : 'No price'}
                    </span>
                    <span className="text-muted-foreground">{new Date(item.breakdown.lastAllocatedAt).toLocaleDateString()}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground mt-2 italic">No cost breakdown yet. Run allocation.</p>
              )}
            </motion.div>
          )
        })}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No products found.</div>}
      </div>
    </div>
  )
}
