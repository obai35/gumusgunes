import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [pending, stats] = await Promise.all([
    db.order.findMany({
      where: { paymentStatus: 'awaiting_verification' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, orderNumber: true, fullName: true, totalAmount: true,
        paymentMethod: true, paymentReference: true, walletProvider: true,
        createdAt: true, notes: true,
      },
    }),
    db.order.aggregate({
      where: { paymentStatus: 'awaiting_verification' },
      _count: true,
    }),
  ])

  return NextResponse.json({ orders: pending, total: stats._count })
}
