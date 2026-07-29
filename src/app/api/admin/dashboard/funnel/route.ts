import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const [pending, processing, shipped, delivered, cancelled] = await Promise.all([
      sdb.order.count({ where: { status: 'pending' } }),
      sdb.order.count({ where: { status: 'processing' } }),
      sdb.order.count({ where: { status: 'shipped' } }),
      sdb.order.count({ where: { status: 'delivered' } }),
      sdb.order.count({ where: { status: 'cancelled' } }),
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
