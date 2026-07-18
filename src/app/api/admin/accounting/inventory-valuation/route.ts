import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const dateParam = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const method = req.nextUrl.searchParams.get('method') || 'weighted'
    const asOfDate = new Date(dateParam)
    asOfDate.setHours(23, 59, 59, 999)

    const [products, cogsLines, revenueLines] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, sku: true, price: true, stock: true },
        orderBy: { name: 'asc' },
      }),
      db.journalLine.aggregate({
        where: { account: { code: '5000' }, entry: { date: { lte: asOfDate } } },
        _sum: { debit: true },
      }),
      db.journalLine.aggregate({
        where: { account: { code: '4000' }, entry: { date: { lte: asOfDate } } },
        _sum: { credit: true },
      }),
    ])

    const totalCOGS = cogsLines._sum.debit || 0
    const totalRevenue = revenueLines._sum.credit || 0

    const items = products.map(p => {
      const unitCost = p.costPrice || (p.price * 0.6)
      return {
        id: p.id, sku: p.sku || p.id.slice(0, 8), name: p.name,
        quantity: p.stock || 0, unitCost, totalValue: (p.stock || 0) * unitCost,
      }
    })

    const totalValue = items.reduce((s, i) => s + i.totalValue, 0)
    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0)

    return NextResponse.json({
      asOfDate: dateParam, method,
      totalProducts: products.length,
      totalQuantity,
      totalValue,
      totalCOGS,
      totalRevenue,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
      items,
    })
  } catch (e) {
    console.error('Inventory valuation error:', e)
    return NextResponse.json({ error: 'Failed to fetch inventory valuation' }, { status: 500 })
  }
}, 'accounting')
