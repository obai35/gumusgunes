import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const items = await sdb.routingStep.findMany({
    where: { routingId: id },
    orderBy: { sortOrder: 'asc' },
    include: { workCenter: { select: { id: true, name: true, code: true } } },
  })
  return NextResponse.json(items)
}, 'manufacturing')

export const POST = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const routing = await sdb.routing.findFirst({ where: { id } })
  if (!routing) return NextResponse.json({ error: 'Routing not found' }, { status: 404 })

  const count = await sdb.routingStep.count({ where: { routingId: id } })

  const item = await sdb.routingStep.create({
    data: {
      routingId: id,
      workCenterId: body.workCenterId,
      name: body.name,
      stepNumber: count + 1,
      sortOrder: body.sortOrder ?? count,
      description: body.description,
      standardTime: Number(body.standardTime) || 0,
      setupTime: Number(body.setupTime) || 0,
      laborCost: Number(body.laborCost) || 0,
      machineCost: Number(body.machineCost) || 0,
      notes: body.notes,
    },
    include: { workCenter: { select: { id: true, name: true, code: true } } },
  })

  const totalTime = await sdb.routingStep.aggregate({ where: { routingId: id }, _sum: { standardTime: true } })
  await sdb.routing.update({ where: { id }, data: { totalStandardTime: totalTime._sum.standardTime ?? 0 } })

  return NextResponse.json(item, { status: 201 })
}, 'manufacturing')
