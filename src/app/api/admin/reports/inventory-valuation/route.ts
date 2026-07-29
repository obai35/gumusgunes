import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const slowDays = parseInt(sp.get('slowDays') || '90')

    const products = await sdb.product.findMany({
      where: { isActive: true },
      include: {
        orderItems: {
          where: { order: { status: { not: 'cancelled' } } },
          select: { quantity: true, order: { select: { createdAt: true } } },
          orderBy: { order: { createdAt: 'desc' } },
          take: 1,
        },
        stocks: { include: { branch: { select: { name: true } } } },
      },
    })

    const slowThreshold = new Date(Date.now() - slowDays * 24 * 60 * 60 * 1000)
    const categories = await sdb.category.findMany({ select: { id: true, name: true } })
    const catMap = new Map(categories.map(c => [c.id, c.name]))

    const items = products.map(p => {
      const lastSold = p.orderItems[0]?.order?.createdAt || null
      const daysSinceLastSale = lastSold ? Math.floor((Date.now() - lastSold.getTime()) / (24 * 60 * 60 * 1000)) : null
      const totalStock = p.stocks.reduce((s, st) => s + st.quantity, 0)
      const costPrice = p.price * 0.6
      const retailValue = totalStock * p.price
      const costValue = totalStock * costPrice
      const isSlowMoving = daysSinceLastSale !== null && daysSinceLastSale >= slowDays

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: catMap.get(p.categoryId) || 'Unknown',
        totalStock,
        price: p.price,
        costPrice: Math.round(costPrice * 100) / 100,
        retailValue: Math.round(retailValue * 100) / 100,
        costValue: Math.round(costValue * 100) / 100,
        potentialProfit: Math.round((retailValue - costValue) * 100) / 100,
        lastSoldDate: lastSold ? lastSold.toISOString().slice(0, 10) : null,
        daysSinceLastSale,
        isSlowMoving,
        branchDistribution: p.stocks.map(s => ({ branch: s.branch.name, qty: s.quantity })),
      }
    })

    const slowMoving = items.filter(i => i.isSlowMoving).sort((a, b) => (b.daysSinceLastSale || 0) - (a.daysSinceLastSale || 0))
    const activeItems = items.filter(i => !i.isSlowMoving)

    const totalRetailValue = items.reduce((s, i) => s + i.retailValue, 0)
    const totalCostValue = items.reduce((s, i) => s + i.costValue, 0)
    const totalPotentialProfit = items.reduce((s, i) => s + i.potentialProfit, 0)
    const totalStock = items.reduce((s, i) => s + i.totalStock, 0)

    return NextResponse.json({
      items: items.sort((a, b) => b.retailValue - a.retailValue),
      slowMoving,
      activeItems,
      summary: {
        totalProducts: items.length,
        totalStock,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        totalPotentialProfit: Math.round(totalPotentialProfit * 100) / 100,
        slowMovingCount: slowMoving.length,
        slowMovingValue: Math.round(slowMoving.reduce((s, i) => s + i.costValue, 0) * 100) / 100,
      },
      slowDays,
    })
  } catch (e) {
    console.error('Inventory valuation error:', e)
    return NextResponse.json({ error: 'Failed to load inventory valuation' }, { status: 500 })
  }
}, 'reports')
