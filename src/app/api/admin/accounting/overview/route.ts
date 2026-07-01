import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function getDateRange(period: string, date?: string): { start: Date; end: Date } {
  const now = date ? new Date(date) : new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'day': {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'week': {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'month': {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'year': {
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
    }
  }
  return { start, end }
}

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'day'
    const date = req.nextUrl.searchParams.get('date') || undefined
    const { start, end } = getDateRange(period, date)

    const [
      orders,
      pendingOrders,
      unreconciledOrders,
      openShifts,
      revenueAgg,
      returns,
      expensesSum,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
        include: { shift: { select: { branch: { select: { name: true } } } } },
      }),
      prisma.order.count({ where: { status: { notIn: ['delivered', 'cancelled'] } } }),
      prisma.order.count({ where: { reconciledAt: null, paymentStatus: 'paid' } }),
      prisma.shift.count({ where: { isOpen: true } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
        _sum: { totalAmount: true },
      }),
      prisma.return.findMany({
        where: { createdAt: { gte: start, lte: end }, refundMethod: { not: 'no_refund' } },
      }),
      prisma.expense.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = revenueAgg._sum.totalAmount || 0
    const totalReturns = returns.reduce((sum, r) => sum + r.refundAmount, 0)
    const totalExpenses = expensesSum._sum.amount || 0
    const netRevenue = totalRevenue - totalReturns - totalExpenses

    const paymentBreakdown: Record<string, number> = {
      cash: 0, card: 0, split: 0, bank_transfer: 0, instapay: 0, wallet: 0,
    }
    for (const o of orders) {
      if (o.paymentMethod === 'split') {
        paymentBreakdown.cash += o.cashAmount || 0
        paymentBreakdown.card += o.cardAmount || 0
      } else if (o.paymentMethod in paymentBreakdown) {
        paymentBreakdown[o.paymentMethod] += o.totalAmount
      }
    }

    const branchRevenue: Record<string, number> = {}
    for (const o of orders) {
      const name = o.shift?.branch?.name || 'Unknown'
      branchRevenue[name] = (branchRevenue[name] || 0) + o.totalAmount
    }

    const openShiftsList = await prisma.shift.findMany({
      where: { isOpen: true },
      include: { branch: { select: { name: true } } },
    })

    const statusCounts: Record<string, number> = {}
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    }

    return NextResponse.json({
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      totalOrders: orders.length,
      totalRevenue,
      totalReturns,
      totalExpenses,
      netRevenue,
      pendingOrders,
      unreconciledOrders,
      pendingRefunds: returns.length,
      openShifts: openShiftsList.length,
      openShiftBranches: openShiftsList.map((s: any) => s.branch.name),
      paymentBreakdown,
      branchRevenue,
      statusCounts,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}
