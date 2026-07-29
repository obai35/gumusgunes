import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

function getDateRange(period: string, date?: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  if (customStart && customEnd) {
    const start = new Date(customStart)
    start.setHours(0, 0, 0, 0)
    const end = new Date(customEnd)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const now = date ? new Date(date) : new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (period) {
    case 'day': {
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'week': {
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'month': {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(end.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
    }
    case 'year': {
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(11, 31)
      end.setHours(23, 59, 59, 999)
      break
    }
  }
  return { start, end }
}

function getPreviousDateRange(range: { start: Date; end: Date }): { start: Date; end: Date } {
  const diff = range.end.getTime() - range.start.getTime()
  const prevEnd = new Date(range.start.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - diff)
  return { start: prevStart, end: prevEnd }
}

async function fetchPeriodMetrics(from: Date, to: Date, sdb: ReturnType<typeof storeDb>) {
  const [orders, revenueAgg, returns, expensesSum] = await Promise.all([
    sdb.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
      select: { id: true, totalAmount: true, createdAt: true, paymentMethod: true, cashAmount: true, cardAmount: true, status: true, shiftId: true },
      take: 1000,
    }),
    sdb.order.aggregate({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    }),
    sdb.return.findMany({
      where: { createdAt: { gte: from, lte: to }, refundMethod: { not: 'no_refund' } },
      select: { refundAmount: true },
    }),
    sdb.expense.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
  ])

  const orderShiftIds = [...new Set(orders.map(o => o.shiftId).filter(Boolean))] as string[]
  const shifts = orderShiftIds.length > 0
    ? await sdb.shift.findMany({
        where: { id: { in: orderShiftIds } },
        select: { id: true, branch: { select: { name: true } } },
      })
    : []
  const branchByShiftId = new Map(shifts.map(s => [s.id, s.branch?.name || 'Unknown']))

  return {
    orders,
    branchByShiftId,
    totalRevenue: revenueAgg._sum.totalAmount || 0,
    totalReturns: returns.reduce((sum, r) => sum + r.refundAmount, 0),
    totalExpenses: expensesSum._sum.amount || 0,
    netRevenue: (revenueAgg._sum.totalAmount || 0) - returns.reduce((sum, r) => sum + r.refundAmount, 0) - (expensesSum._sum.amount || 0),
  }
}

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const period = req.nextUrl.searchParams.get('period') || 'day'
    const date = req.nextUrl.searchParams.get('date') || undefined
    const customStart = req.nextUrl.searchParams.get('customStart') || undefined
    const customEnd = req.nextUrl.searchParams.get('customEnd') || undefined
    const comparePeriod = req.nextUrl.searchParams.get('comparePeriod') || ''

    const { start, end } = getDateRange(period, date, customStart, customEnd)

    const [
      metrics,
      pendingOrders,
      unreconciledOrders,
      openShifts,
    ] = await Promise.all([
      fetchPeriodMetrics(start, end, sdb),
      sdb.order.count({ where: { status: { notIn: ['delivered', 'cancelled'] } } }),
      sdb.order.count({ where: { reconciledAt: null, paymentStatus: 'paid' } }),
      sdb.shift.count({ where: { isOpen: true } }),
    ])

    const { orders, branchByShiftId, totalRevenue, totalReturns, totalExpenses, netRevenue } = metrics

    const dailyMap: Record<string, number> = {}
    for (const o of orders) {
      const d = new Date(o.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyMap[key] = (dailyMap[key] || 0) + o.totalAmount
    }

    const rangeDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    const useMonthly = rangeDays > 90

    const dailyEntries = Object.entries(dailyMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date))

    let dailyRevenue: { date: string; revenue: number }[]
    if (useMonthly) {
      const monthMap: Record<string, number> = {}
      for (const d of dailyEntries) {
        const month = d.date.slice(0, 7)
        monthMap[month] = (monthMap[month] || 0) + d.revenue
      }
      dailyRevenue = Object.entries(monthMap)
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date))
    } else {
      dailyRevenue = dailyEntries
    }

    const paymentBreakdown: Record<string, number> = {
      cash: 0, card: 0, split: 0, bank_transfer: 0, instapay: 0, wallet: 0,
    }
    for (const o of orders) {
      if (o.paymentMethod === 'split') {
        paymentBreakdown.cash += o.cashAmount || 0
        paymentBreakdown.card += o.cardAmount || 0
      } else if (o.paymentMethod in paymentBreakdown) {
        paymentBreakdown[o.paymentMethod] += o.totalAmount
      }
    }

    const branchRevenue: Record<string, number> = {}
    for (const o of orders) {
      const name = branchByShiftId.get(o.shiftId || '') || 'Unknown'
      branchRevenue[name] = (branchRevenue[name] || 0) + o.totalAmount
    }

    const openShiftsList = await sdb.shift.findMany({
      where: { isOpen: true },
      include: { branch: { select: { name: true } } },
    })

    const statusCounts: Record<string, number> = {}
    for (const o of orders) {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
    }

    const result: Record<string, any> = {
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      totalOrders: orders.length,
      totalRevenue,
      totalReturns,
      totalExpenses,
      netRevenue,
      pendingOrders,
      unreconciledOrders,
      pendingRefunds: metrics.totalReturns > 0 ? 1 : 0,
      openShifts: openShiftsList.length,
      openShiftBranches: openShiftsList.map((s: any) => s.branch.name),
      paymentBreakdown,
      branchRevenue,
      statusCounts,
      avgOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      dailyRevenue,
    }

    // Budget vs Actual
    const budgetYear = start.getFullYear()
    const budgetMonth = start.getMonth() + 1
    const budgets = await sdb.budget.findMany({ where: { year: budgetYear, month: budgetMonth } })
    let totalBudgeted = 0
    let totalActual = 0
    if (budgets.length > 0) {
      const accountCodes = budgets.map(b => b.accountCode)
      const budgetAccounts = await sdb.account.findMany({ where: { code: { in: accountCodes } }, select: { id: true, code: true, type: true } })
      const accountByCode = new Map(budgetAccounts.map(a => [a.code, a]))
      totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)

      for (const b of budgets) {
        const acc = accountByCode.get(b.accountCode)
        if (!acc) continue
        const lines = await sdb.journalLine.findMany({
          where: {
            accountId: acc.id,
            entry: { date: { gte: start, lte: end } },
          },
          select: { debit: true, credit: true },
        })
        const debit = lines.reduce((s, l) => s + l.debit, 0)
        const credit = lines.reduce((s, l) => s + l.credit, 0)
        if (acc.type === 'expense') totalActual += debit - credit
        else totalActual += credit - debit
      }
    }

    result.budgetComparison = {
      budgeted: totalBudgeted,
      actual: totalActual,
      variance: totalActual - totalBudgeted,
      variancePct: totalBudgeted > 0 ? Math.round(((totalActual - totalBudgeted) / totalBudgeted) * 10000) / 100 : 0,
    }

    if (comparePeriod === 'previous') {
      const prevRange = getPreviousDateRange({ start, end })
      const prevMetrics = await fetchPeriodMetrics(prevRange.start, prevRange.end, sdb)

      result.compare = {
        compareRevenue: prevMetrics.totalRevenue,
        compareTotalOrders: prevMetrics.orders.length,
        compareNetRevenue: prevMetrics.netRevenue,
        compareDateRange: { start: prevRange.start.toISOString(), end: prevRange.end.toISOString() },
      }
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Overview GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch overview' }, { status: 500 })
  }
}, 'accounting')
