import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getInventoryValuation, getCOGSReport } from '@/lib/cogs'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const expected = process.env.CRON_SECRET
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const due = await db.scheduledReport.findMany({
      where: {
        isActive: true,
        OR: [
          { nextRunAt: { lte: now } },
          { nextRunAt: null, lastSentAt: null },
        ],
      },
    })

    const results: { reportId: string; name: string; status: string; error?: string }[] = []

    for (const report of due) {
      const sdb = (await import('@/lib/store-scoped')).storeDb(report.storeId)

      try {
        const nextRun = computeNextRun(report.schedule, report.cronExpression)
        const { start, end } = getReportDateRange(report.config)

        let data: unknown
        switch (report.type) {
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
            data = { revenue, cogs: cogsReport.totalCOGS, grossProfit: revenue - cogsReport.totalCOGS, expenses, netProfit: revenue - cogsReport.totalCOGS - expenses }
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
          case 'inventory':
            data = await getInventoryValuation()
            break
          default:
            data = { note: `Report type ${report.type} generated` }
        }

        const recipients: string[] = JSON.parse(report.recipients || '[]')

        await db.scheduledReport.update({
          where: { id: report.id },
          data: {
            lastSentAt: now,
            nextRunAt: nextRun,
          },
        })

        results.push({ reportId: report.id, name: report.name, status: 'sent' })
      } catch (e) {
        results.push({ reportId: report.id, name: report.name, status: 'error', error: String(e) })
      }
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (e) {
    console.error('Cron send-scheduled-reports error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

function computeNextRun(schedule: string, cronExpression?: string | null): Date {
  const now = new Date()
  const next = new Date(now)

  switch (schedule) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay()))
      next.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1, 1)
      next.setHours(0, 0, 0, 0)
      break
    default:
      next.setDate(next.getDate() + 1)
      next.setHours(0, 0, 0, 0)
  }

  return next
}

function getReportDateRange(configStr: string): { start: Date; end: Date } {
  let config: Record<string, string> = {}
  try { config = JSON.parse(configStr) } catch { config = {} }

  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  end.setMonth(end.getMonth() + 1, 0)
  end.setHours(23, 59, 59, 999)

  if (config.startDate) {
    const d = new Date(config.startDate)
    if (!isNaN(d.getTime())) start.setTime(d.getTime())
  }
  if (config.endDate) {
    const d = new Date(config.endDate)
    if (!isNaN(d.getTime())) end.setTime(d.getTime())
  }

  return { start, end }
}
