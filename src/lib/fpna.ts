import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

interface BudgetVsActual {
  accountCode: string
  accountName: string
  accountType: string
  budgeted: number
  actual: number
  variance: number
  variancePct: number
}

export async function getBudgetVsActual(
  storeId: string,
  year: number,
): Promise<{ items: BudgetVsActual[]; totalBudgeted: number; totalActual: number; totalVariance: number }> {
  const budgets = await storeDb(storeId).budget.findMany({
    where: { year },
  })

  if (budgets.length === 0) {
    return { items: [], totalBudgeted: 0, totalActual: 0, totalVariance: 0 }
  }

  const accountCodes = [...new Set(budgets.map(b => b.accountCode))]
  const accounts = await db.account.findMany({
    where: { code: { in: accountCodes } },
  })
  const accountMap = new Map(accounts.map(a => [a.code, a]))

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year + 1, 0, 1)

  const lines = await db.journalLine.findMany({
    where: {
      account: { code: { in: accountCodes } },
      entry: { date: { gte: startDate, lt: endDate }, storeId },
    },
  })

  const actualByAccount = new Map<string, number>()
  for (const line of lines) {
    const current = actualByAccount.get(line.accountId) ?? 0
    const account = await db.account.findUnique({ where: { id: line.accountId } })
    if (account) {
      if (account.type === 'income' || account.type === 'liability' || account.type === 'equity') {
        actualByAccount.set(line.accountId, current + (line.credit ?? 0) - (line.debit ?? 0))
      } else {
        actualByAccount.set(line.accountId, current + (line.debit ?? 0) - (line.credit ?? 0))
      }
    }
  }

  const actualByCode = new Map<string, number>()
  for (const [accountId, balance] of actualByAccount) {
    const acct = accounts.find(a => a.id === accountId)
    if (acct) {
      const current = actualByCode.get(acct.code) ?? 0
      actualByCode.set(acct.code, current + balance)
    }
  }

  const budgetByAccount = new Map<string, number>()
  for (const b of budgets) {
    const current = budgetByAccount.get(b.accountCode) ?? 0
    budgetByAccount.set(b.accountCode, current + b.amount)
  }

  const items: BudgetVsActual[] = []
  for (const [code, budgeted] of budgetByAccount) {
    const account = accountMap.get(code)
    const actual = actualByCode.get(code) ?? 0
    const variance = actual - budgeted
    const variancePct = budgeted !== 0 ? (variance / Math.abs(budgeted)) * 100 : 0
    items.push({
      accountCode: code,
      accountName: account?.name ?? code,
      accountType: account?.type ?? '',
      budgeted,
      actual,
      variance,
      variancePct,
    })
  }

  const totalBudgeted = items.reduce((s, i) => s + i.budgeted, 0)
  const totalActual = items.reduce((s, i) => s + i.actual, 0)
  const totalVariance = totalActual - totalBudgeted

  return { items, totalBudgeted, totalActual, totalVariance }
}

