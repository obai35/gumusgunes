'use client'

import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'

type TopProduct = {
  id: string
  name: string
  image: string | null
  revenue: number
  sold: number
  percentage: number
}

type TopProductsProps = {
  loading?: boolean
}

export function TopProducts({ loading }: TopProductsProps) {
  const [products, setProducts] = useState<TopProduct[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)

  useEffect(() => {
    fetch('/api/admin/dashboard/top-products?limit=5')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data.products)) {
          setProducts(data.products)
          setTotalRevenue(data.totalRevenue || 0)
        }
      })
      .catch(() => {})
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          Top Products
        </h3>
        <span className="text-xs text-muted-foreground">
          {totalRevenue > 0 ? `$${totalRevenue.toFixed(2)} total` : ''}
        </span>
      </div>
      {products.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">No product data yet.</p>
      ) : (
        <div className="space-y-3">
          {products.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground w-4">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm text-navy truncate">{p.name}</span>
                  <span className="text-xs font-medium text-navy">${p.revenue.toFixed(2)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(p.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
