import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { orderId, methodId, trackingNumber, shippedAt, estimatedDeliveryAt, notes } = await req.json()
  if (!orderId || !methodId || !trackingNumber) {
    return NextResponse.json({ error: 'orderId, methodId, and trackingNumber are required' }, { status: 400 })
  }

  const order = await sdb.order.findFirst({
    where: { id: orderId },
    select: { id: true, address: true, city: true, postalCode: true, country: true, fullName: true, phone: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const existing = await sdb.shipment.findFirst({ where: { orderId } })
  if (existing) return NextResponse.json({ error: 'Shipment already exists for this order' }, { status: 400 })

  const shipment = await sdb.$transaction(async (tx) => {
    const s = await tx.shipment.create({
      data: {
        orderId,
        methodId,
        trackingNumber,
        status: 'shipped',
        shippedAt: shippedAt ? new Date(shippedAt) : new Date(),
        estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : null,
        addressSnapshot: JSON.stringify(order),
        notes: notes || null,
      } as any,
    })
    await tx.order.update({ where: { id: orderId }, data: { status: 'shipped' } })
    return s
  })

  return NextResponse.json({ shipment })
}, 'shipping')
