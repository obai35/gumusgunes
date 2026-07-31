import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

const CAIRO_TZ = 'Africa/Cairo'
const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const monthKeyFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: CAIRO_TZ, year: 'numeric', month: '2-digit' })

function trendKey(date: Date, period: string): string {
  if (period === 'weekly') {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    return dateKeyFormatter.format(weekStart)
  }
  if (period === 'monthly') {
    return monthKeyFormatter.format(date)
  }
  return dateKeyFormatter.format(date)
}

function getDateRange(period: string, dateFrom?: string | null, dateTo?: string | null) {
  if (dateFrom && dateTo) {
    const start = new Date(dateFrom)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'daily':
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'weekly': {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'monthly':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
  }
  return { start, end }
}

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = req.nextUrl
    const period = searchParams.get('period') || 'daily'
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const branchId = searchParams.get('branchId')

    const { start, end } = getDateRange(period, dateFrom, dateTo)

    const orderWhere: Record<string, unknown> = {
      createdAt: { gte: start, lte: end },
      status: { not: 'cancelled' },
    }
    if (branchId) {
      orderWhere.shift = { branchId }
    }

    const [orders, returnsAgg, shifts] = await Promise.all([
      sdb.order.findMany({
        where: orderWhere,
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
          shift: { include: { branch: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      sdb.return.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          refundMethod: { not: 'no_refund' },
        },
        _sum: { refundAmount: true },
      }),
      sdb.shift.findMany({
        where: {
          ...(branchId ? { branchId } : {}),
          closedAt: { gte: start, lte: end },
        },
        include: { branch: { select: { name: true } } },
        orderBy: { closedAt: 'desc' },
        take: 20,
      }),
    ])

    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const orderCount = orders.length
    const avgOrderValue = orderCount > 0 ? totalSales / orderCount : 0
    const totalReturns = returnsAgg._sum.refundAmount || 0

    const trendMap: Record<string, { revenue: number; orders: number }> = {}
    for (const o of orders) {
      const key = trendKey(new Date(o.createdAt), period)
      if (!trendMap[key]) trendMap[key] = { revenue: 0, orders: 0 }
      trendMap[key].revenue += o.totalAmount
      trendMap[key].orders += 1
    }
    const revenueTrend = Object.entries(trendMap)
      .map(([date, val]) => ({ date, ...val }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const productMap: Record<string, { name: string; sku: string; quantity: number; revenue: number }> = {}
    for (const o of orders) {
      for (const item of o.items) {
        const pid = item.product.id
        if (!productMap[pid]) {
          productMap[pid] = { name: item.product.name, sku: item.product.sku, quantity: 0, revenue: 0 }
        }
        productMap[pid].quantity += item.quantity
        productMap[pid].revenue += item.price * item.quantity
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    const paymentMap: Record<string, { method: string; total: number; count: number }> = {}
    for (const o of orders) {
      const m = o.paymentMethod
      if (!paymentMap[m]) paymentMap[m] = { method: m, total: 0, count: 0 }
      paymentMap[m].total += o.totalAmount
      paymentMap[m].count += 1
    }
    const paymentBreakdown = Object.values(paymentMap)

    const shiftPerformance = shifts.map(s => ({
      shiftId: s.id,
      branchName: s.branch.name,
      startedAt: s.startedAt.toISOString(),
      closedAt: s.closedAt?.toISOString() || null,
      totalSales: s.totalSales,
      orderCount: s.orderCount,
      avgOrderValue: s.orderCount > 0 ? s.totalSales / s.orderCount : 0,
    }))

    return NextResponse.json({
      ok: true,
      overview: { totalSales, orderCount, avgOrderValue, totalReturns },
      revenueTrend,
      topProducts,
      paymentBreakdown,
      shiftPerformance,
    })
  } catch (err) {
    console.error('GET /api/admin/pos/analytics error:', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}, 'pos')
