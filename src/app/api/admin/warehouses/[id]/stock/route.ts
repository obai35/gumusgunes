import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const search = req.nextUrl.searchParams.get('search') || ''

  const where: any = { warehouseId: id }
  if (search) {
    where.product = { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }
  }

  const stockLevels = await sdb.stockLevel.findMany({
    where,
    include: { product: { select: { id: true, name: true, sku: true, imageUrl: true, stock: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ ok: true, stockLevels: stockLevels.map(sl => ({ id: sl.id, productId: sl.productId, productName: sl.product.name, sku: sl.product.sku, imageUrl: sl.product.imageUrl, quantity: sl.quantity, mainStock: sl.product.stock })) })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { productId, quantity } = await req.json()
  if (!productId || quantity === undefined) return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 })

  const stockLevel = await sdb.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: id, productId } },
    create: { warehouseId: id, productId, quantity },
    update: { quantity },
  })
  return NextResponse.json({ ok: true, stockLevel })
}, 'inventory')
