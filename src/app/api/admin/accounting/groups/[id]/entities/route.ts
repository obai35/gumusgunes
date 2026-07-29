import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const entities = await storeDb(storeId).groupEntity.findMany({
    where: { groupId: id },
    include: { entityStore: { select: { id: true, name: true, slug: true } } },
  })
  return NextResponse.json({ entities })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const group = await storeDb(storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const body = await req.json()
  if (!body.entityStoreId) return NextResponse.json({ error: 'entityStoreId required' }, { status: 400 })

  const existing = await storeDb(storeId).groupEntity.findUnique({
    where: { groupId_entityStoreId: { groupId: id, entityStoreId: body.entityStoreId } },
  })
  if (existing) return NextResponse.json({ error: 'Entity already in group' }, { status: 409 })

  const entity = await storeDb(storeId).groupEntity.create({
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
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const entityId = searchParams.get('entityId')
  if (!entityId) return NextResponse.json({ error: 'entityId required' }, { status: 400 })

  await storeDb(storeId).groupEntity.delete({ where: { id: entityId } })
  return NextResponse.json({ success: true })
}
