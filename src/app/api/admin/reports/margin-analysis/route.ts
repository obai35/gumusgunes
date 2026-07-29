import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const months = parseInt(sp.get('months') || '12')
    const categoryId = sp.get('categoryId') || ''

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    start.setHours(0, 0, 0, 0)

    const orders = await sdb.order.findMany({
      where: {
        createdAt: { gte: start },
        status: { not: 'cancelled' },
      },
      include: {
        items: {
          include: { product: { select: { categoryId: true, price: true, costPrice: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const categories = await sdb.category.findMany({ select: { id: true, name: true } })
    const catMap = new Map(categories.map(c => [c.id, c.name]))

    const monthlyData: Record<string, { revenue: number; cost: number; orders: number }> = {}
    const categoryData: Record<string, { revenue: number; cost: number; orders: number }> = {}

    for (const order of orders) {
      const d = new Date(order.createdAt)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, cost: 0, orders: 0 }

      for (const item of order.items) {
        const revenue = item.price * item.quantity
        const unitCost = item.product?.costPrice ?? item.product?.price * 0.6 ?? 0
        const cost = unitCost * item.quantity
        monthlyData[monthKey].revenue += revenue
        monthlyData[monthKey].cost += cost
        monthlyData[monthKey].orders++

        const catId = item.product?.categoryId || 'unknown'
        if (!categoryId || catId === categoryId) {
          if (!categoryData[catId]) categoryData[catId] = { revenue: 0, cost: 0, orders: 0 }
          categoryData[catId].revenue += revenue
          categoryData[catId].cost += cost
          categoryData[catId].orders++
        }
      }
    }

    const trend = Object.entries(monthlyData)
      .map(([month, d]) => ({
        month,
        revenue: Math.round(d.revenue * 100) / 100,
        cost: Math.round(d.cost * 100) / 100,
        grossProfit: Math.round((d.revenue - d.cost) * 100) / 100,
        margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const catBreakdown = Object.entries(categoryData)
      .map(([catId, d]) => ({
        categoryId: catId,
        categoryName: catMap.get(catId) || 'Unknown',
        revenue: Math.round(d.revenue * 100) / 100,
        cost: Math.round(d.cost * 100) / 100,
        grossProfit: Math.round((d.revenue - d.cost) * 100) / 100,
        margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0)
    const totalCost = trend.reduce((s, t) => s + t.cost, 0)
    const overallMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : 0

    return NextResponse.json({
      trend,
      categoryBreakdown: catBreakdown,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGrossProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
        overallMargin,
      },
    })
  } catch (e) {
    console.error('Margin analysis error:', e)
    return NextResponse.json({ error: 'Failed to load margin analysis' }, { status: 500 })
  }
}, 'reports')
