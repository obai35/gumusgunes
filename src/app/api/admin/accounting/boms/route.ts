import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { calculateBomCost } from '@/lib/manufacturing'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const items = await sdb.billOfMaterial.findMany({
    include: { product: true, items: { include: { product: true } } },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(items)
})

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const bom = await sdb.billOfMaterial.create({
    data: {
      productId: body.productId,
      version: body.version || '1.0',
      quantity: body.quantity || 1,
      notes: body.notes,
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

  const cost = await calculateBomCost(bom.id, admin.storeId)
  await sdb.product.update({
    where: { id: body.productId },
    data: { costPrice: cost.unitCost },
  })

  return NextResponse.json({ ...bom, cost }, { status: 201 })
})
