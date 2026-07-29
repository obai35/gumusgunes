import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id: orderId } = params
  const sdb = storeDb(admin.storeId)
  const items = await sdb.productionOperation.findMany({
    where: { productionOrderId: orderId },
    orderBy: { sortOrder: 'asc' },
    include: {
      step: { include: { workCenter: true } },
      laborEntries: { include: { employee: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json(items)
}, 'manufacturing')

export const POST = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id: orderId } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const order = await sdb.productionOrder.findFirst({ where: { id: orderId } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const count = await sdb.productionOperation.count({ where: { productionOrderId: orderId } })

  const item = await sdb.productionOperation.create({
    data: {
      productionOrderId: orderId,
      routingStepId: body.routingStepId,
      status: 'pending',
      sortOrder: count,
      operatorNotes: body.operatorNotes || '',
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      completedAt: null,
      isCompleted: false,
    },
    include: {
      step: { include: { workCenter: true } },
      laborEntries: { include: { employee: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json(item, { status: 201 })
}, 'manufacturing')
