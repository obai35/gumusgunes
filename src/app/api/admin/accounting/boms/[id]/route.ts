import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const item = await sdb.billOfMaterial.findFirst({
    where: { id: params.id },
    include: { product: true, items: { include: { product: true } } },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
})

export const PUT = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  await sdb.bomItem.deleteMany({ where: { bomId: params.id } })

  const item = await sdb.billOfMaterial.update({
    where: { id: params.id },
    data: {
      version: body.version,
      quantity: body.quantity,
      notes: body.notes,
      isActive: body.isActive,
      items: {
        create: (body.items || []).map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity || 1,
          unitCost: i.unitCost,
          scrapPct: i.scrapPct || 0,
        })),
      },
    },
    include: { product: true, items: { include: { product: true } } },
  })

  return NextResponse.json(item)
})

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  await sdb.billOfMaterial.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
})
