import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1')); const take = 50; const skip = (page - 1) * take
  const [campaigns, total] = await Promise.all([sdb.pushCampaign.findMany({ orderBy: { createdAt: 'desc' }, take, skip }), sdb.pushCampaign.count()])
  return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try { const { name, title, body, data, segment, scheduledAt } = await req.json(); if (!name || !title || !body) return NextResponse.json({ error: 'Required' }, { status: 400 }); const c = await sdb.pushCampaign.create({ data: { name, title, body, data: data ? JSON.stringify(data) : null, segment: segment || 'all', scheduledAt: scheduledAt ? new Date(scheduledAt) : null } }); return NextResponse.json({ campaign: c }) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
