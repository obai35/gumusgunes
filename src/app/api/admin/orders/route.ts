import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limitParam = searchParams.get('limit')
    const take = limitParam ? Math.min(parseInt(limitParam), 200) : 50
    const skip = (page - 1) * take

    const [orders, total] = await Promise.all([
      db.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: { select: { name: true } } } }, discount: true },
        take, skip,
      }),
      db.order.count(),
    ])
    return NextResponse.json({ ok: true, orders, total, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    console.error('GET /api/admin/orders error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}, 'orders')
