import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { name: true } } } }, discount: true },
    })
    return NextResponse.json({ ok: true, orders })
  } catch (err) {
    console.error('GET /api/admin/orders error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}
