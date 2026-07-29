'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Loader2, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/format'

type RecentOrder = {
  id: string
  orderNumber: string
  receiptNumber: string | null
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  status: string
  createdAt: string
  items: { id: string; quantity: number; price: number; product: { name: string } }[]
}

type Props = {
  shiftId: string
}

export default function RecentOrders({ shiftId }: Props) {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pos/orders/recent?shiftId=${shiftId}&limit=5`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok) setOrders(data.orders)
      }
    } catch {
      // silent
    }
    setLoading(false)
  }, [shiftId])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  if (loading && orders.length === 0) return null

  return (
    <div className="mt-2 flex-shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wide flex items-center gap-1">
          <Clock className="h-3 w-3" /> Recent Orders
        </p>
        <button onClick={fetchOrders} className="text-white/20 hover:text-white/40 transition-colors" title="Refresh">
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="space-y-1 max-h-[160px] overflow-y-auto scroll-luxury">
        {orders.map((o) => (
          <div key={o.id} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-colors">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/60 truncate">{o.receiptNumber || o.orderNumber}</p>
              <p className="text-[10px] text-white/30 truncate">
                {o.items.length} item{o.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-[11px] font-semibold text-silver-soft">{formatPrice(o.totalAmount)}</p>
              <p className="text-[9px] uppercase text-white/30">{o.paymentMethod}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}