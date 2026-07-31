import { NextRequest, NextResponse } from 'next/server'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { storeDb } from '@/lib/store-scoped'

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const search = req.nextUrl.searchParams.get('search') || ''
    const branchId = req.nextUrl.searchParams.get('branchId')
    const categoryId = req.nextUrl.searchParams.get('categoryId')
    const sku = req.nextUrl.searchParams.get('sku') || ''
    const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    if (sku) {
      const product = await sdb.product.findFirst({
        where: { sku: { equals: sku }, isActive: true },
        select: { id: true, name: true, price: true, stock: true, imageUrl: true, sku: true },
      })
      if (!product) return NextResponse.json({ ok: true, items: [], total: 0, page: 1, totalPages: 0 })
      let stock = product.stock
      if (branchId) {
        const bs = await sdb.branchStock.findUnique({ where: { branchId_productId: { branchId, productId: product.id } } })
        stock = bs?.quantity || 0
      }
      return NextResponse.json({ ok: true, items: [{ ...product, stock }], total: 1, page: 1, totalPages: 1 })
    }

    const where: any = { isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId) where.categoryId = categoryId

    let branchStockMap: Map<string, number> | null = null
    if (branchId) {
      const branchStockProducts = await sdb.branchStock.findMany({
        where: { branchId, quantity: { gt: 0 } },
        select: { productId: true, quantity: true },
      })
      branchStockMap = new Map(branchStockProducts.map(bs => [bs.productId, bs.quantity]))
      where.id = { in: [...branchStockMap.keys()] }
    }

    const [products, total] = await Promise.all([
      sdb.product.findMany({
        where,
        select: { id: true, name: true, price: true, stock: true, imageUrl: true, sku: true },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      sdb.product.count({ where }),
    ])

    const items = branchStockMap
      ? products.map(p => ({ ...p, stock: branchStockMap!.get(p.id) || 0 }))
      : products

    return NextResponse.json({
      ok: true,
      items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}, 'pos')
