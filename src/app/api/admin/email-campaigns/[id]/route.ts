import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params }) => {
  const campaign = await db.emailCampaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ campaign })
}, 'marketing')

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const updates = await req.json()
    const data: any = {}
    if (updates.name !== undefined) data.name = updates.name; if (updates.subject !== undefined) data.subject = updates.subject
    if (updates.content !== undefined) data.content = updates.content; if (updates.segment !== undefined) data.segment = updates.segment
    if (updates.segmentIds !== undefined) data.segmentIds = updates.segmentIds ? JSON.stringify(updates.segmentIds) : null
    if (updates.scheduledAt !== undefined) data.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null
    if (updates.status !== undefined) data.status = updates.status
    const campaign = await db.emailCampaign.update({ where: { id: params.id }, data })
    return NextResponse.json({ campaign })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')

export const DELETE = withAdmin(async (_req, { params }) => {
  await db.emailCampaign.delete({ where: { id: params.id } }); return NextResponse.json({ success: true })
}, 'marketing')
