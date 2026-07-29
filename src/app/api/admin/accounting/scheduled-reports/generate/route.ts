import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { getInventoryValuation, getCOGSReport } from '@/lib/cogs'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { type, config } = await req.json()
    if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

    const filterConfig = config || {}
    const now = new Date()
    let start = new Date(now)
    let end = new Date(now)

    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    end.setMonth(end.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)

    if (filterConfig.startDate) start = new Date(filterConfig.startDate)
    if (filterConfig.endDate) end = new Date(filterConfig.endDate)

    let data: any

    switch (type) {
      case 'pl': {
        const saleEntries = await sdb.journalEntry.findMany({
          where: { type: 'sale', date: { gte: start, lte: end } },
          include: { lines: { include: { account: true } } },
        })
        const expenseEntries = await sdb.journalEntry.findMany({
          where: { type: 'expense', date: { gte: start, lte: end } },
          include: { lines: { include: { account: true } } },
        })
        const cogsReport = await getCOGSReport(start, end)

        const revenue = saleEntries.reduce((s, e) => s + e.lines.filter(l => l.account.code === '4000').reduce((s2, l) => s2 + l.credit, 0), 0)
        const expenses = expenseEntries.reduce((s, e) => s + e.lines.filter(l => l.debit > 0).reduce((s2, l) => s2 + l.debit, 0), 0)

        data = {
          revenue,
          cogs: cogsReport.totalCOGS,
          grossProfit: revenue - cogsReport.totalCOGS,
          expenses,
          netProfit: revenue - cogsReport.totalCOGS - expenses,
        }
        break
      }
      case 'balance_sheet': {
        const accounts = await sdb.account.findMany({
          include: {
            journalLines: {
              where: { entry: { date: { lte: end } } },
            },
          },
        })
        const assets = accounts.filter(a => a.type === 'asset').reduce((s, a) => {
          const balance = a.journalLines.reduce((s2, l) => s2 + l.debit - l.credit, 0)
          return s + balance
        }, 0)
        const liabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => {
          const balance = a.journalLines.reduce((s2, l) => s2 + l.credit - l.debit, 0)
          return s + balance
        }, 0)
        const equity = accounts.filter(a => a.type === 'equity').reduce((s, a) => {
          const balance = a.journalLines.reduce((s2, l) => s2 + l.credit - l.debit, 0)
          return s + balance
        }, 0)

        data = { totalAssets: assets, totalLiabilities: liabilities, totalEquity: equity, balanced: Math.abs(assets - (liabilities + equity)) < 0.01 }
        break
      }
      case 'tax': {
        const saleEntries = await sdb.journalEntry.findMany({
          where: { type: 'sale', date: { gte: start, lte: end } },
          include: { lines: { include: { account: true } } },
        })
        const revenue = saleEntries.reduce((s, e) => s + e.lines.filter(l => l.account.code === '4000').reduce((s2, l) => s2 + l.credit, 0), 0)
        const taxRate = await sdb.taxRate.findFirst({ where: { isActive: true } })
        data = { taxableRevenue: revenue, taxRate: taxRate?.rate || 0, estimatedTax: revenue * (taxRate?.rate || 0) / 100 }
        break
      }
      case 'aging': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
        const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

        const arEntries = await sdb.journalEntry.findMany({
          where: { type: 'sale' },
          include: { lines: { include: { account: true } } },
        })

        const arBalance = arEntries
          .filter(e => e.lines.some(l => l.account.code === '1200'))
          .reduce((s, e) => s + e.lines.filter(l => l.account.code === '1200').reduce((s2, l) => s2 + l.debit - l.credit, 0), 0)

        const orders = await sdb.order.findMany({
          where: { paymentStatus: { not: 'paid' }, status: { not: 'cancelled' } },
          select: { id: true, totalAmount: true, createdAt: true },
        })

        data = {
          totalAR: arBalance,
          current: orders.filter(o => o.createdAt > thirtyDaysAgo).reduce((s, o) => s + o.totalAmount, 0),
          '1-30': orders.filter(o => o.createdAt > sixtyDaysAgo && o.createdAt <= thirtyDaysAgo).reduce((s, o) => s + o.totalAmount, 0),
          '31-60': orders.filter(o => o.createdAt > ninetyDaysAgo && o.createdAt <= sixtyDaysAgo).reduce((s, o) => s + o.totalAmount, 0),
          '61+': orders.filter(o => o.createdAt <= ninetyDaysAgo).reduce((s, o) => s + o.totalAmount, 0),
        }
        break
      }
      case 'inventory':
        data = await getInventoryValuation()
        break
      default:
        return NextResponse.json({ error: `Unknown report type: ${type}` }, { status: 400 })
    }

    return NextResponse.json({ type, dateRange: { start, end }, data })
  } catch (e) {
    console.error('Generate report error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
