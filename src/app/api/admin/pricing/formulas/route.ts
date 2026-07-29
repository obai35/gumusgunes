import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const items = await sdb.pricingFormula.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(items)
}, 'pricing')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const count = await sdb.pricingFormula.count()
  const item = await sdb.pricingFormula.create({
    data: {
      name: body.name,
      description: body.description,
      type: body.type || 'margin',
      value: Number(body.value) || 0,
      currency: body.currency || 'EGP',
      isDefault: body.isDefault || false,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? count,
    },
  })
  return NextResponse.json(item, { status: 201 })
}, 'pricing')
