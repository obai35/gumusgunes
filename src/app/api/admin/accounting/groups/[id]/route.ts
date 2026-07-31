import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const group = await storeDb(admin.storeId).group.findFirst({
    where: { id },
    include: {
      entities: { include: { entityStore: { select: { id: true, name: true, slug: true } } } },
      interCompanyTxns: {
        include: { fromStore: { select: { name: true } }, toStore: { select: { name: true } } },
        orderBy: { date: 'desc' },
        take: 50,
      },
      consolidationRuns: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ group })
}, 'accounting')

export const PUT = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const body = await req.json()
  const group = await storeDb(admin.storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await storeDb(admin.storeId).group.update({
    where: { id },
    data: {
      name: body.name ?? group.name,
      currency: body.currency ?? group.currency,
    },
  })
  return NextResponse.json({ group: updated })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const group = await storeDb(admin.storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await storeDb(admin.storeId).group.delete({ where: { id } })
  return NextResponse.json({ success: true })
}, 'accounting')
