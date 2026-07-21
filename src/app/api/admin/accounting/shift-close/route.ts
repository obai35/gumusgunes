import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { createJournalEntry } from '@/lib/accounting'

export const POST = withAdmin(async (req: Request) => {
  try {
    const { shiftId } = await req.json()
    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId required' }, { status: 400 })
    }

    const shift = await db.shift.findUnique({ where: { id: shiftId } })
    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.isOpen) {
      return NextResponse.json({ error: 'Shift is still open' }, { status: 400 })
    }

    const existing = await db.journalEntry.findFirst({
      where: { description: { startsWith: `Shift close #${shiftId.slice(0, 8)}` } },
    })
    if (existing) {
      return NextResponse.json({ ok: true, alreadyProcessed: true })
    }

    if (shift.totalSales > 0) {
      const lines: { accountCode: string; debit?: number; credit?: number }[] = []

      if (shift.totalCash > 0) lines.push({ accountCode: '1000', debit: shift.totalCash })
      if (shift.totalCard > 0) lines.push({ accountCode: '1000', debit: shift.totalCard })
      if (shift.totalBankTransfer > 0) lines.push({ accountCode: '1100', debit: shift.totalBankTransfer })
      if (shift.totalInstapay > 0) lines.push({ accountCode: '1000', debit: shift.totalInstapay })
      if (shift.totalWallet > 0) lines.push({ accountCode: '1000', debit: shift.totalWallet })

      lines.push({ accountCode: '4000', credit: shift.totalSales })

      await createJournalEntry({
        date: shift.closedAt || new Date(),
        description: `Shift close #${shiftId.slice(0, 8)} (${shift.branchId})`,
        type: 'sale',
        lines,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Shift close accounting error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
