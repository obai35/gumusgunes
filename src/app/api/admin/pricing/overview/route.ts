import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const tx = storeDb(admin.storeId)

  const products = await tx.product.findMany({
    select: { id: true, name: true, sku: true, price: true, costPrice: true, stock: true },
  })

  const priceLists = await tx.priceList.count({ where: { isActive: true } })
  const costHistoryCount = await tx.costHistory.count()
  const costHistoryEntries = await tx.costHistory.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      product: { select: { id: true, name: true, sku: true } },
    },
  })

  const productsWithMargin = products
    .filter((p) => p.costPrice && p.costPrice > 0)
    .map((p) => ({
      id: p.id, name: p.name, sku: p.sku,
      price: p.price, cost: p.costPrice,
      margin: p.price > 0 ? ((p.price - p.costPrice!) / p.price * 100) : 0,
      stockValue: (p.costPrice ?? 0) * (p.stock || 0),
    }))

  const avgMargin = productsWithMargin.length
    ? productsWithMargin.reduce((s, p) => s + p.margin, 0) / productsWithMargin.length
    : 0

  const totalStockValue = productsWithMargin.reduce((s, p) => s + p.stockValue, 0)

  return NextResponse.json({
    stats: {
      totalProducts: products.length,
      productsWithCost: productsWithMargin.length,
      avgMargin: Math.round(avgMargin * 100) / 100,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      activePriceLists: priceLists,
      costHistoryEntries: costHistoryCount,
    },
    recentCostHistory: costHistoryEntries,
  })
}, 'pricing')
