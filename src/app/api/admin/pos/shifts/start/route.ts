import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { computeShiftTotals } from '@/lib/shiftTotals'
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

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { branchId, startingCash } = await req.json()
    if (!branchId || startingCash === undefined) {
      return NextResponse.json({ error: 'branchId and startingCash are required' }, { status: 400 })
    }
    const validatedStartingCash = Number(startingCash)
    if (!Number.isFinite(validatedStartingCash) || validatedStartingCash < 0) {
      return NextResponse.json({ error: 'startingCash must be a non-negative number' }, { status: 400 })
    }
    if (admin.branchId && branchId !== admin.branchId) {
      return NextResponse.json({ error: 'Branch does not belong to this cashier' }, { status: 403 })
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const result = await sdb.$transaction(async (tx) => {
      const existing = await tx.shift.findFirst({ where: { branchId, isOpen: true } })
      if (existing) {
        if (existing.startedAt < startOfToday) {
          const orders = await tx.order.findMany({ where: { shiftId: existing.id, status: { not: 'cancelled' } } })
          const totals = computeShiftTotals(orders)
          const closed = await tx.shift.update({
            where: { id: existing.id },
            data: {
              isOpen: false,
              closedAt: new Date(),
              endingCash: null,
              totalSales: totals.totalSales,
              totalCash: totals.totalCash,
              totalCard: totals.totalCard,
              totalBankTransfer: totals.totalBankTransfer,
              totalInstapay: totals.totalInstapay,
              totalWallet: totals.totalWallet,
              orderCount: orders.length,
              notes: 'Auto-closed (day rollover)',
            } as any,
          })
          const created = await tx.shift.create({
            data: { branchId, startingCash: validatedStartingCash, isOpen: true } as any,
          })
          return { autoClosed: closed, created }
        }
        return { error: 'An open shift already exists for this branch' }
      }
      const created = await tx.shift.create({
        data: { branchId, startingCash: validatedStartingCash, isOpen: true } as any,
      })
      return { created }
    })

    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    if (result.autoClosed) {
      try {
        const closed = result.autoClosed
        const salesLines: { accountCode: string; debit?: number; credit?: number }[] = []
        let totalDebit = 0
        for (const [method, total] of Object.entries({ cash: closed.totalCash, card: closed.totalCard, bank_transfer: closed.totalBankTransfer, instapay: closed.totalInstapay, wallet: closed.totalWallet }) as [string, number][]) {
          if (total > 0) {
            salesLines.push({ accountCode: getAssetAccount(method), debit: total })
            totalDebit += total
          }
        }
        if (closed.totalSales > 0) {
          salesLines.push({ accountCode: ACCOUNTS.salesRevenue, credit: closed.totalSales })
          await createJournalEntry({
            date: new Date(),
            description: `Shift close #${closed.id.slice(0, 8)} — Sales`,
            reference: closed.id,
            type: 'sale',
            lines: salesLines,
          })
        }
        const totalExpenses = await sdb.expense.aggregate({ where: { shiftId: closed.id }, _sum: { amount: true } }).then(r => r._sum.amount || 0)
        if (totalExpenses > 0) {
          await createJournalEntry({
            date: new Date(),
            description: `Shift close #${closed.id.slice(0, 8)} — Expenses`,
            reference: closed.id,
            type: 'expense',
            lines: [
              { accountCode: ACCOUNTS.expenses.other, debit: totalExpenses },
              { accountCode: ACCOUNTS.cash, credit: totalExpenses },
            ],
          })
        }
      } catch (e) {
        console.error('Auto-close accounting failed (non-fatal):', e)
      }
    }

    return NextResponse.json({ ok: true, shift: result.created, autoClosed: result.autoClosed ? { id: result.autoClosed.id, totalSales: result.autoClosed.totalSales } : undefined })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 })
  }
}, 'pos')
