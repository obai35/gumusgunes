import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const [pending, stats] = await Promise.all([
    sdb.order.findMany({
      where: { paymentStatus: 'awaiting_verification' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, orderNumber: true, fullName: true, totalAmount: true,
        paymentMethod: true, paymentReference: true, walletProvider: true,
        createdAt: true, notes: true,
      },
    }),
    sdb.order.aggregate({
      where: { paymentStatus: 'awaiting_verification' },
      _count: true,
    }),
  ])

  return NextResponse.json({ orders: pending, total: stats._count })
}, 'orders')
