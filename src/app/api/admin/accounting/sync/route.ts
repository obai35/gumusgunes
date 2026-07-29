import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { createSaleJournalEntry, createExpenseJournalEntry } from '@/lib/accounting'
import { recordCOGS } from '@/lib/cogs'
import { logAudit } from '@/lib/audit'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: Request, { admin }: { params: any; admin: AdminInfo }) => {
  const sdb = storeDb(admin.storeId)
  const results = { orders: 0, expenses: 0, errors: 0 }

  const orders = await sdb.order.findMany({
    where: { paymentStatus: 'paid' },
    select: { id: true, totalAmount: true, cashAmount: true, cardAmount: true, paymentMethod: true, createdAt: true, tax: true },
  })
  for (const order of orders) {
    const existing = await sdb.journalEntry.findFirst({ where: { orderId: order.id, type: 'sale' } })
    if (existing) continue
    try {
      await createSaleJournalEntry(order)
      results.orders++
    } catch (err) {
      console.error(`Failed to create journal for order ${order.id}:`, err)
      results.errors++
    }
  }

  const expenses = await sdb.expense.findMany({
    select: { id: true, amount: true, paymentMethod: true, description: true, createdAt: true },
  })
  for (const expense of expenses) {
    const existing = await sdb.journalEntry.findFirst({ where: { expenseId: expense.id, type: 'expense' } })
    if (existing) continue
    try {
      await createExpenseJournalEntry(expense)
      results.expenses++
    } catch (err) {
      console.error(`Failed to create journal for expense ${expense.id}:`, err)
      results.errors++
    }
  }

  let cogsCount = 0
  const deliveredOrders = await sdb.order.findMany({
    where: {
      status: 'delivered',
      paymentStatus: 'paid',
      items: { some: { actualCost: { gt: 0 } } },
    },
    select: { id: true },
  })
  for (const order of deliveredOrders) {
    try {
      const existing = await sdb.journalEntry.findFirst({ where: { orderId: order.id, type: 'cogs' } })
      if (!existing) {
        await recordCOGS(order.id)
        cogsCount++
      }
    } catch (err) {
      console.error(`[sync] COGS error for ${order.id}:`, err)
      results.errors++
    }
  }

  try {
    await logAudit({ adminId: admin.id, action: 'sync', resource: 'journal', details: { synced: results, cogsCreated: cogsCount } })
  } catch {}

  return NextResponse.json({
    ok: true,
    synced: results,
    cogsCreated: cogsCount,
    total: results.orders + results.expenses + cogsCount,
  })
}, 'accounting')
