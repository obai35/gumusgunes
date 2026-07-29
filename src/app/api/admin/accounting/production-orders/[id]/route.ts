import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const item = await sdb.productionOrder.findFirst({
    where: { id: params.id },
    include: {
      product: true,
      workCenter: true,
      bom: { include: { items: { include: { product: true } } } },
      materials: { include: { product: true } },
      laborEntries: true,
      outputs: true,
    },
  })
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item)
})

export const PUT = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const item = await sdb.productionOrder.update({
    where: { id: params.id },
    data: {
      quantity: body.quantity,
      plannedStart: body.plannedStart ? new Date(body.plannedStart) : undefined,
      notes: body.notes,
      workCenterId: body.workCenterId,
    },
  })
  return NextResponse.json(item)
})

export const PATCH = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const data: any = {}
  if (body.status) {
    data.status = body.status
    if (body.status === 'in_progress') data.actualStart = new Date()
    if (body.status === 'completed') data.actualEnd = new Date()
  }
  if (body.notes !== undefined) data.notes = body.notes
  const item = await sdb.productionOrder.update({
    where: { id: params.id },
    data,
  })
  return NextResponse.json(item)
})
