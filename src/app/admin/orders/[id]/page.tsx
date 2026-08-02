'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { PaymentVerification } from './PaymentVerification'
import ReturnsSection from './ReturnsSection'
import EditHistory from './EditHistory'
import OrderDetailActions from './OrderDetailActions'

export default function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency, isAr } = useAdminTranslate()
  const { user } = useAdminAuth()
  const [order, setOrder] = useState<any>(null)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    let cancelled = false
    params.then(({ id }) => {
      fetch(`/api/admin/orders/${id}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return
          if (!data.ok || !data.order) { setNotFoundState(true); return }
          setOrder(data.order)
        })
        .catch(() => {
          if (!cancelled) setNotFoundState(true)
        })
    })
    return () => { cancelled = true }
  }, [params])

  if (notFoundState) notFound()
  if (!order) {
    return <p className="text-sm text-muted-foreground p-4">{ta('Loading...')}</p>
  }

  const adminId = user?.id || ''
  const items = order.items.map((i: any) => ({
    id: i.id,
    productId: i.productId,
    product: { name: i.product.name },
    quantity: i.quantity,
    price: i.price,
  }))
  const paymentStatusLabel: Record<string, string> = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    awaiting_verification: 'Awaiting Verification',
    refunded: 'Refunded',
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">{ta('Order')} {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{ta('Placed on')} {fmtDate(order.createdAt)}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">{ta('Items')}</h2>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{ta('SKU')}: {item.product.sku} · {ta('Qty')}: {fmtNum(item.quantity)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-navy">{fmtCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">{ta('Customer')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex"><dt className="w-24 text-muted-foreground">{ta('Name')}</dt><dd className="text-navy">{order.fullName}</dd></div>
              <div className="flex"><dt className="w-24 text-muted-foreground">{ta('Email')}</dt><dd className="text-navy">{order.email}</dd></div>
              {order.phone && <div className="flex"><dt className="w-24 text-muted-foreground">{ta('Phone')}</dt><dd className="text-navy">{order.phone}</dd></div>}
              <div className="flex"><dt className="w-24 text-muted-foreground">{ta('Address')}</dt><dd className="text-navy">{order.address}, {order.city}, {order.postalCode}, {order.country}</dd></div>
            </dl>
          </div>

          <EditHistory editHistory={order.editHistory} />

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">{ta('Notes')}</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <ReturnsSection orderId={order.id} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">{ta('Summary')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">{ta('Subtotal')}</dt><dd className="text-navy">{fmtCurrency(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">{ta('Shipping')}</dt><dd className="text-navy">{order.shipping === 0 ? ta('Free') : fmtCurrency(order.shipping)}</dd></div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">{ta('Discount')}</dt><dd className="text-green-600">-{fmtCurrency(order.discountAmount)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">{ta('Tax')}</dt><dd className="text-navy">{fmtCurrency(order.tax)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><dt className="text-navy">{ta('Total')}</dt><dd className="text-navy">{fmtCurrency(order.totalAmount)}</dd></div>
              {order.refundedAmount > 0 && (
                <div className="flex justify-between pt-1"><dt className="text-red-600">{ta('Refunded')}</dt><dd className="text-red-600">-{fmtCurrency(order.refundedAmount)}</dd></div>
              )}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-display font-semibold text-navy mb-3">{ta('Payment')}</h2>
            <p className="text-sm text-muted-foreground">{ta('Method')}: <span className="font-medium text-navy">{order.paymentMethod}</span></p>
            <p className="text-sm text-muted-foreground">{ta('Status')}: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'awaiting_verification' ? 'text-orange-600' : 'text-navy'}`}>{ta(paymentStatusLabel[order.paymentStatus] || order.paymentStatus)}</span></p>
            {order.paymentMethod === 'card' && order.stripePaymentIntentId && (
              <p className="text-xs text-muted-foreground">{ta('Stripe ID:')} <span className="font-mono">{order.stripePaymentIntentId}</span></p>
            )}
            {order.paymentMethod === 'paypal' && order.paypalOrderId && (
              <p className="text-xs text-muted-foreground">{ta('PayPal ID:')} <span className="font-mono">{order.paypalOrderId}</span></p>
            )}
            {order.walletProvider && (
              <p className="text-xs text-muted-foreground">{ta('Wallet')}: <span className="font-medium text-navy">{order.walletProvider}</span></p>
            )}
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground">{ta('Reference')}: <span className="font-mono font-medium text-navy">{order.paymentReference}</span></p>
            )}
            {order.paymentProofUrl && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">{ta('Payment Proof:')}</p>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <img src={order.paymentProofUrl} alt={ta('Payment Proof')} className="w-full rounded-lg border border-border max-h-40 object-cover" />
                </a>
              </div>
            )}
            {order.paymentVerifiedAt && (
              <p className="text-xs text-muted-foreground">{ta('Verified')}: {fmtDateTime(order.paymentVerifiedAt)}</p>
            )}
            <PaymentVerification orderId={order.id} paymentStatus={order.paymentStatus} />
          </div>
          <OrderDetailActions orderId={order.id} items={items} customer={{ fullName: order.fullName, phone: order.phone, address: order.address, city: order.city, postalCode: order.postalCode, notes: order.notes }} adminId={adminId} />
        </div>
      </div>
    </div>
  )
}
