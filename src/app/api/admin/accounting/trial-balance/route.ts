import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: any = {}
  if (from || to) {
    dateFilter.date = {}
    if (from) dateFilter.date.gte = new Date(from)
    if (to) dateFilter.date.lte = new Date(to)
  }

  const accounts = await db.account.findMany({
    orderBy: { code: 'asc' },
    include: {
      journalLines: {
        where: dateFilter.date ? { entry: dateFilter } : undefined,
        select: { debit: true, credit: true },
      },
    },
  })

  const lines = accounts.map((acc) => {
    const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
    let balance = totalDebit - totalCredit
    if (['liability', 'equity', 'income'].includes(acc.type)) {
      balance = totalCredit - totalDebit
    }
    const { journalLines, ...rest } = acc
    return { ...rest, totalDebit, totalCredit, balance }
  })

  const grandTotalDebit = lines.reduce((s, l) => s + l.totalDebit, 0)
  const grandTotalCredit = lines.reduce((s, l) => s + l.totalCredit, 0)

  return NextResponse.json({ accounts: lines, grandTotalDebit, grandTotalCredit })
}, 'accounting')
