import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }: { params: { id: string }; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const webhook = await sdb.webhook.findFirst({
    where: { id: params.id },
    include: {
      deliveries: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  return NextResponse.json({ webhook })
}, 'system')

export const PUT = withAdmin(async (req: Request, { params, admin }: { params: { id: string }; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const existing = await sdb.webhook.findFirst({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  const { name, url, events, isActive, secret } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (url !== undefined) {
    try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    data.url = url
  }
  if (events !== undefined) data.events = JSON.stringify(events)
  if (isActive !== undefined) data.isActive = isActive
  if (secret !== undefined) data.secret = secret
  const webhook = await sdb.webhook.update({ where: { id: params.id }, data })
  return NextResponse.json({ webhook })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params, admin }: { params: { id: string }; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const existing = await sdb.webhook.findFirst({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  await sdb.webhook.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'system')
