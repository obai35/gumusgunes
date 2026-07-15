import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const take = 50; const skip = (page - 1) * take
  const [campaigns, total] = await Promise.all([db.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take, skip }), db.emailCampaign.count()])
  return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, subject, content, segment, segmentIds, scheduledAt } = await req.json()
    if (!name || !subject || !content) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const campaign = await db.emailCampaign.create({ data: { name, subject, content, segment: segment || 'all', segmentIds: segmentIds ? JSON.stringify(segmentIds) : null, scheduledAt: scheduledAt ? new Date(scheduledAt) : null } })
    return NextResponse.json({ campaign })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
