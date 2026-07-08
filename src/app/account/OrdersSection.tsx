'use client'

import { useState, useEffect } from 'react'
import { useFormatPrice } from '@/hooks/use-format-price'
import { formatDate, cn } from '@/lib/format'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, Search, Loader2 } from 'lucide-react'

export type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  status: string
  paymentMethod: string
  createdAt: string
  items: {
    id: string
    quantity: number
    price: number
    product: { name: string; imageUrl: string; slug: string }
  }[]
}

type Props = {
  onTrackOrder: (order: Order) => void
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export function OrdersSection({ onTrackOrder }: Props) {
  const formatPrice = useFormatPrice()
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setOrdersLoading(true)
    try {
      const res = await fetch('/api/user/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } finally { setOrdersLoading(false) }
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{orders.length} order{orders.length !== 1 ? 's' : ''}</p>

      {ordersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 sm:p-5 rounded-2xl border border-border bg-white space-y-3">
              <div className="flex justify-between">
                <div className="space-y-1.5"><Skeleton className="h-4 w-36" /><Skeleton className="h-3 w-24" /></div>
                <div className="flex items-center gap-3"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-5 w-16" /></div>
              </div>
              <div className="flex gap-2"><Skeleton className="h-12 w-12 rounded-lg" /><Skeleton className="h-12 w-12 rounded-lg" /><Skeleton className="h-12 w-12 rounded-lg" /></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No orders yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="p-4 sm:p-5 rounded-2xl border border-border bg-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <p className="font-mono font-semibold text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium px-3 py-1 rounded-full', STATUS_STYLES[order.status] || 'bg-amber-100 text-amber-700')}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="font-display font-semibold text-navy">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {order.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="h-12 w-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center text-xs text-muted-foreground font-medium flex-shrink-0">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                <button onClick={() => onTrackOrder(order)} className="text-xs flex items-center gap-1 text-gold hover:underline font-medium">
                  <Search className="h-3 w-3" /> Track Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
