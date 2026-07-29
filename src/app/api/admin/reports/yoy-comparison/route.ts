import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const years = parseInt(sp.get('years') || '3')
    const metric = sp.get('metric') || 'revenue'

    const currentYear = new Date().getFullYear()
    const result: any[] = []

    for (let y = currentYear - years + 1; y <= currentYear; y++) {
      const start = new Date(y, 0, 1)
      const end = new Date(y, 11, 31, 23, 59, 59, 999)

      if (metric === 'revenue' || metric === 'all') {
        const revenueAgg = await sdb.order.aggregate({
          where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
          _sum: { totalAmount: true },
        })

        const ordersByMonth: Record<string, number> = {}
        const monthlyOrders = await sdb.order.findMany({
          where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })

        for (const o of monthlyOrders) {
          const m = `${y}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
          ordersByMonth[m] = (ordersByMonth[m] || 0) + o.totalAmount
        }

        result.push({
          year: y,
          revenue: Math.round((revenueAgg._sum.totalAmount || 0) * 100) / 100,
          orderCount: monthlyOrders.length,
          monthlyRevenue: Object.entries(ordersByMonth)
            .map(([month, rev]) => ({ month, revenue: Math.round(rev * 100) / 100 }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        })
      }

      if (metric === 'customers' || metric === 'all') {
        const customerCount = await sdb.user.count({
          where: { createdAt: { gte: start, lte: end } },
        })
        if (!result.find(r => r.year === y)) {
          result.push({ year: y, customers: customerCount })
        } else {
          const existing = result.find(r => r.year === y)!
          existing.customers = customerCount
        }
      }
    }

    const comparisons = result.map((r, i) => {
      const prev = i > 0 ? result[i - 1] : null
      const revChange = prev && prev.revenue
        ? Math.round(((r.revenue - prev.revenue) / prev.revenue) * 1000) / 10
        : null
      const orderChange = prev && prev.orderCount
        ? Math.round(((r.orderCount - prev.orderCount) / prev.orderCount) * 1000) / 10
        : null
      const custChange = prev && prev.customers
        ? Math.round(((r.customers - prev.customers) / prev.customers) * 1000) / 10
        : null
      return { ...r, revChange, orderChange, custChange }
    })

    return NextResponse.json({
      years: comparisons,
      metric,
    })
  } catch (e) {
    console.error('YoY comparison error:', e)
    return NextResponse.json({ error: 'Failed to load YoY comparison' }, { status: 500 })
  }
}, 'reports')
