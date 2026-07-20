import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import {
  createSaleJournalEntry,
  createReconciliationJournalEntry,
  AccountingError,
} from '@/lib/accounting'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const { id } = await params
  const order = await db.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    if (order.paymentMethod === 'bank_transfer') {
      await createSaleJournalEntry({
        id: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
        createdAt: order.createdAt,
      })
    } else if (order.paymentMethod === 'cod') {
      await createSaleJournalEntry({
        id: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
        createdAt: order.createdAt,
      })
      await createReconciliationJournalEntry({
        id: order.id,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      })
    } else {
      await createSaleJournalEntry({
        id: order.id,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
        createdAt: order.createdAt,
      })
    }

    const updated = await db.order.update({
      where: { id },
      data: { reconciledAt: new Date() },
    })

    try {
      await logAudit({
        adminId: admin.id,
        action: 'reconcile',
        resource: 'order',
        resourceId: id,
        details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount },
      })
    } catch {}

    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    const message = e instanceof AccountingError ? e.message : 'Failed to reconcile order'
    return NextResponse.json({ error: message }, { status: e instanceof AccountingError ? 400 : 500 })
  }
}, 'accounting')
