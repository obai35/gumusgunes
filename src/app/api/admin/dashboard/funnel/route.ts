import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const [pending, processing, shipped, delivered, cancelled] = await Promise.all([
      db.order.count({ where: { status: 'pending' } }),
      db.order.count({ where: { status: 'processing' } }),
      db.order.count({ where: { status: 'shipped' } }),
      db.order.count({ where: { status: 'delivered' } }),
      db.order.count({ where: { status: 'cancelled' } }),
    ])
    return NextResponse.json({
      funnel: { pending, processing, shipped, delivered, cancelled },
      total: pending + processing + shipped + delivered + cancelled,
    })
  } catch (err) {
    console.error('GET /api/admin/dashboard/funnel error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'orders')
