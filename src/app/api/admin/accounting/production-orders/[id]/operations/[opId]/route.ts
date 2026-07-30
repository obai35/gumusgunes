import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const PATCH = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { opId } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const data: any = {}
  if (body.status) data.status = body.status
  if (body.isCompleted !== undefined) {
    data.status = body.isCompleted ? 'completed' : 'pending'
    data.completedAt = body.isCompleted ? new Date() : null
  }
  if (body.operatorNotes !== undefined) data.notes = body.operatorNotes
  if (body.startedAt !== undefined) data.startedAt = body.startedAt ? new Date(body.startedAt) : null
  if (body.startedAt === null) data.startedAt = null

  const item = await sdb.productionOperation.update({
    where: { id: opId },
    data,
    include: {
      step: { include: { workCenter: true } },
      laborEntries: { include: { employee: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json(item)
}, 'manufacturing')

export const POST = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id: orderId, opId } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  if (body._action === 'add-labor') {
    const entry = await sdb.prodOpLabor.create({
      data: {
        operationId: opId,
        employeeId: body.employeeId,
        hours: Number(body.hours),
        rate: Number(body.cost),
        description: body.notes || '',
      } as any,
      include: { employee: { select: { id: true, name: true } } },
    })

    const aggregate = await sdb.prodOpLabor.aggregate({ where: { operationId: opId }, _sum: { totalCost: true, hours: true } })
    const totalOpHours = aggregate._sum.hours ?? 0

    // Aggregate all labor for this order and update the order total
    const orderAgg = await sdb.prodOpLabor.aggregate({ where: { operation: { orderId } }, _sum: { totalCost: true } })
    await sdb.productionOrder.update({ where: { id: orderId }, data: { actualLaborCost: orderAgg._sum.totalCost ?? 0 } })

    return NextResponse.json(entry, { status: 201 })
  }

  if (body._action === 'delete-labor') {
    await sdb.prodOpLabor.delete({ where: { id: body.laborId } })

    const aggregate = await sdb.prodOpLabor.aggregate({ where: { operationId: opId }, _sum: { totalCost: true, hours: true } })

    // Aggregate all labor for this order and update the order total
    const orderAgg = await sdb.prodOpLabor.aggregate({ where: { operation: { orderId } }, _sum: { totalCost: true } })
    await sdb.productionOrder.update({ where: { id: orderId }, data: { actualLaborCost: orderAgg._sum.totalCost ?? 0 } })

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}, 'manufacturing')
