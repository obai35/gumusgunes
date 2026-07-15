import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { createSaleJournalEntry, createReconciliationJournalEntry } from '@/lib/accounting'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  try {
    const { id } = await params
    const order = await db.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await db.order.update({
      where: { id },
      data: { reconciledAt: new Date() },
    })

    if (order.paymentMethod === 'bank_transfer') {
      try {
        await createSaleJournalEntry({ ...order, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod, cashAmount: null, cardAmount: null })
        await createReconciliationJournalEntry(order)
      } catch (err) {
        console.error('Failed to create journal entry for reconciliation:', err)
      }
    } else {
      try {
        await createSaleJournalEntry({ ...order, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod, cashAmount: null, cardAmount: null })
      } catch (err) {
        console.error('Failed to create journal entry for sale:', err)
      }
    }

    try {
      await logAudit({ adminId: admin.id, action: 'reconcile', resource: 'order', resourceId: id, details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount } })
    } catch {}

    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    console.error('Reconcile POST error:', e)
    return NextResponse.json({ error: 'Failed to reconcile order' }, { status: 500 })
  }
}, 'accounting')
