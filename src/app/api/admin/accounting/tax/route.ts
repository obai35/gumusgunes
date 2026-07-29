import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const fromParam = sp.get('from')
    const toParam = sp.get('to')

    const siteSetting = await sdb.siteSetting.findFirst({ where: { key: 'tax_rate' } })
    const taxRate = siteSetting ? parseFloat(siteSetting.value) / 100 : 0.14

    let from: Date, to: Date
    if (fromParam) {
      from = new Date(fromParam)
      from.setHours(0, 0, 0, 0)
    } else {
      from = new Date(year, 0, 1, 0, 0, 0, 0)
    }
    if (toParam) {
      to = new Date(toParam)
      to.setHours(23, 59, 59, 999)
    } else {
      to = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    const orders = await sdb.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: 'cancelled' },
        paymentStatus: 'paid',
      },
      select: {
        id: true,
        totalAmount: true,
        subtotal: true,
        tax: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const monthly: Record<string, { taxable: number; exempt: number; taxCollected: number; count: number }> = {}
    let totalTaxable = 0
    let totalExempt = 0
    let totalTaxCollected = 0

    for (const order of orders) {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!monthly[month]) monthly[month] = { taxable: 0, exempt: 0, taxCollected: 0, count: 0 }

      const taxAmount = order.tax || 0
      const taxableAmount = order.subtotal || (order.totalAmount - taxAmount)

      monthly[month].taxable += taxableAmount
      monthly[month].taxCollected += taxAmount
      monthly[month].count++
      totalTaxable += taxableAmount
      totalTaxCollected += taxAmount
    }

    totalExempt = totalTaxable > 0 ? 0 : totalTaxable

    const monthlyBreakdown = Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const taxPayableAccount = await sdb.account.findFirst({ where: { code: '2100' } })

    let actual: { total: number; monthly: { month: string; amount: number }[] } | null = null

    if (taxPayableAccount) {
      const lines = await sdb.journalLine.findMany({
        where: {
          accountId: taxPayableAccount.id,
          entry: {
            date: { gte: from, lte: to },
            status: 'approved',
          },
        },
        include: { entry: { select: { date: true } } },
      })

      const actualMonthly: Record<string, number> = {}
      let actualTotal = 0

      for (const line of lines) {
        const month = `${line.entry.date.getFullYear()}-${String(line.entry.date.getMonth() + 1).padStart(2, '0')}`
        actualMonthly[month] = (actualMonthly[month] || 0) + line.credit - line.debit
        actualTotal += line.credit - line.debit
      }

      actual = {
        total: actualTotal,
        monthly: Object.entries(actualMonthly)
          .map(([month, amount]) => ({ month, amount }))
          .sort((a, b) => a.month.localeCompare(b.month)),
      }
    }

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      taxRate,
      estimated: {
        totalTaxable,
        totalExempt,
        totalTaxCollected,
        taxOwed: totalTaxCollected,
      },
      actual,
      monthlyBreakdown,
    })
  } catch (e) {
    console.error('Tax GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch tax report' }, { status: 500 })
  }
}, 'accounting')
