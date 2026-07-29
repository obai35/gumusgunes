import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const order = await sdb.productionOrder.findFirst({
    where: { id: params.id },
    include: { outputs: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const totalCost = body.unitCost * body.quantity

  const item = await sdb.productionOrderOutput.create({
    data: {
      orderId: params.id,
      quantity: body.quantity,
      unitCost: body.unitCost,
      totalCost,
      isScrap: body.isScrap || false,
    },
  })

  if (!body.isScrap) {
    await sdb.inventoryLog.create({
      data: {
        productId: order.productId,
        type: 'production_receive',
        change: body.quantity,
        note: `Received from production order ${params.id}`,
      },
    })

    await sdb.product.update({
      where: { id: order.productId },
      data: { stock: { increment: body.quantity } },
    })
  }

  const goodQty = order.outputs.filter(o => !o.isScrap).reduce((s, o) => s + o.quantity, 0) + (body.isScrap ? 0 : body.quantity)
  const scrapQty = order.outputs.filter(o => o.isScrap).reduce((s, o) => s + o.quantity, 0) + (body.isScrap ? body.quantity : 0)

  await sdb.productionOrder.update({
    where: { id: params.id },
    data: { completedQty: goodQty, scrappedQty: scrapQty },
  })

  return NextResponse.json(item, { status: 201 })
})
