import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
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
}
