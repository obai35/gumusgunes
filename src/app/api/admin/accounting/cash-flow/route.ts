import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function getDateRange(period: string, customStart?: string, customEnd?: string) {
  if (customStart && customEnd) {
    const start = new Date(customStart); start.setHours(0, 0, 0, 0)
    const end = new Date(customEnd); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  const now = new Date()
  const start = new Date(now); const end = new Date(now)
  switch (period) {
    case 'day': start.setHours(0,0,0,0); end.setHours(23,59,59,999); break
    case 'week': { const d = start.getDay(); const diff = start.getDate() - d + (d === 0 ? -6 : 1); start.setDate(diff); start.setHours(0,0,0,0); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999); break }
    case 'month': start.setDate(1); start.setHours(0,0,0,0); end.setMonth(end.getMonth() + 1, 0); end.setHours(23,59,59,999); break
    case 'year': start.setMonth(0,1); start.setHours(0,0,0,0); end.setMonth(11,31); end.setHours(23,59,59,999); break
  }
  return { start, end }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'month'
    const customStart = req.nextUrl.searchParams.get('customStart') || undefined
    const customEnd = req.nextUrl.searchParams.get('customEnd') || undefined
    const { start, end } = getDateRange(period, customStart, customEnd)

    const cashAccount = await db.account.findUnique({ where: { code: '1000' } })
    const bankAccount = await db.account.findUnique({ where: { code: '1100' } })
    const cashId = cashAccount?.id
    const bankId = bankAccount?.id

    const lines = await db.journalLine.findMany({
      where: {
        accountId: { in: [cashId, bankId].filter(Boolean) as string[] },
        entry: { date: { gte: start, lte: end } },
      },
      select: { debit: true, credit: true, accountId: true, entry: { select: { description: true, date: true, type: true } } },
      orderBy: { entry: { date: 'asc' } },
    })

    const cashInflow = lines.filter(l => l.credit > 0).reduce((s, l) => s + l.credit, 0)
    const cashOutflow = lines.filter(l => l.debit > 0).reduce((s, l) => s + l.debit, 0)

    const totalDebit = await db.journalLine.aggregate({
      where: { accountId: { in: [cashId, bankId].filter(Boolean) as string[] } },
      _sum: { debit: true, credit: true },
    })

    const allEntries = await db.journalEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        lines: {
          where: { accountId: { in: [cashId, bankId].filter(Boolean) as string[] } },
          select: { debit: true, credit: true, accountId: true },
        },
      },
    })

    const operatingItems: { label: string; amount: number }[] = []
    const investingItems: { label: string; amount: number }[] = []
    const financingItems: { label: string; amount: number }[] = []

    for (const entry of allEntries) {
      const netCash = entry.lines.reduce((s, l) => s + l.credit - l.debit, 0)
      if (entry.type === 'sale') operatingItems.push({ label: entry.description, amount: netCash })
      else if (entry.type === 'expense') operatingItems.push({ label: entry.description, amount: netCash })
      else if (entry.type === 'reconciliation') operatingItems.push({ label: entry.description, amount: netCash })
      else operatingItems.push({ label: entry.description, amount: netCash })
    }

    const openingCash = (totalDebit._sum.credit || 0) - (totalDebit._sum.debit || 0) - cashInflow + cashOutflow

    return NextResponse.json({
      period, dateRange: { start: start.toISOString(), end: end.toISOString() }, method: 'direct',
      operating: { cashReceipts: cashInflow, cashPayments: cashOutflow, netOperating: cashInflow - cashOutflow, items: operatingItems },
      investing: { netInvesting: 0, items: investingItems },
      financing: { netFinancing: 0, items: financingItems },
      netCashFlow: cashInflow - cashOutflow,
      openingCash: Math.max(0, openingCash),
      closingCash: Math.max(0, openingCash + cashInflow - cashOutflow),
    })
  } catch (e) {
    console.error('Cash flow error:', e)
    return NextResponse.json({ error: 'Failed to fetch cash flow' }, { status: 500 })
  }
}, 'accounting')
