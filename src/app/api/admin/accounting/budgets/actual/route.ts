import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = sp.get('month') ? parseInt(sp.get('month')!) : undefined

    const budgets = await db.budget.findMany({
      where: { year },
      orderBy: [{ month: 'asc' }, { accountCode: 'asc' }],
    })

    const accountCodes = [...new Set(budgets.map(b => b.accountCode))]
    const accounts = await db.account.findMany({
      where: { code: { in: accountCodes } },
      select: { id: true, code: true, name: true, type: true },
    })
    const accountMap = new Map(accounts.map(a => [a.code, a]))

    const byMonth: Record<string, { month: number; items: { accountCode: string; accountName: string; budgeted: number; actual: number; variance: number; variancePct: number }[]; totalBudgeted: number; totalActual: number }> = {}

    const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1)

    for (const m of months) {
      const monthBudgets = budgets.filter(b => b.month === m)
      if (monthBudgets.length === 0) continue

      const key = `${year}-${String(m).padStart(2, '0')}`
      const items: any[] = []
      let totalBudgeted = 0
      let totalActual = 0

      for (const b of monthBudgets) {
        const accountInfo = accountMap.get(b.accountCode)
        if (!accountInfo) continue

        const startDate = new Date(year, m - 1, 1, 0, 0, 0, 0)
        const endDate = new Date(year, m, 0, 23, 59, 59, 999)

        const lines = await db.journalLine.findMany({
          where: {
            accountId: accountInfo.id,
            entry: { date: { gte: startDate, lte: endDate } },
          },
          select: { debit: true, credit: true },
        })

        const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
        let actual = totalCredit - totalDebit
        if (accountInfo.type === 'expense') {
          actual = totalDebit - totalCredit
        }

        const variance = b.amount > 0 ? ((actual - b.amount) / b.amount) * 100 : 0

        items.push({
          accountCode: b.accountCode,
          accountName: accountInfo.name,
          budgeted: b.amount,
          actual,
          variance: actual - b.amount,
          variancePct: Math.round(variance * 100) / 100,
        })
        totalBudgeted += b.amount
        totalActual += actual
      }

      byMonth[key] = { month: m, items, totalBudgeted, totalActual }
    }

    const grandTotalBudgeted = Object.values(byMonth).reduce((s, m) => s + m.totalBudgeted, 0)
    const grandTotalActual = Object.values(byMonth).reduce((s, m) => s + m.totalActual, 0)

    return NextResponse.json({
      year,
      byMonth: Object.values(byMonth).sort((a, b) => a.month - b.month),
      grandTotalBudgeted,
      grandTotalActual,
      grandVariance: grandTotalActual - grandTotalBudgeted,
      grandVariancePct: grandTotalBudgeted > 0 ? Math.round(((grandTotalActual - grandTotalBudgeted) / grandTotalBudgeted) * 10000) / 100 : 0,
    })
  } catch (e) {
    console.error('Budget actual GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch budget vs actual' }, { status: 500 })
  }
}, 'accounting')
