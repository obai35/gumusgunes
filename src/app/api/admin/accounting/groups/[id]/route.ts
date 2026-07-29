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

  const group = await storeDb(storeId).group.findFirst({
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
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const body = await req.json()
  const group = await storeDb(storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await storeDb(storeId).group.update({
    where: { id },
    data: {
      name: body.name ?? group.name,
      currency: body.currency ?? group.currency,
    },
  })
  return NextResponse.json({ group: updated })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const group = await storeDb(storeId).group.findFirst({ where: { id } })
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await storeDb(storeId).group.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
