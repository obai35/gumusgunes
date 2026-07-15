import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params }) => { const c = await db.pushCampaign.findUnique({ where: { id: params.id } }); if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 }); return NextResponse.json({ campaign: c }) }, 'marketing')
export const PUT = withAdmin(async (req, { params }) => { try { const u = await req.json(); const d: any = {}; if (u.name !== undefined) d.name = u.name; if (u.title !== undefined) d.title = u.title; if (u.body !== undefined) d.body = u.body; if (u.data !== undefined) d.data = u.data ? JSON.stringify(u.data) : null; if (u.segment !== undefined) d.segment = u.segment; if (u.status !== undefined) d.status = u.status; const c = await db.pushCampaign.update({ where: { id: params.id }, data: d }); return NextResponse.json({ campaign: c }) } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) } }, 'marketing')
export const DELETE = withAdmin(async (_req, { params }) => { await db.pushCampaign.delete({ where: { id: params.id } }); return NextResponse.json({ success: true }) }, 'marketing')
