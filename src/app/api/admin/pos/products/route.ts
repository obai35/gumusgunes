import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const branchId = req.nextUrl.searchParams.get('branchId')
    const categoryId = req.nextUrl.searchParams.get('categoryId')

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
      ]
    }
    if (categoryId) where.categoryId = categoryId

    let branchStockMap: Map<string, number> | null = null
    if (branchId) {
      const branchStockProducts = await db.branchStock.findMany({
        where: { branchId, quantity: { gt: 0 } },
        select: { productId: true, quantity: true },
      })
      branchStockMap = new Map(branchStockProducts.map(bs => [bs.productId, bs.quantity]))
      where.id = { in: [...branchStockMap.keys()] }
    }

    const products = await db.product.findMany({
      where,
      select: { id: true, name: true, price: true, stock: true, imageUrl: true, sku: true },
      take: 20,
      orderBy: { name: 'asc' },
    })
    const result = branchStockMap
      ? products.map(p => ({ ...p, stock: branchStockMap!.get(p.id) || 0 }))
      : products
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}, 'pos')
