import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const productId = searchParams.get('productId')

  const where: any = {}
  if (status) where.status = status
  if (productId) where.productId = productId

  const items = await sdb.productionOrder.findMany({
    where,
    include: {
      product: true,
      workCenter: true,
      materials: { include: { product: true } },
      laborEntries: true,
      outputs: true,
    },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(items)
})

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const count = await sdb.productionOrder.count()
  const orderNumber = `PO-${String(count + 1).padStart(4, '0')}`

  let standardCost = 0
  if (body.bomId) {
    const bom = await sdb.billOfMaterial.findFirst({
      where: { id: body.bomId },
      include: { items: { include: { product: true } } },
    })
    if (bom) {
      for (const item of bom.items) {
        const uc = item.unitCost ?? item.product.costPrice ?? 0
        standardCost += uc * item.quantity
      }
    }
  }

  const item = await sdb.productionOrder.create({
    data: {
      orderNumber,
      productId: body.productId,
      bomId: body.bomId,
      workCenterId: body.workCenterId,
      quantity: body.quantity,
      plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
      notes: body.notes,
      createdById: admin.id,
      standardCost,
    },
    include: { product: true, workCenter: true },
  })
  return NextResponse.json(item, { status: 201 })
})
