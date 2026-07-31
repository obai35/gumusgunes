import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import {
  createSaleJournalEntry,
  createReconciliationJournalEntry,
  AccountingError,
  ACCOUNTS,
} from '@/lib/accounting'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const order = await sdb.order.findFirst({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    const saleEntryArgs = {
      id: order.id,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      cashAmount: order.cashAmount,
      cardAmount: order.cardAmount,
      createdAt: order.createdAt,
      tax: order.tax,
      storeId: admin.storeId,
    }
    const existingSaleEntry = await sdb.journalEntry.findFirst({
      where: { orderId: order.id, type: 'sale' },
    })

    if (order.paymentMethod === 'bank_transfer') {
      if (!existingSaleEntry) {
        await createSaleJournalEntry(saleEntryArgs)
      }
    } else if (order.paymentMethod === 'cod') {
      if (!existingSaleEntry) {
        await createSaleJournalEntry(saleEntryArgs)
      }
      await createReconciliationJournalEntry({
        id: order.id,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        debitAccountCode: ACCOUNTS.cash,
        storeId: admin.storeId,
      })
    } else {
      if (!existingSaleEntry) {
        await createSaleJournalEntry(saleEntryArgs)
      }
    }

    const updated = await sdb.order.update({
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
