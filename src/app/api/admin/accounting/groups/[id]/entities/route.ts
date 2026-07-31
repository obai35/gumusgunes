import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const entities = await storeDb(admin.storeId).groupEntity.findMany({
    where: { groupId: id },
    include: { entityStore: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json({ entities })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const group = await storeDb(admin.storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const body = await req.json()
  if (!body.entityStoreId) return NextResponse.json({ error: 'entityStoreId required' }, { status: 400 })

  const existing = await storeDb(admin.storeId).groupEntity.findUnique({
    where: { groupId_entityStoreId: { groupId: id, entityStoreId: body.entityStoreId } },
  })
  if (existing) return NextResponse.json({ error: 'Entity already in group' }, { status: 409 })

  const entity = await storeDb(admin.storeId).groupEntity.create({
    data: {
      groupId: id,
      entityStoreId: body.entityStoreId,
      ownershipPct: body.ownershipPct ?? 100,
      consolidationMethod: body.consolidationMethod ?? 'full',
      isPrimary: body.isPrimary ?? false,
    },
    include: { entityStore: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json({ entity })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entityId')
  if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 })

  await storeDb(admin.storeId).groupEntity.delete({ where: { id: entityId } })
  return NextResponse.json({ success: true })
}, 'accounting')
