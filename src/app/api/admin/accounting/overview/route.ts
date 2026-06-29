import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      todayOrders,
      pendingOrders,
      unreconciledOrders,
      openShifts,
      totalRevenue,
      pendingRefunds,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: { notIn: ['delivered', 'cancelled'] } } }),
      prisma.order.count({ where: { reconciledAt: null, paymentStatus: 'paid' } }),
      prisma.shift.count({ where: { isOpen: true } }),
      prisma.order.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.return.count({
        where: { refundMethod: { not: 'no_refund' }, createdAt: { gte: today } },
      }),
    ])

    const openShiftsList = await prisma.shift.findMany({
      where: { isOpen: true },
      include: { branch: { select: { name: true } } },
    })

    return NextResponse.json({
      todayOrders,
      todayRevenue: totalRevenue._sum.totalAmount || 0,
      pendingOrders,
      unreconciledOrders,
      pendingRefunds,
      openShifts: openShiftsList.length,
      openShiftBranches: openShiftsList.map((s: any) => s.branch.name),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
