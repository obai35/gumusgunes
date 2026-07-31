import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { runConsolidation } from '@/lib/consolidation'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')

  const where: any = {}
  if (groupId) where.groupId = groupId

  const runs = await storeDb(admin.storeId).consolidationRun.findMany({
    where,
    include: { runBy: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ runs })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const body = await req.json()
  if (!body.groupId || !body.periodStart || !body.periodEnd) {
    return NextResponse.json({ error: 'groupId, periodStart, periodEnd required' }, { status: 400 })
  }

  const result = await runConsolidation(
    body.groupId,
    new Date(body.periodStart),
    new Date(body.periodEnd),
    admin.id
  )
  return NextResponse.json(result)
}, 'accounting')
