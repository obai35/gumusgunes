import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { createJournalEntry, ACCOUNTS } from '@/lib/accounting'

export const GET = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const run = await sdb.payrollRun.findFirst({
    where: { id: params.id },
    include: { items: { include: { employee: true } }, processedBy: true },
  })
  if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })
  return NextResponse.json({ run })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const { action } = await req.json()

  const run = await sdb.payrollRun.findFirst({ where: { id: params.id } })
  if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })

  switch (action) {
    case 'approve': {
      if (run.status !== 'draft') {
        return NextResponse.json({ error: 'Can only approve draft runs' }, { status: 400 })
      }
      const updated = await sdb.payrollRun.update({
        where: { id: params.id },
        data: { status: 'approved', processedById: admin.id },
        include: { items: { include: { employee: true } }, processedBy: true },
      })
      // Auto-accounting: accrue salary expense
      if (run.totalNet > 0) {
        await createJournalEntry({
          date: new Date(),
          description: `Payroll ${run.periodStart.toISOString().slice(0, 10)} — ${run.periodEnd.toISOString().slice(0, 10)}`,
          reference: run.id,
          type: 'expense',
          lines: [
            { accountCode: ACCOUNTS.expenses.salaries, debit: run.totalNet },
            { accountCode: ACCOUNTS.salaryPayable, credit: run.totalNet },
          ],
        })
      }
      return NextResponse.json({ run: updated })
    }
    case 'pay': {
      if (run.status !== 'approved') {
        return NextResponse.json({ error: 'Payroll must be approved before payment' }, { status: 400 })
      }
      const updated = await sdb.payrollRun.update({
        where: { id: params.id },
        data: { status: 'paid', paidAt: new Date() },
        include: { items: { include: { employee: true } }, processedBy: true },
      })
      // Auto-accounting: clear salary payable, debit cash
      if (run.totalNet > 0) {
        await createJournalEntry({
          date: new Date(),
          description: `Payroll payment ${run.periodStart.toISOString().slice(0, 10)} — ${run.periodEnd.toISOString().slice(0, 10)}`,
          reference: run.id,
          type: 'expense',
          lines: [
            { accountCode: ACCOUNTS.salaryPayable, debit: run.totalNet },
            { accountCode: ACCOUNTS.cash, credit: run.totalNet },
          ],
        })
      }
      return NextResponse.json({ run: updated })
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}, 'accounting')
