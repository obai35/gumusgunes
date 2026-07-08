'use client'

import { X, Package, CheckCircle, Clock, Truck } from 'lucide-react'
import { useFormatPrice } from '@/hooks/use-format-price'
import { formatDate, cn } from '@/lib/format'
import type { Order } from './OrdersSection'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: Package,
}

type Props = {
  order: Order
  onClose: () => void
}

export function OrderTrackModal({ order, onClose }: Props) {
  const formatPrice = useFormatPrice()
  const StatusIcon = STATUS_ICONS[order.status] || Clock

  const timeline = [
    { label: 'Order Placed', date: order.createdAt, done: true },
    { label: 'Processing', date: null, done: order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' },
    { label: 'Shipped', date: null, done: order.status === 'shipped' || order.status === 'delivered' },
    { label: 'Delivered', date: null, done: order.status === 'delivered' },
  ]

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-navy-deep/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-xl font-semibold text-navy">Track Order</h3>
            <button onClick={onClose} className="p-1 hover:text-gold transition-colors"><X className="h-5 w-5" /></button>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-mono font-semibold text-navy text-lg">{order.orderNumber}</p>
              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
            </div>
            <span className={cn(
              'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full',
              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
              order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
              order.status === 'shipped' ? 'bg-indigo-100 text-indigo-700' :
              'bg-amber-100 text-amber-700'
            )}>
              <StatusIcon className="h-3.5 w-3.5" />
              {STATUS_LABELS[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto p-6 pt-4 space-y-6">
          {/* Timeline */}
          <div>
            <h4 className="text-sm font-semibold text-navy mb-3">Order Progress</h4>
            <div className="space-y-0">
              {timeline.map((step, i) => {
                const isLast = i === timeline.length - 1
                const cancelled = order.status === 'cancelled'
                const stepDone = step.done && !cancelled
                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'h-3 w-3 rounded-full ring-2 mt-0.5',
                        stepDone ? 'bg-gold ring-gold/30' : 'bg-muted ring-border'
                      )} />
                      {!isLast && <div className={cn('w-0.5 h-8', stepDone ? 'bg-gold/40' : 'bg-border')} />}
                    </div>
                    <div className={cn('pb-6', isLast && 'pb-0')}>
                      <p className={cn('text-sm font-medium', stepDone ? 'text-navy' : 'text-muted-foreground')}>{step.label}</p>
                      {step.date && <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold text-navy mb-3">Items ({order.items.length})</h4>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="h-14 w-14 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                    <p className="text-xs font-medium text-navy">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-border pt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-navy">{formatPrice(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment</span>
              <span className="text-navy">{order.paymentMethod || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
