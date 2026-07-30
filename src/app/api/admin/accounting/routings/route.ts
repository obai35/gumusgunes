import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const items = await sdb.routing.findMany({
    include: {
      product: { select: { id: true, name: true, sku: true } },
      steps: { orderBy: { sortOrder: 'asc' }, include: { workCenter: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(items)
}, 'manufacturing')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const item = await sdb.routing.create({
    data: {
      productId: body.productId,
      name: body.name,
      description: body.description,
      isActive: body.isActive ?? true,
    } as any,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      steps: { orderBy: { sortOrder: 'asc' } },
    },
  })
  return NextResponse.json(item, { status: 201 })
}, 'manufacturing')
