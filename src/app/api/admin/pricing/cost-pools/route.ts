import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const where: any = {}
  if (category) where.category = category

  const items = await sdb.costPool.findMany({
    where,
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(items)
}, 'pricing')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.costPool.create({
    data: {
      name: body.name,
      description: body.description,
      category: body.category || 'mfg_overhead',
      basis: body.basis || 'total_pct',
      rate: Number(body.rate) || 0,
      isActive: body.isActive ?? true,
    },
  })
  return NextResponse.json(item, { status: 201 })
}, 'pricing')
