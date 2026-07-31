import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { createJournalEntry, ACCOUNTS } from './accounting'

export async function createBillJournalEntry(bill: {
  id: string
  storeId: string
  subtotal: number
  tax: number
  total: number
  issuedAt: Date
  notes?: string | null
  items: { name: string; quantity: number; unitPrice: number }[]
}) {
  const lines: { accountCode: string; debit?: number; credit?: number }[] = []
  const nonInventoryTotal = bill.subtotal <= 0 ? bill.total : 0

  if (nonInventoryTotal > 0) {
    lines.push({ accountCode: ACCOUNTS.expenses.supplies, debit: nonInventoryTotal })
  }

  if (bill.tax > 0) {
    lines.push({ accountCode: ACCOUNTS.taxPayable, debit: bill.tax })
  }

  lines.push({ accountCode: ACCOUNTS.ap, credit: bill.total })

  return createJournalEntry({
    date: bill.issuedAt,
    description: `Bill ${bill.id.slice(0, 8)}${bill.notes ? ` - ${bill.notes}` : ''}`,
    reference: bill.id,
    storeId: bill.storeId,
    type: 'expense',
    lines,
  })
}

export async function createBillPaymentJournalEntry(bill: {
  id: string
  storeId: string
  total: number
  paidAt?: Date | null
  paymentMethod?: string | null
}) {
  const paymentAccount =
    bill.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank
    : bill.paymentMethod === 'cash' ? ACCOUNTS.cash
    : ACCOUNTS.cash

  return createJournalEntry({
    date: bill.paidAt ?? new Date(),
    description: `Payment for Bill ${bill.id.slice(0, 8)}`,
    reference: bill.id,
    storeId: bill.storeId,
    type: 'expense',
    lines: [
      { accountCode: ACCOUNTS.ap, debit: bill.total },
      { accountCode: paymentAccount, credit: bill.total },
    ],
  })
}

export async function getAPAging(storeId: string) {
  const bills = await storeDb(storeId).bill.findMany({
    where: { status: { in: ['pending', 'approved', 'overdue'] } },
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { dueAt: 'asc' },
  })

  const now = new Date()
  const buckets: Record<string, { total: number; count: number; bills: any[] }> = {
    current: { total: 0, count: 0, bills: [] },
    '1-30': { total: 0, count: 0, bills: [] },
    '31-60': { total: 0, count: 0, bills: [] },
    '61-90': { total: 0, count: 0, bills: [] },
    '90+': { total: 0, count: 0, bills: [] },
  }

  for (const bill of bills) {
    const daysOverdue = Math.max(0, Math.floor((now.getTime() - (bill.dueAt ? new Date(bill.dueAt).getTime() : now.getTime())) / (1000 * 60 * 60 * 24)))
    const key = daysOverdue === 0 ? 'current'
      : daysOverdue <= 30 ? '1-30'
      : daysOverdue <= 60 ? '31-60'
      : daysOverdue <= 90 ? '61-90'
      : '90+'
    buckets[key].total += bill.total
    buckets[key].count++
    buckets[key].bills.push(bill)
  }

  return buckets
}

export async function getInventoryValuationDetail(storeId: string) {
  const products = await storeDb(storeId).product.findMany({
    where: { stock: { gt: 0 } },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      costPrice: true,
      price: true,
    },
    orderBy: { name: 'asc' },
  })

  const totalCost = products.reduce((s, p) => s + (p.costPrice ?? 0) * p.stock, 0)
  const totalRetail = products.reduce((s, p) => s + p.price * p.stock, 0)

  return {
    items: products,
    totalCost,
    totalRetail,
    itemCount: products.length,
    totalUnits: products.reduce((s, p) => s + p.stock, 0),
  }
}

export async function createPOReceiptJournalEntry(po: {
  id: string
  storeId: string
  total: number
  receivedAt: Date
  items: { productId: string; quantity: number; unitCost: number }[]
}) {
  const inventoryTotal = po.items.reduce((s, i) => s + i.quantity * i.unitCost, 0)
  if (inventoryTotal <= 0) return null

  return createJournalEntry({
    date: po.receivedAt,
    description: `PO Receipt ${po.id.slice(0, 8)}`,
    reference: po.id,
    storeId: po.storeId,
    type: 'expense',
    lines: [
      { accountCode: ACCOUNTS.inventory, debit: inventoryTotal },
      { accountCode: ACCOUNTS.ap, credit: inventoryTotal },
    ],
  })
}
