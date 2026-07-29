import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { autoAccountOrderPayment } from '@/lib/auto-accounting'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { orderId } = await req.json()
    const order = await sdb.order.update({
      where: { id: orderId },
      data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
    })
    await autoAccountOrderPayment(orderId)
    return NextResponse.json({ ok: true, order })
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to verify payment' }, { status: 500 })
  }
}, 'orders')
