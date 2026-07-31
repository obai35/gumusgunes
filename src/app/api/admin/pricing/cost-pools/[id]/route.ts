import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const item = await sdb.costPool.findFirst({
    where: { id },
    include: {
      _count: { select: { expenses: true } },
      expenses: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}, 'pricing')

export const PUT = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.costPool.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      category: body.category,
      basis: body.basis,
      rate: Number(body.rate),
      isActive: body.isActive,
    },
  })
  return NextResponse.json(item)
}, 'pricing')

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  await sdb.costPool.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}, 'pricing')
