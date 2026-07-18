import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const revenue = await db.journalLine.aggregate({
      where: { account: { code: '4000' }, entry: { date: { gte: yearStart } } },
      _sum: { credit: true },
    })
    const cogs = await db.journalLine.aggregate({
      where: { account: { code: '5000' }, entry: { date: { gte: yearStart } } },
      _sum: { debit: true },
    })
    const expenses = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '5' } }, entry: { date: { gte: yearStart } } },
      _sum: { debit: true },
    })
    const totalAssetsAgg = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '1' } } },
      _sum: { debit: true, credit: true },
    })
    const totalLiabilitiesAgg = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '2' } } },
      _sum: { debit: true, credit: true },
    })
    const totalInventoryAgg = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '3' } } },
      _sum: { debit: true, credit: true },
    })

    const totalRevenue = revenue._sum.credit || 0
    const totalCogs = cogs._sum.debit || 0
    const totalExpenses = expenses._sum.debit || 0
    const assets = (totalAssetsAgg._sum.debit || 0) - (totalAssetsAgg._sum.credit || 0)
    const liabilities = (totalLiabilitiesAgg._sum.credit || 0) - (totalLiabilitiesAgg._sum.debit || 0)
    const inventory = (totalInventoryAgg._sum.debit || 0) - (totalInventoryAgg._sum.credit || 0)
    const netIncome = totalRevenue - totalCogs - totalExpenses
    const equity = assets - liabilities

    return NextResponse.json({
      profitability: {
        grossMargin: { value: totalRevenue > 0 ? (totalRevenue - totalCogs) / totalRevenue : 0, label: 'Gross Margin', benchmark: 0.4 },
        netMargin: { value: totalRevenue > 0 ? netIncome / totalRevenue : 0, label: 'Net Margin', benchmark: 0.1 },
        roa: { value: assets > 0 ? netIncome / assets : 0, label: 'Return on Assets' },
      },
      liquidity: {
        currentRatio: { value: liabilities > 0 ? assets / liabilities : 0, label: 'Current Ratio', benchmark: 2.0 },
        quickRatio: { value: liabilities > 0 ? (assets - inventory) / liabilities : 0, label: 'Quick Ratio', benchmark: 1.0 },
      },
      efficiency: {
        assetTurnover: { value: assets > 0 ? totalRevenue / assets : 0, label: 'Asset Turnover' },
        inventoryTurnover: { value: inventory > 0 ? totalCogs / inventory : 0, label: 'Inventory Turnover' },
      },
    })
  } catch (e) {
    console.error('Ratios error:', e)
    return NextResponse.json({ error: 'Failed to fetch ratios' }, { status: 500 })
  }
}, 'accounting')
