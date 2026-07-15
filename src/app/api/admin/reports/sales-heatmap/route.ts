import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const fromParam = sp.get('from') || ''
    const toParam = sp.get('to') || ''

    const end = toParam ? new Date(toParam + 'T23:59:59.999Z') : new Date()
    const start = fromParam
      ? new Date(fromParam)
      : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'cancelled' },
      },
      select: { totalAmount: true, createdAt: true },
    })

    const heatmap: Record<string, Record<string, { revenue: number; count: number }>> = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (const day of days) {
      heatmap[day] = {}
      for (let h = 0; h < 24; h++) {
        heatmap[day][h] = { revenue: 0, count: 0 }
      }
    }

    for (const o of orders) {
      const d = new Date(o.createdAt)
      const day = days[d.getDay()]
      const hour = d.getHours()
      if (heatmap[day]?.[hour] !== undefined) {
        heatmap[day][hour].revenue += o.totalAmount
        heatmap[day][hour].count++
      }
    }

    const grid = days.map(day => ({
      day,
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        revenue: Math.round(heatmap[day][i].revenue * 100) / 100,
        count: heatmap[day][i].count,
      })),
    }))

    const totals = {
      totalRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
      totalOrders: orders.length,
    }

    const maxRevenue = Math.max(
      ...days.flatMap(d => Object.values(heatmap[d]).map(v => v.revenue)),
      1
    )

    const busiestHour = days.reduce<{ day: string; hour: number; count: number }>(
      (best, day) => {
        for (let h = 0; h < 24; h++) {
          if (heatmap[day][h].count > best.count) {
            best = { day, hour: h, count: heatmap[day][h].count }
          }
        }
        return best
      },
      { day: '', hour: 0, count: 0 }
    )

    return NextResponse.json({
      grid,
      days,
      maxRevenue,
      totals: { totalRevenue: Math.round(totals.totalRevenue * 100) / 100, totalOrders: totals.totalOrders },
      busiestHour,
    })
  } catch (e) {
    console.error('Sales heatmap error:', e)
    return NextResponse.json({ error: 'Failed to load heatmap' }, { status: 500 })
  }
}, 'reports')
