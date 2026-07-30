import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { applyStatusFilter } from '@/lib/approval'

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

async function fetchPL(sdb: ReturnType<typeof storeDb>, start: Date, end: Date, statusFilter?: string | null) {
  const entryWhere: Record<string, unknown> = {
    date: { gte: start, lte: end },
  }
  applyStatusFilter(entryWhere, statusFilter)

  const accounts = await sdb.account.findMany({
    where: { type: { in: ['income', 'expense'] } },
    orderBy: { code: 'asc' },
    include: {
      journalLines: {
        where: { entry: entryWhere },
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

  return { incomeItems, expenseItems, totalIncome, totalExpenses, netProfit: totalIncome - totalExpenses }
}

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'year'
    const year = sp.get('year') || String(new Date().getFullYear())
    const month = sp.get('month') || String(new Date().getMonth() + 1)
    const comparison = sp.get('comparison')

    const statusFilter = sp.get('status')
    const { start, end } = getDateRange(period, year, month)

    const {
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpenses,
      netProfit,
    } = await fetchPL(sdb, start, end, statusFilter)

    let monthlyComparison: { month: string; income: number; expenses: number; net: number }[] | null = null

    if (comparison === 'monthly') {
      const months: { month: string; start: Date; end: Date }[] = []
      const y = parseInt(year)
      for (let m = 1; m <= 12; m++) {
        const ms = new Date(y, m - 1, 1, 0, 0, 0, 0)
        const me = new Date(y, m, 0, 23, 59, 59, 999)
        months.push({ month: `${y}-${String(m).padStart(2, '0')}`, start: ms, end: me })
      }

      monthlyComparison = []
      for (const m of months) {
        const mData = await fetchPL(sdb, m.start, m.end, statusFilter)
        monthlyComparison.push({
          month: m.month,
          income: mData.totalIncome,
          expenses: mData.totalExpenses,
          net: mData.netProfit,
        })
      }
    }

    let yoyComparison: {
      lastYear: { income: number; expenses: number; net: number }
      current: { income: number; expenses: number; net: number }
      change: { incomePct: number; expensesPct: number; netPct: number }
    } | null = null

    if (comparison === 'yoy') {
      const prevYear = parseInt(year) - 1
      const prevStart = new Date(start)
      prevStart.setFullYear(prevYear)
      const prevEnd = new Date(end)
      prevEnd.setFullYear(prevYear)

      const [currentPL, prevPL] = await Promise.all([
        fetchPL(sdb, start, end, statusFilter),
        fetchPL(sdb, prevStart, prevEnd, statusFilter),
      ])

      yoyComparison = {
        current: { income: currentPL.totalIncome, expenses: currentPL.totalExpenses, net: currentPL.netProfit },
        lastYear: { income: prevPL.totalIncome, expenses: prevPL.totalExpenses, net: prevPL.netProfit },
        change: {
          incomePct: prevPL.totalIncome > 0 ? ((currentPL.totalIncome - prevPL.totalIncome) / prevPL.totalIncome) * 100 : 0,
          expensesPct: prevPL.totalExpenses > 0 ? ((currentPL.totalExpenses - prevPL.totalExpenses) / prevPL.totalExpenses) * 100 : 0,
          netPct: prevPL.netProfit > 0 ? ((currentPL.netProfit - prevPL.netProfit) / prevPL.netProfit) * 100 : 0,
        },
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
      yoyComparison,
    })
  } catch (e) {
    console.error('P&L GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch P&L' }, { status: 500 })
  }
}, 'accounting')
