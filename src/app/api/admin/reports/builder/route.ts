import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { metrics, dimension, filters, from, to } = await req.json()
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({ error: 'At least one metric required' }, { status: 400 })
    }
    if (!dimension) {
      return NextResponse.json({ error: 'Dimension required' }, { status: 400 })
    }

    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = to ? new Date(to + 'T23:59:59.999Z') : new Date()
    start.setHours(0, 0, 0, 0)

    const where: any = {
      createdAt: { gte: start, lte: end },
      status: { not: 'cancelled' },
    }
    if (filters?.status) where.status = filters.status
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod

    const orders = await sdb.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, categoryId: true, price: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const customers = metrics.includes('customers')
      ? await sdb.user.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true, createdAt: true },
        })
      : []

    let grouped: Record<string, any> = {}
    const getKey = (order: typeof orders[0]): string => {
      const d = new Date(order.createdAt)
      if (dimension === 'date') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dimension === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (dimension === 'product') return order.items[0]?.product?.name || 'Unknown'
      if (dimension === 'category') return order.items[0]?.product?.categoryId || 'Unknown'
      if (dimension === 'branch') return order.shiftId || 'Unknown'
      return 'All'
    }

    for (const order of orders) {
      const key = getKey(order)
      if (!grouped[key]) grouped[key] = {}
      if (metrics.includes('revenue')) grouped[key].revenue = (grouped[key].revenue || 0) + order.totalAmount
      if (metrics.includes('orders')) grouped[key].orders = (grouped[key].orders || 0) + 1
      if (metrics.includes('avg_order_value')) {
        const count = (grouped[key].orders || 0)
        grouped[key].avg_order_value = count > 0 ? (grouped[key].revenue || 0) / count : 0
      }
    }

    if (metrics.includes('customers')) {
      for (const c of customers) {
        const d = new Date(c.createdAt)
        const key = dimension === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!grouped[key]) grouped[key] = {}
        grouped[key].customers = (grouped[key].customers || 0) + 1
      }
    }

    const rows = Object.entries(grouped)
      .map(([key, vals]) => ({ [dimension]: key, ...vals }))
      .sort((a, b) => (a[dimension] || '').localeCompare(b[dimension] || ''))

    const summary: any = {}
    if (metrics.includes('revenue')) summary.totalRevenue = rows.reduce((s, r) => s + (r.revenue || 0), 0)
    if (metrics.includes('orders')) summary.totalOrders = rows.reduce((s, r) => s + (r.orders || 0), 0)
    if (metrics.includes('customers')) summary.totalCustomers = rows.reduce((s, r) => s + (r.customers || 0), 0)
    if (metrics.includes('avg_order_value')) {
      summary.avgOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0
    }

    return NextResponse.json({ rows, summary, dimension, metrics })
  } catch (e) {
    console.error('Report builder error:', e)
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 })
  }
}, 'reports')
