import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'pending'

  const shipments = await sdb.shipment.findMany({
    include: {
      order: { select: { orderNumber: true, fullName: true, totalAmount: true, createdAt: true, address: true, city: true } },
      method: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const pendingOrders = filter === 'pending'
    ? await sdb.order.findMany({
        where: {
          status: { in: ['confirmed', 'processing'] },
          shipment: null,
          shippingMethodId: { not: null },
          OR: [
            { paymentStatus: 'paid' },
            { paymentMethod: 'cod' },
          ],
        },
        include: { shippingMethod: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      })
    : []

  return NextResponse.json({ shipments, pendingOrders })
}, 'shipping')
