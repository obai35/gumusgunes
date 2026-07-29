import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, ctx: { admin: any }) => {
  const sdb = storeDb(ctx.admin.storeId)
  const { orderId, reason } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await sdb.order.findFirst({ where: { id: orderId }, select: { notes: true, totalAmount: true } })
  const existingNotes = order?.notes || ''
  const newNotes = reason
    ? `${existingNotes}\n[Rejected] ${reason}`.trim()
    : (existingNotes || '') + '\n[Rejected]'

  const updated = await sdb.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'rejected', notes: newNotes },
  })

  await logAudit({
    adminId: ctx.admin.id,
    action: 'payment_rejected',
    resource: 'order',
    resourceId: orderId,
    details: { orderId, reason, amount: order?.totalAmount },
  })

  return NextResponse.json({ ok: true, order: updated })
}, 'orders')
