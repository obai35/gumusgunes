import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { withRateLimit } from '@/lib/rate-limit'
import { logAudit } from '@/lib/audit'

const handler = withAdmin(async (req: Request, ctx: { admin: any }) => {
  const sdb = storeDb(ctx.admin.storeId)
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await sdb.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      status: 'processing',
      paymentVerifiedAt: new Date(),
    },
  })

  await logAudit({
    adminId: ctx.admin.id,
    action: 'payment_verified',
    resource: 'order',
    resourceId: orderId,
    details: { orderId, amount: order.totalAmount },
  })

  return NextResponse.json({ ok: true, order })
}, 'orders')

export const POST = withRateLimit(handler, { limit: 20, window: '60s' })
