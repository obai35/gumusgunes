import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function getDateRange(period: string, year?: string, month?: string): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (period === 'month' && year && month) {
    start.setFullYear(parseInt(year), parseInt(month) - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), parseInt(month), 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'quarter' && year && month) {
    const qStart = (Math.floor((parseInt(month) - 1) / 3)) * 3 + 1
    start.setFullYear(parseInt(year), qStart - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), qStart + 2, 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'year' && year) {
    start.setFullYear(parseInt(year), 0, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), 11, 31)
    end.setHours(23, 59, 59, 999)
  } else {
    start.setFullYear(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(now.getFullYear(), 11, 31)
    end.setHours(23, 59, 59, 999)
  }

  return { start, end }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'year'
    const year = sp.get('year') || String(new Date().getFullYear())
    const month = sp.get('month') || String(new Date().getMonth() + 1)
    const comparison = sp.get('comparison')

    const { start, end } = getDateRange(period, year, month)

    const accounts = await db.account.findMany({
      where: { type: { in: ['income', 'expense'] } },
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            entry: {
              date: { gte: start, lte: end },
            },
          },
          select: { debit: true, credit: true },
        },
      },
    })

    const incomeAccounts = accounts.filter(a => a.type === 'income')
    const expenseAccounts = accounts.filter(a => a.type === 'expense')

    const incomeItems = incomeAccounts.map(acc => {
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      return { code: acc.code, name: acc.name, nameAr: acc.nameAr, balance: totalCredit - totalDebit }
    })

    const expenseItems = expenseAccounts.map(acc => {
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      return { code: acc.code, name: acc.name, nameAr: acc.nameAr, balance: totalDebit - totalCredit }
    })

    const totalIncome = incomeItems.reduce((s, i) => s + i.balance, 0)
    const totalExpenses = expenseItems.reduce((s, e) => s + e.balance, 0)
    const netProfit = totalIncome - totalExpenses

    let monthlyComparison: { month: string; income: number; expenses: number; net: number }[] | null = null

    if (comparison === 'monthly') {
      const months: { month: string; start: Date; end: Date }[] = []
      const y = parseInt(year)
      for (let m = 1; m <= 12; m++) {
        const ms = new Date(y, m - 1, 1, 0, 0, 0, 0)
        const me = new Date(y, m, 0, 23, 59, 59, 999)
        months.push({ month: `${y}-${String(m).padStart(2, '0')}`, start: ms, end: me })
      }

      const allIncome = await db.account.findMany({
        where: { type: 'income' },
        select: { id: true, code: true, name: true },
      })
      const allExpense = await db.account.findMany({
        where: { type: 'expense' },
        select: { id: true, code: true, name: true },
      })

      monthlyComparison = []
      for (const m of months) {
        const [incomeLines, expenseLines] = await Promise.all([
          db.journalLine.findMany({
            where: {
              accountId: { in: allIncome.map(a => a.id) },
              entry: { date: { gte: m.start, lte: m.end } },
            },
            select: { debit: true, credit: true },
          }),
          db.journalLine.findMany({
            where: {
              accountId: { in: allExpense.map(a => a.id) },
              entry: { date: { gte: m.start, lte: m.end } },
            },
            select: { debit: true, credit: true },
          }),
        ])
        const inc = incomeLines.reduce((s, l) => s + l.credit - l.debit, 0)
        const exp = expenseLines.reduce((s, l) => s + l.debit - l.credit, 0)
        monthlyComparison.push({ month: m.month, income: inc, expenses: exp, net: inc - exp })
      }
    }

    return NextResponse.json({
      period,
      year,
      month,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpenses,
      netProfit,
      monthlyComparison,
    })
  } catch (e) {
    console.error('P&L GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch P&L' }, { status: 500 })
  }
}, 'accounting')
