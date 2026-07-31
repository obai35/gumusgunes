import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const item = await sdb.pricingFormula.findFirst({ where: { id } })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
}, 'pricing')

export const PUT = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.pricingFormula.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      type: body.type,
      value: Number(body.value),
      isDefault: body.isDefault,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    },
  })
  return NextResponse.json(item)
}, 'pricing')

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  await sdb.pricingFormula.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'pricing')
