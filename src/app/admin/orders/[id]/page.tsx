import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { OrderStatusUpdater } from './OrderStatusUpdater'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, discount: true },
  })
  if (!order) notFound()

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

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
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
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Payment</h2>
            <p className="text-sm text-muted-foreground">Method: {order.paymentMethod}</p>
            <p className="text-sm text-muted-foreground">Status: {order.paymentStatus}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
