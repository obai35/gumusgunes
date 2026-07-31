import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params

  const asset = await sdb.fixedAsset.findFirst({
    where: { id },
    include: { depreciationEntries: { orderBy: { periodDate: 'desc' } } },
  })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}, 'accounting')

export const PUT = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params

  const body = await req.json()
  const asset = await sdb.fixedAsset.update({
    where: { id },
    data: {
      name: body.name,
      nameAr: body.nameAr,
      category: body.category,
      salvageValue: body.salvageValue,
      usefulLifeYears: body.usefulLifeYears,
      depreciationMethod: body.depreciationMethod,
      notes: body.notes,
    },
  })
  return NextResponse.json({ asset })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params

  await sdb.fixedAsset.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'accounting')
