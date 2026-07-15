import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, name, userId, items, total } = await req.json()
    if (!email || !items || !total) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const existing = await db.abandonedCart.findFirst({ where: { email, convertedOrderId: null }, orderBy: { createdAt: 'desc' } })
    if (existing) {
      await db.abandonedCart.update({ where: { id: existing.id }, data: { items: JSON.stringify(items), total: parseFloat(total), name: name || null, updatedAt: new Date() } })
    } else {
      await db.abandonedCart.create({ data: { email, name: name || null, userId: userId || null, items: JSON.stringify(items), total: parseFloat(total) } })
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
