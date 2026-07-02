import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req) => {
  const { orderId, reason } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await db.order.findUnique({ where: { id: orderId }, select: { notes: true } })
  const existingNotes = order?.notes || ''
  const newNotes = reason
    ? `${existingNotes}\n[Rejected] ${reason}`.trim()
    : (existingNotes || '') + '\n[Rejected]'

  const updated = await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'rejected', notes: newNotes },
  })
  return NextResponse.json({ ok: true, order: updated })
}, 'orders')
