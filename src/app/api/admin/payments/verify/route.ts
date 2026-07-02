import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req) => {
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      status: 'processing',
      paymentVerifiedAt: new Date(),
    },
  })
  return NextResponse.json({ ok: true, order })
}, 'orders')
