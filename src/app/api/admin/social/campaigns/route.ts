import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const campaigns = await db.socialCampaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { posts: true } } },
  })
  return NextResponse.json(campaigns)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, goal, budget, status, startDate, endDate, triggerType, triggerConfig } = body
  if (!name || !goal) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  const campaign = await db.socialCampaign.create({
    data: {
      name,
      goal,
      budget: budget || null,
      status: status || 'draft',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      triggerType: triggerType || null,
      triggerConfig: triggerConfig || null,
    },
  })
  return NextResponse.json(campaign)
}
