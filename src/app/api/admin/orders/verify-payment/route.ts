import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    const order = await db.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
    })
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}
