import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { createJournalEntry, ACCOUNTS } from '@/lib/accounting'
import { computeShiftTotals } from '@/lib/shiftTotals'

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

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { shiftId, endingCash, notes } = await req.json()
  if (!shiftId || endingCash === undefined) {
    return NextResponse.json({ error: 'shiftId and endingCash are required' }, { status: 400 })
  }
  const validatedEndingCash = Number(endingCash)
  if (!Number.isFinite(validatedEndingCash) || validatedEndingCash < 0) {
    return NextResponse.json({ error: 'endingCash must be a non-negative number' }, { status: 400 })
  }

  const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
  if (!shift.isOpen) return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 })
  if (admin.branchId && shift.branchId !== admin.branchId) {
    return NextResponse.json({ error: 'Shift does not belong to this branch' }, { status: 403 })
  }

  const orders = await sdb.order.findMany({ where: { shiftId, status: { not: 'cancelled' } } })
  const totals = computeShiftTotals(orders)

  const totalExpenses = await sdb.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }).then(r => r._sum.amount || 0)
  const orderCount = orders.length

  const closed = await sdb.shift.updateMany({
    where: { id: shiftId, isOpen: true },
    data: {
      isOpen: false,
      closedAt: new Date(),
      endingCash: validatedEndingCash,
      totalSales: totals.totalSales,
      totalCash: totals.totalCash,
      totalCard: totals.totalCard,
      totalBankTransfer: totals.totalBankTransfer,
      totalInstapay: totals.totalInstapay,
      totalWallet: totals.totalWallet,
      totalExpenses,
      orderCount,
      notes: notes || null,
    },
  })
  if (closed.count !== 1) {
    return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 })
  }
  const updated = await sdb.shift.findFirst({ where: { id: shiftId } }) as any

  // Auto-accounting: create summary journal entries for this shift
  try {
        const salesLines: { accountCode: string; debit?: number; credit?: number }[] = []
        let totalDebit = 0
        for (const [method, total] of Object.entries({ cash: totals.totalCash, card: totals.totalCard, bank_transfer: totals.totalBankTransfer, instapay: totals.totalInstapay, wallet: totals.totalWallet }) as [string, number][]) {
          if (total > 0) {
            salesLines.push({ accountCode: getAssetAccount(method), debit: total })
            totalDebit += total
          }
        }
        if (totals.totalSales > 0) {
          salesLines.push({ accountCode: ACCOUNTS.salesRevenue, credit: totals.totalSales })
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
