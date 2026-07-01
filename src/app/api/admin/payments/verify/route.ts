import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
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
}
