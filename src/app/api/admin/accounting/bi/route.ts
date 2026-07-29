import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { getInventoryValuation, getCOGSReport } from '@/lib/cogs'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const url = new URL(req.url)
    const period = url.searchParams.get('period') || 'month'

    const now = new Date()
    let start = new Date(now)
    let end = new Date(now)

    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'week': {
        const day = start.getDay()
        const diff = start.getDate() - day + (day === 0 ? -6 : 1)
        start.setDate(diff)
        start.setHours(0, 0, 0, 0)
        end.setDate(start.getDate() + 6)
        end.setHours(23, 59, 59, 999)
        break
      }
      case 'month':
        start.setDate(1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(end.getMonth() + 1, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'year':
        start.setMonth(0, 1)
        start.setHours(0, 0, 0, 0)
        end.setMonth(11, 31)
        end.setHours(23, 59, 59, 999)
        break
    }

    const [
      totalExpenses,
      orderCount,
      fulfilledCount,
      cancelledCount,
      valuation,
      cogsReport,
      topProducts,
      recentTransactions,
    ] = await Promise.all([
      sdb.expense.aggregate({
        where: { createdAt: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      sdb.order.count({ where: { createdAt: { gte: start, lte: end } } }),
      sdb.order.count({ where: { status: 'delivered', createdAt: { gte: start, lte: end } } }),
      sdb.order.count({ where: { status: 'cancelled', createdAt: { gte: start, lte: end } } }),
      getInventoryValuation(),
      getCOGSReport(start, end),
      sdb.orderItem.groupBy({
        by: ['productId'],
        where: { order: { createdAt: { gte: start, lte: end }, paymentStatus: 'paid' } },
        _sum: { price: true, quantity: true },
        orderBy: { _sum: { price: 'desc' } },
        take: 10,
      }),
      sdb.journalEntry.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { lines: { include: { account: true } } },
      }),
    ])

    // Compute revenue from sale journal entries (Prisma nested aggregate workaround)
    const saleEntries = await sdb.journalEntry.findMany({
      where: { type: 'sale', date: { gte: start, lte: end } },
      include: { lines: { include: { account: true } } },
    })
    const revenue = saleEntries.reduce((sum, entry) => {
      const revenueLines = entry.lines.filter(l => l.account.code === '4000')
      return sum + revenueLines.reduce((s, l) => s + l.credit, 0)
    }, 0)

    let topProductDetails: any[] = []
    if (topProducts && topProducts.length > 0) {
      const productIds = topProducts.map(p => p.productId)
      const products = await sdb.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true },
      })
      const productMap = new Map(products.map(p => [p.id, p]))
      topProductDetails = topProducts.map(p => ({
        ...p,
        product: productMap.get(p.productId) || null,
      }))
    }

    const expenses = totalExpenses._sum.amount || 0
    const cogs = cogsReport.totalCOGS
    const grossProfit = revenue - cogs
    const netProfit = grossProfit - expenses
    const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0

    const result = {
      period,
      dateRange: { start, end },
      kpis: {
        revenue: { value: revenue, label: 'Total Revenue', format: 'currency' },
        expenses: { value: expenses, label: 'Total Expenses', format: 'currency' },
        cogs: { value: cogs, label: 'Cost of Goods Sold', format: 'currency' },
        grossProfit: { value: grossProfit, label: 'Gross Profit', format: 'currency' },
        grossMargin: { value: revenue > 0 ? (grossProfit / revenue) * 100 : 0, label: 'Gross Margin', format: 'percent' },
        netProfit: { value: netProfit, label: 'Net Profit', format: 'currency' },
        netMargin: { value: revenue > 0 ? (netProfit / revenue) * 100 : 0, label: 'Net Margin', format: 'percent' },
        orderCount: { value: orderCount, label: 'Total Orders', format: 'number' },
        fulfilledCount: { value: fulfilledCount, label: 'Fulfilled Orders', format: 'number' },
        cancelledCount: { value: cancelledCount, label: 'Cancelled Orders', format: 'number' },
        avgOrderValue: { value: avgOrderValue, label: 'Avg Order Value', format: 'currency' },
        inventoryValue: { value: valuation.totalValue, label: 'Inventory Value', format: 'currency' },
      },
      topProducts: topProductDetails,
      recentTransactions,
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('BI dashboard error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
