import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const item = await sdb.routing.findFirst({
    where: { id },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      steps: { orderBy: { sortOrder: 'asc' }, include: { workCenter: true } },
    },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}, 'manufacturing')

export const PUT = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.routing.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      isActive: body.isActive,
    },
  })
  return NextResponse.json(item)
}, 'manufacturing')

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  await sdb.routing.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}, 'manufacturing')
