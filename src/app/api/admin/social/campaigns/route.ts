import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const campaigns = await sdb.socialCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { posts: true } } },
  })
  return NextResponse.json(campaigns)
}, 'social')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const { name, goal, budget, status, startDate, endDate, triggerType, triggerConfig } = body
  if (!name || !goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const campaign = await sdb.socialCampaign.create({
    data: {
      name,
      goal,
      budget: budget || null,
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      triggerType: triggerType || null,
      triggerConfig: triggerConfig || null,
    } as any,
  })
  return NextResponse.json(campaign)
}, 'social')
