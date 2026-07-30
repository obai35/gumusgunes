import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id: orderId } = params
  const sdb = storeDb(admin.storeId)
  const items = await sdb.productionOperation.findMany({
    where: { orderId },
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

  const step = body.routingStepId ? await sdb.routingStep.findFirst({ where: { id: body.routingStepId } }) : null
  const count = await sdb.productionOperation.count({ where: { orderId } })

  const item = await sdb.productionOperation.create({
    data: {
      orderId,
      name: step?.name ?? `Operation ${count + 1}`,
      stepId: body.routingStepId,
      status: 'pending',
      sortOrder: count,
      notes: body.operatorNotes || '',
      startedAt: body.startedAt ? new Date(body.startedAt) : null,
      completedAt: null,
    } as any,
    include: {
      step: { include: { workCenter: true } },
      laborEntries: { include: { employee: { select: { id: true, name: true } } } },
    },
  })
  return NextResponse.json(item, { status: 201 })
}, 'manufacturing')
