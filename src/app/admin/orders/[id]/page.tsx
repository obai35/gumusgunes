import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { PaymentVerification } from './PaymentVerification'
import ReturnsSection from './ReturnsSection'
import EditHistory from './EditHistory'
import OrderDetailActions from './OrderDetailActions'

export const dynamic = 'force-dynamic'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await db.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, discount: true },
  })
  if (!order) notFound()

  const cookieStore = await cookies()
  const adminId = cookieStore.get('adminId')?.value || ''

  const items = order.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    product: { name: i.product.name },
    quantity: i.quantity,
    price: i.price,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.createdAt.toLocaleDateString()}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-navy">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex"><dt className="w-24 text-muted-foreground">Name</dt><dd className="text-navy">{order.fullName}</dd></div>
              <div className="flex"><dt className="w-24 text-muted-foreground">Email</dt><dd className="text-navy">{order.email}</dd></div>
              {order.phone && <div className="flex"><dt className="w-24 text-muted-foreground">Phone</dt><dd className="text-navy">{order.phone}</dd></div>}
              <div className="flex"><dt className="w-24 text-muted-foreground">Address</dt><dd className="text-navy">{order.address}, {order.city}, {order.postalCode}, {order.country}</dd></div>
            </dl>
          </div>

          <EditHistory editHistory={order.editHistory} />

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <ReturnsSection orderId={order.id} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-navy">${order.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-navy">{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</dd></div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-green-600">-${order.discountAmount.toFixed(2)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="text-navy">${order.tax.toFixed(2)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><dt className="text-navy">Total</dt><dd className="text-navy">${order.totalAmount.toFixed(2)}</dd></div>
              {order.refundedAmount > 0 && (
                <div className="flex justify-between pt-1"><dt className="text-red-600">Refunded</dt><dd className="text-red-600">-${order.refundedAmount.toFixed(2)}</dd></div>
              )}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-display font-semibold text-navy mb-3">Payment</h2>
            <p className="text-sm text-muted-foreground">Method: <span className="font-medium text-navy">{order.paymentMethod}</span></p>
            <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'awaiting_verification' ? 'text-orange-600' : 'text-navy'}`}>{order.paymentStatus}</span></p>
            {order.paymentMethod === 'card' && order.stripePaymentIntentId && (
              <p className="text-xs text-muted-foreground">Stripe ID: <span className="font-mono">{order.stripePaymentIntentId}</span></p>
            )}
            {order.paymentMethod === 'paypal' && order.paypalOrderId && (
              <p className="text-xs text-muted-foreground">PayPal ID: <span className="font-mono">{order.paypalOrderId}</span></p>
            )}
            {order.walletProvider && (
              <p className="text-xs text-muted-foreground">Wallet: <span className="font-medium text-navy">{order.walletProvider}</span></p>
            )}
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground">Reference: <span className="font-mono font-medium text-navy">{order.paymentReference}</span></p>
            )}
            {order.paymentProofUrl && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Payment Proof:</p>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <img src={order.paymentProofUrl} alt="Payment proof" className="w-full rounded-lg border border-border max-h-40 object-cover" />
                </a>
              </div>
            )}
            {order.paymentVerifiedAt && (
              <p className="text-xs text-muted-foreground">Verified: {new Date(order.paymentVerifiedAt).toLocaleString()}</p>
            )}
            <PaymentVerification orderId={order.id} paymentStatus={order.paymentStatus} />
          </div>
          <OrderDetailActions orderId={order.id} items={items} customer={{ fullName: order.fullName, phone: order.phone, address: order.address, city: order.city, postalCode: order.postalCode, notes: order.notes }} adminId={adminId} />
        </div>
      </div>
    </div>
  )
}
