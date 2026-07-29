import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id, stepId } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  await sdb.routingStep.update({
    where: { id: stepId },
    data: {
      workCenterId: body.workCenterId,
      name: body.name,
      description: body.description,
      standardTime: Number(body.standardTime),
      setupTime: Number(body.setupTime),
      laborCost: Number(body.laborCost),
      machineCost: Number(body.machineCost),
      notes: body.notes,
      sortOrder: body.sortOrder,
    },
  })

  const totalTime = await sdb.routingStep.aggregate({ where: { routingId: id }, _sum: { standardTime: true } })
  await sdb.routing.update({ where: { id }, data: { totalStandardTime: totalTime._sum.standardTime ?? 0 } })

  return NextResponse.json({ success: true })
}, 'manufacturing')

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id, stepId } = params
  const sdb = storeDb(admin.storeId)
  await sdb.routingStep.delete({ where: { id: stepId } })

  const remaining = await sdb.routingStep.findMany({ where: { routingId: id }, orderBy: { sortOrder: 'asc' } })
  for (let i = 0; i < remaining.length; i++) {
    await sdb.routingStep.update({ where: { id: remaining[i].id }, data: { stepNumber: i + 1, sortOrder: i } })
  }

  const totalTime = await sdb.routingStep.aggregate({ where: { routingId: id }, _sum: { standardTime: true } })
  await sdb.routing.update({ where: { id }, data: { totalStandardTime: totalTime._sum.standardTime ?? 0 } })

  return NextResponse.json({ success: true })
}, 'manufacturing')
