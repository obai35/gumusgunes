import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const days = parseInt(searchParams.get('days') || '30')

    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const topItems = await sdb.orderItem.groupBy({
      by: ['productId'],
      _sum: { price: true, quantity: true },
      where: { order: { createdAt: { gte: dateFrom } } },
      orderBy: { _sum: { price: 'desc' } },
      take: limit,
    })

    if (topItems.length === 0) {
      return NextResponse.json({ products: [], totalRevenue: 0 })
    }

    const products = await sdb.product.findMany({
      where: { id: { in: topItems.map(p => p.productId) } },
      select: { id: true, name: true, imageUrl: true },
    })

    const productMap = new Map(products.map(p => [p.id, p]))
    const totalRevenue = topItems.reduce((sum, p) => sum + (p._sum.price || 0), 0)

    const items = topItems.map(p => ({
      id: p.productId,
      name: productMap.get(p.productId)?.name || 'Unknown',
      image: productMap.get(p.productId)?.imageUrl || null,
      revenue: p._sum.price || 0,
      sold: p._sum.quantity || 0,
      percentage: totalRevenue > 0 ? ((p._sum.price || 0) / totalRevenue) * 100 : 0,
    }))

    return NextResponse.json({ products: items, totalRevenue })
  } catch (err) {
    console.error('GET /api/admin/dashboard/top-products error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'products')
