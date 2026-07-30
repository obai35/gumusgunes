import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin, params }) => {
  const { id } = params
  const sdb = storeDb(admin.storeId)
  const items = await sdb.routingStep.findMany({
    where: { routingId: id },
    orderBy: { sortOrder: 'asc' },
    include: { workCenter: { select: { id: true, name: true } } },
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
      sortOrder: body.sortOrder ?? count,
      description: body.description,
      standardHours: Number(body.standardTime) || 0,
      setupHours: Number(body.setupTime) || 0,
    } as any,
    include: { workCenter: { select: { id: true, name: true } } },
  })

  return NextResponse.json(item, { status: 201 })
}, 'manufacturing')
