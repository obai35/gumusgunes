'use client'

import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'

type FunnelStage = { status: string; count: number; label: string; color: string }

const defaultStages: FunnelStage[] = [
  { status: 'pending', label: 'Pending', count: 0, color: 'bg-yellow-500' },
  { status: 'processing', label: 'Processing', count: 0, color: 'bg-blue-500' },
  { status: 'shipped', label: 'Shipped', count: 0, color: 'bg-purple-500' },
  { status: 'delivered', label: 'Delivered', count: 0, color: 'bg-green-500' },
]

type OrderFunnelProps = {
  loading?: boolean
}

export function OrderFunnel({ loading }: OrderFunnelProps) {
  const [stages, setStages] = useState<FunnelStage[]>(defaultStages)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetch('/api/admin/dashboard/funnel')
      .then(r => r.json())
      .then(data => {
        if (data.funnel) {
          setStages(defaultStages.map(s => ({
            ...s,
            count: data.funnel[s.status] || 0,
          })))
          setTotal(data.total || 0)
        }
      })
      .catch(() => {})
  }, [])

  const maxCount = Math.max(...stages.map(s => s.count), 1)

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          Order Funnel
        </h3>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>
      <div className="space-y-3">
        {stages.map(stage => (
          <div key={stage.status}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-gray-600">{stage.label}</span>
              </div>
              <span className="font-medium text-navy">{stage.count}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                style={{ width: `${(stage.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
