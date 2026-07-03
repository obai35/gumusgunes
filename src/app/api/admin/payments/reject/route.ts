import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req, ctx) => {
  const { orderId, reason } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await db.order.findUnique({ where: { id: orderId }, select: { notes: true, totalAmount: true } })
  const existingNotes = order?.notes || ''
  const newNotes = reason
    ? `${existingNotes}\n[Rejected] ${reason}`.trim()
    : (existingNotes || '') + '\n[Rejected]'

  const updated = await db.order.update({
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
