import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id } = await params
    const order = await sdb.order.findFirst({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await sdb.order.update({
      where: { id },
      data: { status: 'delivered', fulfilledAt: new Date() },
    })

    try {
      await logAudit({ adminId: admin.id, action: 'fulfill', resource: 'order', resourceId: id, details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount } })
    } catch {}

    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    console.error('Fulfill POST error:', e)
    return NextResponse.json({ error: 'Failed to fulfill order' }, { status: 500 })
  }
}, 'accounting')
