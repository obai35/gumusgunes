import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { createJournalEntry, ACCOUNTS } from '@/lib/accounting'

function getAssetAccount(method: string): string {
  const map: Record<string, string> = {
    cash: ACCOUNTS.cash,
    card: ACCOUNTS.cash,
    bank_transfer: ACCOUNTS.bank,
    instapay: ACCOUNTS.cash,
    wallet: ACCOUNTS.cash,
  }
  return map[method] || ACCOUNTS.cash
}

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { shiftId, endingCash, notes } = await req.json()
  if (!shiftId || endingCash === undefined) {
    return NextResponse.json({ error: 'shiftId and endingCash are required' }, { status: 400 })
  }

  const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
  if (!shift.isOpen) return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 })

  const orders = await sdb.order.findMany({ where: { shiftId } })

  const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalCash = orders.reduce((sum, o) => sum + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0)
  const totalCard = orders.reduce((sum, o) => sum + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0)
  const totalBankTransfer = orders.filter((o) => o.paymentMethod === 'bank_transfer').reduce((sum, o) => sum + o.totalAmount, 0)
  const totalInstapay = orders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.totalAmount, 0)
  const totalWallet = orders.filter((o) => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.totalAmount, 0)
  const totalExpenses = await sdb.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }).then(r => r._sum.amount || 0)
  const orderCount = orders.length

  const updated = await sdb.shift.update({
    where: { id: shiftId },
    data: {
      isOpen: false,
      closedAt: new Date(),
      endingCash,
      totalSales,
      totalCash,
      totalCard,
      totalBankTransfer,
      totalInstapay,
      totalWallet,
      totalExpenses,
      orderCount,
      notes: notes || null,
    },
  })

  // Auto-accounting: create summary journal entries for this shift
  try {
    const salesLines: { accountCode: string; debit?: number; credit?: number }[] = []
    let totalDebit = 0
    for (const [method, total] of Object.entries({ cash: totalCash, card: totalCard, bank_transfer: totalBankTransfer, instapay: totalInstapay, wallet: totalWallet }) as [string, number][]) {
      if (total > 0) {
        salesLines.push({ accountCode: getAssetAccount(method), debit: total })
        totalDebit += total
      }
    }
    if (totalSales > 0) {
      salesLines.push({ accountCode: ACCOUNTS.salesRevenue, credit: totalSales })
      await createJournalEntry({
        date: new Date(),
        description: `Shift close #${shiftId.slice(0, 8)} — Sales`,
        reference: shiftId,
        type: 'sale',
        lines: salesLines,
      })
    }
    if (totalExpenses > 0) {
      await createJournalEntry({
        date: new Date(),
        description: `Shift close #${shiftId.slice(0, 8)} — Expenses`,
        reference: shiftId,
        type: 'expense',
        lines: [
          { accountCode: ACCOUNTS.expenses.other, debit: totalExpenses },
          { accountCode: ACCOUNTS.cash, credit: totalExpenses },
        ],
      })
    }
  } catch (e) {
    console.error('Shift auto-accounting failed (non-fatal):', e)
  }

  return NextResponse.json({ ok: true, shift: updated })
}, 'pos')
