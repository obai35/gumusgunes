import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { runConsolidation } from '@/lib/consolidation'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')

  const where: any = {}
  if (groupId) where.groupId = groupId

  const runs = await storeDb(storeId).consolidationRun.findMany({
    where,
    include: { runBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ runs })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const body = await req.json()
  if (!body.groupId || !body.periodStart || !body.periodEnd) {
    return NextResponse.json({ error: 'groupId, periodStart, periodEnd required' }, { status: 400 })
  }

  const result = await runConsolidation(
    body.groupId,
    new Date(body.periodStart),
    new Date(body.periodEnd),
    session.user.id
  )
  return NextResponse.json(result)
}
