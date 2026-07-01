import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const order = await db.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await db.order.update({
      where: { id },
      data: { status: 'delivered', fulfilledAt: new Date() },
    })
    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    console.error('Fulfill POST error:', e)
    return NextResponse.json({ error: 'Failed to fulfill order' }, { status: 500 })
  }
}
