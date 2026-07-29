import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    if (!q.trim()) return NextResponse.json({ orders: [] })

    const orders = await sdb.order.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: q } },
          { orderNumber: { contains: q } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderNumber: true,
        receiptNumber: true,
        fullName: true,
        email: true,
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        paymentMethod: true,
        cashAmount: true,
        cardAmount: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}, 'orders')
