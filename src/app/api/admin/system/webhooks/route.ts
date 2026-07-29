import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

const EVENTS = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'payment.completed',
  'payment.failed',
  'product.created',
  'product.updated',
  'product.deleted',
  'customer.created',
  'admin.audit',
] as const

export const GET = withAdmin(async (_req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const webhooks = await sdb.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deliveries: true } } },
  })
  return NextResponse.json({ webhooks, events: EVENTS })
}, 'system')

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { name, url, events, isActive, secret } = await req.json()
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'name, url, and events (non-empty array) are required' }, { status: 400 })
    }
    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    const invalid = events.filter((e: string) => !EVENTS.includes(e as any))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalid.join(', ')}` }, { status: 400 })
    }
    const webhook = await sdb.webhook.create({
      data: { name, url, events: JSON.stringify(events), isActive: isActive ?? true, secret: secret || null },
    })
    return NextResponse.json({ webhook })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
