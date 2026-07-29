'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { History, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type CostEntry = {
  id: string
  product: { id: string; name: string; sku: string; imageUrl: string | null }
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

type ProductBrief = { id: string; name: string; sku: string }

export default function CostHistoryPage() {
  const [entries, setEntries] = useState<CostEntry[]>([])
  const [products, setProducts] = useState<ProductBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [productFilter, setProductFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchEntries = () => {
    const params = new URLSearchParams()
    if (productFilter) params.set('productId', productFilter)
    if (typeFilter) params.set('type', typeFilter)
    params.set('page', String(page))
    params.set('limit', '30')

    fetch(`/api/admin/pricing/cost-history?${params}`)
      .then(r => r.json())
      .then(d => {
        setEntries(Array.isArray(d.items) ? d.items : [])
        setTotalPages(d.totalPages || 1)
      })
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetch('/api/admin/products?limit=1000')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d.items ?? d) ? (d.items ?? d) : []))
      .catch(() => {})
  }, [])

  useEffect(() => { setPage(1); fetchEntries() }, [productFilter, typeFilter])
  useEffect(() => { fetchEntries() }, [page])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" /> Cost History
          </h1>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm appearance-none bg-white"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="w-48 px-3 py-2 rounded-lg border border-border text-sm bg-white"
        >
          <option value="">All Types</option>
          <option value="purchase">Purchase</option>
          <option value="manufactured">Manufactured</option>
          <option value="manual_adjustment">Manual Adjustment</option>
        </select>
      </div>

      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 text-sm font-medium text-muted-foreground grid grid-cols-12 gap-4">
          <span className="col-span-3">Product</span>
          <span className="col-span-2">Unit Cost</span>
          <span className="col-span-1">Qty</span>
          <span className="col-span-2">Total</span>
          <span className="col-span-2">Type</span>
          <span className="col-span-2 text-right">Date</span>
        </div>
        <div className="divide-y">
          {entries.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="px-4 py-3 text-sm grid grid-cols-12 gap-4 items-center"
            >
              <div className="col-span-3">
                <Link href={`/admin/products/${e.product.id}/edit`} className="font-medium hover:underline">
                  {e.product.name}
                </Link>
                <span className="text-muted-foreground ml-1">({e.product.sku})</span>
              </div>
              <span className="col-span-2 font-medium">{e.unitCost.toFixed(2)}</span>
              <span className="col-span-1 text-muted-foreground">{e.quantity}</span>
              <span className="col-span-2">{e.totalCost.toFixed(2)}</span>
              <span className="col-span-2">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                  e.type === 'purchase' ? 'bg-blue-100 text-blue-700' :
                  e.type === 'manufactured' ? 'bg-green-100 text-green-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>{e.type.replace('_', ' ')}</span>
              </span>
              <span className="col-span-2 text-right text-muted-foreground">
                {new Date(e.createdAt).toLocaleDateString()}
              </span>
            </motion.div>
          ))}
          {entries.length === 0 && !loading && (
            <p className="px-4 py-8 text-center text-muted-foreground">No cost history entries found</p>
          )}
          {loading && (
            <p className="px-4 py-8 text-center text-muted-foreground">Loading...</p>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}