export async function getMonthlyBudgetVsActual(storeId: string, year: number) {
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const results: { month: number; budgeted: number; actual: number; variance: number }[] = []

  for (const month of months) {
    const budgets = await storeDb(storeId).budget.findMany({
      where: { year, month },
    })
    const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 1)

    const incomeAccounts = await db.account.findMany({ where: { type: 'income' } })
    const expenseAccounts = await db.account.findMany({ where: { type: 'expense' } })
    const incomeIds = incomeAccounts.map(a => a.id)
    const expenseIds = expenseAccounts.map(a => a.id)

    const incomeLines = await db.journalLine.findMany({
      where: { accountId: { in: incomeIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
    })
    const expenseLines = await db.journalLine.findMany({
      where: { accountId: { in: expenseIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
    })

    const totalIncome = incomeLines.reduce((s, l) => s + (l.credit ?? 0) - (l.debit ?? 0), 0)
    const totalExpenses = expenseLines.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0)
    const totalActual = totalIncome - totalExpenses

    results.push({
      month,
      budgeted: totalBudgeted,
      actual: totalActual,
      variance: totalActual - totalBudgeted,
    })
  }

  return results
}

export async function getFinancialProjections(storeId: string, baseYear: number, projectionYears: number = 3) {
  const incomeAccounts = await db.account.findMany({ where: { type: 'income' } })
  const expenseAccounts = await db.account.findMany({ where: { type: 'expense' } })

  const incomeIds = incomeAccounts.map(a => a.id)
  const expenseIds = expenseAccounts.map(a => a.id)

  const historicalData: { year: number; revenue: number; expenses: number; profit: number }[] = []

  for (let y = baseYear - 3; y <= baseYear; y++) {
    const startDate = new Date(y, 0, 1)
    const endDate = new Date(y + 1, 0, 1)

    const incomeLines = await db.journalLine.findMany({
      where: { accountId: { in: incomeIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
    })
    const expenseLines = await db.journalLine.findMany({
      where: { accountId: { in: expenseIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
    })

    const revenue = incomeLines.reduce((s, l) => s + (l.credit ?? 0) - (l.debit ?? 0), 0)
    const expenses = expenseLines.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0)

    historicalData.push({ year: y, revenue, expenses, profit: revenue - expenses })
  }

  const calculateTrend = (data: { year: number; value: number }[]) => {
    const n = data.length
    if (n < 2) return { slope: 0, intercept: 0, growthRate: 0 }
    const xMean = data.reduce((s, d) => s + d.year, 0) / n
    const yMean = data.reduce((s, d) => s + d.value, 0) / n
    let num = 0, den = 0
    for (const d of data) {
      num += (d.year - xMean) * (d.value - yMean)
      den += (d.year - xMean) ** 2
    }
    const slope = den !== 0 ? num / den : 0
    const intercept = yMean - slope * xMean
    const growthRate = yMean !== 0 ? slope / Math.abs(yMean) : 0
    return { slope, intercept, growthRate }
  }

  const revenueTrend = calculateTrend(historicalData.map(d => ({ year: d.year, value: d.revenue })))
  const expenseTrend = calculateTrend(historicalData.map(d => ({ year: d.year, value: d.expenses })))

  const projections: { year: number; projectedRevenue: number; projectedExpenses: number; projectedProfit: number }[] = []
  for (let y = baseYear + 1; y <= baseYear + projectionYears; y++) {
    const projectedRevenue = revenueTrend.intercept + revenueTrend.slope * y
    const projectedExpenses = expenseTrend.intercept + expenseTrend.slope * y
    projections.push({
      year: y,
      projectedRevenue: Math.max(0, projectedRevenue),
      projectedExpenses: Math.max(0, projectedExpenses),
      projectedProfit: projectedRevenue - projectedExpenses,
    })
  }

  return { historicalData, projections, trends: { revenue: revenueTrend, expenses: expenseTrend } }
}

export async function getKpiSummary(storeId: string, year: number) {
  const budgets = await storeDb(storeId).budget.findMany({ where: { year } })
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)

  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year + 1, 0, 1)

  const incomeAccounts = await db.account.findMany({ where: { type: 'income' } })
  const expenseAccounts = await db.account.findMany({ where: { type: 'expense' } })
  const assetAccounts = await db.account.findMany({ where: { type: 'asset' } })
  const liabilityAccounts = await db.account.findMany({ where: { type: 'liability' } })

  const incomeIds = incomeAccounts.map(a => a.id)
  const expenseIds = expenseAccounts.map(a => a.id)
  const assetIds = assetAccounts.map(a => a.id)
  const liabilityIds = liabilityAccounts.map(a => a.id)

  const incomeLines = await db.journalLine.findMany({
    where: { accountId: { in: incomeIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
  })
  const expenseLines = await db.journalLine.findMany({
    where: { accountId: { in: expenseIds }, entry: { date: { gte: startDate, lt: endDate }, storeId } },
  })
  const assetLines = await db.journalLine.findMany({
    where: { accountId: { in: assetIds }, entry: { storeId } },
  })
  const liabilityLines = await db.journalLine.findMany({
    where: { accountId: { in: liabilityIds }, entry: { storeId } },
  })

  const totalRevenue = incomeLines.reduce((s, l) => s + (l.credit ?? 0) - (l.debit ?? 0), 0)
  const totalExpenses = expenseLines.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0)
  const netProfit = totalRevenue - totalExpenses
  const totalAssets = assetLines.reduce((s, l) => s + (l.debit ?? 0) - (l.credit ?? 0), 0)
  const totalLiabilities = liabilityLines.reduce((s, l) => s + (l.credit ?? 0) - (l.debit ?? 0), 0)

  const expenseRatio = totalRevenue !== 0 ? (totalExpenses / totalRevenue) * 100 : 0
  const profitMargin = totalRevenue !== 0 ? (netProfit / totalRevenue) * 100 : 0
  const currentRatio = totalLiabilities !== 0 ? totalAssets / totalLiabilities : 0

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expenseRatio,
    totalAssets,
    totalLiabilities,
    currentRatio,
    budgetUtilization: totalBudgeted !== 0 ? (totalExpenses / totalBudgeted) * 100 : 0,
  }
}
