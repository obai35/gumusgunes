import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const type = sp.get('type') || 'daily'
    const fromParam = sp.get('from') || ''
    const toParam = sp.get('to') || ''

    const now = new Date()
    let from: Date
    let to: Date = new Date(now)
    to.setHours(23, 59, 59, 999)

    if (fromParam) {
      from = new Date(fromParam)
    } else if (type === 'weekly') {
      from = new Date(now)
      from.setDate(from.getDate() - 27)
      from.setHours(0, 0, 0, 0)
    } else if (type === 'monthly') {
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
    }
    if (toParam) to = new Date(toParam + 'T23:59:59.999Z')

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: 'cancelled' },
      },
      orderBy: { createdAt: 'asc' },
    })

    const grouped: Record<string, { revenue: number; count: number }> = {}
    for (const order of orders) {
      let key: string
      if (type === 'monthly') {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      } else if (type === 'weekly') {
        const d = new Date(order.createdAt)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      } else {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${String(order.createdAt.getDate()).padStart(2, '0')}`
      }
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 }
      grouped[key].revenue += order.totalAmount
      grouped[key].count++
    }

    const periods = Object.entries(grouped).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }))

    const totalRevenue = periods.reduce((s, p) => s + p.revenue, 0)
    const totalOrders = periods.reduce((s, p) => s + p.orderCount, 0)

    return NextResponse.json({
      periods,
      summary: { totalRevenue, totalOrders, avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0 },
      type,
      from: from.toISOString(),
      to: to.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
