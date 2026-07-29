import { db } from '@/lib/db'
import {
  createSaleJournalEntry,
  createRefundJournalEntry,
  createExpenseJournalEntry,
} from './accounting'

const PAYMENT_METHOD_NORMALIZE: Record<string, string> = {
  paypal: 'card',
  transfer: 'bank_transfer',
  'vodafone-cash': 'cash',
  'orange-cash': 'cash',
  'etisalat-wallet': 'cash',
  fawry: 'cash',
}

function normalizePaymentMethod(method: string): string {
  return PAYMENT_METHOD_NORMALIZE[method] || method
}

export async function autoAccountOrderPayment(orderId: string): Promise<void> {
  try {
    const existing = await db.journalEntry.findFirst({
      where: { orderId, type: 'sale' },
    })
    if (existing) return

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        totalAmount: true,
        cashAmount: true,
        cardAmount: true,
        paymentMethod: true,
        createdAt: true,
        tax: true,
      },
    })
    if (!order) {
      console.error(`[auto-accounting] Order ${orderId} not found`)
      return
    }

    await createSaleJournalEntry({
      ...order,
      paymentMethod: normalizePaymentMethod(order.paymentMethod),
    })
    console.log(`[auto-accounting] Sale entry created for order ${orderId}`)
  } catch (err) {
    console.error(`[auto-accounting] Failed to create sale entry for order ${orderId}:`, err)
  }
}

export async function autoAccountReturn(returnId: string): Promise<void> {
  try {
    const ret = await db.return.findUnique({
      where: { id: returnId },
      include: {
        order: {
          select: { id: true, refundedAmount: true, paymentMethod: true, createdAt: true },
        },
      },
    })
    if (!ret) {
      console.error(`[auto-accounting] Return ${returnId} not found`)
      return
    }

    const existing = await db.journalEntry.findFirst({
      where: { orderId: ret.order.id, type: 'refund' },
    })
    if (existing) return

    await createRefundJournalEntry({
      id: ret.order.id,
      refundedAmount: ret.order.refundedAmount,
      paymentMethod: normalizePaymentMethod(ret.order.paymentMethod),
      createdAt: ret.order.createdAt,
    })
    console.log(`[auto-accounting] Refund entry created for return ${returnId}`)
  } catch (err) {
    console.error(`[auto-accounting] Failed to create refund entry for return ${returnId}:`, err)
  }
}

export async function autoAccountExpense(expenseId: string): Promise<void> {
  try {
    const existing = await db.journalEntry.findFirst({
      where: { expenseId, type: 'expense' },
    })
    if (existing) return

    const expense = await db.expense.findUnique({
      where: { id: expenseId },
      select: { id: true, amount: true, paymentMethod: true, description: true, createdAt: true },
    })
    if (!expense) {
      console.error(`[auto-accounting] Expense ${expenseId} not found`)
      return
    }

    await createExpenseJournalEntry(expense)
    console.log(`[auto-accounting] Expense entry created for expense ${expenseId}`)
  } catch (err) {
    console.error(`[auto-accounting] Failed to create expense entry for expense ${expenseId}:`, err)
  }
}

export async function autoAccountAllOrders(): Promise<{ orders: number; expenses: number; errors: number }> {
  const results = { orders: 0, expenses: 0, errors: 0 }

  const orders = await db.order.findMany({
    where: { paymentStatus: 'paid' },
    select: { id: true, totalAmount: true, cashAmount: true, cardAmount: true, paymentMethod: true, createdAt: true, tax: true },
  })
  for (const order of orders) {
    const existing = await db.journalEntry.findFirst({ where: { orderId: order.id, type: 'sale' } })
    if (existing) continue
    try {
      await createSaleJournalEntry({
        ...order,
        paymentMethod: normalizePaymentMethod(order.paymentMethod),
      })
      results.orders++
    } catch (err) {
      console.error(`[auto-accounting] Failed to create journal for order ${order.id}:`, err)
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
      console.error(`[auto-accounting] Failed to create journal for expense ${expense.id}:`, err)
      results.errors++
    }
  }

  return results
}
