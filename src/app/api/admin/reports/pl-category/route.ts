import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'month'
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = parseInt(sp.get('month') || String(new Date().getMonth() + 1))

    const now = new Date()
    let start: Date, end: Date
    if (period === 'month') {
      start = new Date(year, month - 1, 1)
      end = new Date(year, month, 0, 23, 59, 59, 999)
    } else if (period === 'quarter') {
      const qStart = Math.floor((month - 1) / 3) * 3
      start = new Date(year, qStart, 1)
      end = new Date(year, qStart + 3, 0, 23, 59, 59, 999)
    } else {
      start = new Date(year, 0, 1)
      end = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    const categories = await sdb.category.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: start, lte: end },
                  status: { not: 'cancelled' },
                },
              },
              include: { order: { select: { totalAmount: true } }, product: { select: { costPrice: true, price: true } } },
            },
          },
        },
      },
    })

    const result = categories
      .map(cat => {
        const items = cat.products.flatMap(p => p.orderItems)
        const revenue = items.reduce((s, i) => s + (i.price * i.quantity), 0)
        const cost = items.reduce((s, i) => {
          const unitCost = i.product?.costPrice ?? (i.product?.price || 0) * 0.6
          return s + (unitCost * i.quantity)
        }, 0)
        const grossProfit = revenue - cost
        const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
        const orderCount = new Set(items.map(i => i.orderId)).size
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          revenue: Math.round(revenue * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          orderCount,
        }
      })
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    const totalRevenue = result.reduce((s, c) => s + c.revenue, 0)
    const totalCost = result.reduce((s, c) => s + c.cost, 0)
    const totalGrossProfit = result.reduce((s, c) => s + c.grossProfit, 0)
    const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      categories: result,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        overallMargin: Math.round(overallMargin * 100) / 100,
      },
      period,
    })
  } catch (e) {
    console.error('P&L category error:', e)
    return NextResponse.json({ error: 'Failed to load P&L by category' }, { status: 500 })
  }
}, 'reports')
