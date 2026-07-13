import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { orderIds, status } = await req.json()
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds must be a non-empty array' }, { status: 400 })
    }
    if (!status || typeof status !== 'string') {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const result = await db.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status },
    })

    return NextResponse.json({ ok: true, updated: result.count })
  } catch (err) {
    console.error('POST /api/admin/orders/bulk-status error:', err)
    return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 })
  }
}, 'orders')
