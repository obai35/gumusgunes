import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req) => {
  try {
    const { orderId, reason } = await req.json()
    const order = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'pending', notes: reason ? `Rejected: ${reason}` : 'Payment rejected' },
    })
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to reject payment' }, { status: 500 })
  }
}, 'orders')
