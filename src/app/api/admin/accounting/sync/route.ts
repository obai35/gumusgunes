import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { createSaleJournalEntry, createExpenseJournalEntry } from '@/lib/accounting'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { admin }: { params: any; admin: AdminInfo }) => {
  const results = { orders: 0, expenses: 0, errors: 0 }

  const orders = await db.order.findMany({
    where: { paymentStatus: 'paid' },
    select: { id: true, totalAmount: true, cashAmount: true, cardAmount: true, paymentMethod: true, createdAt: true },
  })
  for (const order of orders) {
    const existing = await db.journalEntry.findFirst({ where: { orderId: order.id, type: 'sale' } })
    if (existing) continue
    try {
      await createSaleJournalEntry(order)
      results.orders++
    } catch (err) {
      console.error(`Failed to create journal for order ${order.id}:`, err)
      results.errors++
    }
  }

  const expenses = await db.expense.findMany({
    select: { id: true, amount: true, paymentMethod: true, description: true, createdAt: true },
  })
  for (const expense of expenses) {
    const existing = await db.journalEntry.findFirst({ where: { expenseId: expense.id, type: 'expense' } })
    if (existing) continue
    try {
      await createExpenseJournalEntry(expense)
      results.expenses++
    } catch (err) {
      console.error(`Failed to create journal for expense ${expense.id}:`, err)
      results.errors++
    }
  }

  try {
    await logAudit({ adminId: admin.id, action: 'sync', resource: 'journal', details: { synced: results } })
  } catch {}

  return NextResponse.json({ ok: true, synced: results })
}, 'accounting')
