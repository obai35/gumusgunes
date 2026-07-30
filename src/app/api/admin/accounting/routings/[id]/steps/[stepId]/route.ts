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
      standardHours: Number(body.standardTime),
      setupHours: Number(body.setupTime),
      sortOrder: body.sortOrder,
    },
  })

  return NextResponse.json({ success: true })
}, 'manufacturing')

export const DELETE = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id, stepId } = params
  const sdb = storeDb(admin.storeId)
  await sdb.routingStep.delete({ where: { id: stepId } })

  const remaining = await sdb.routingStep.findMany({ where: { routingId: id }, orderBy: { sortOrder: 'asc' } })
  for (let i = 0; i < remaining.length; i++) {
    await sdb.routingStep.update({ where: { id: remaining[i].id }, data: { sortOrder: i } })
  }

  return NextResponse.json({ success: true })
}, 'manufacturing')
