import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const product = await sdb.product.findFirst({ where: { id: body.productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const unitCost = body.unitCost ?? product.costPrice ?? 0
  const totalCost = unitCost * body.quantity

  const item = await sdb.productionOrderMaterial.create({
    data: {
      orderId: params.id,
      productId: body.productId,
      quantity: body.quantity,
      unitCost,
      totalCost,
    },
    include: { product: true },
  })

  await sdb.inventoryLog.create({
    data: {
      productId: body.productId,
      type: 'production_issue',
      change: -Math.abs(body.quantity),
      note: `Issued to production order ${params.id}`,
    },
  })

  return NextResponse.json(item, { status: 201 })
})
