import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { orderId, reason } = await req.json()
    const order = await sdb.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'pending', notes: reason ? `Rejected: ${reason}` : 'Payment rejected' },
    })
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to reject payment' }, { status: 500 })
  }
}, 'orders')
