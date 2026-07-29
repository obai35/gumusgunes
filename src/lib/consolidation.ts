import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { createJournalEntry, ACCOUNTS } from '@/lib/accounting'

export class ConsolidationError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ConsolidationError'
  }
}

export async function recordInterCompanyTxn(data: {
  groupId: string
  fromStoreId: string
  toStoreId: string
  amount: number
  currency?: string
  exchangeRate?: number
  description: string
  reference?: string
  type: 'sale' | 'purchase' | 'loan' | 'dividend' | 'service_fee' | 'expense_allocation'
  date?: Date
}) {
  const group = await db.group.findUnique({ where: { id: data.groupId }, include: { store: true } })
  if (!group) throw new ConsolidationError('Group not found', 'NOT_FOUND')

  const txn = await storeDb(group.storeId).interCompanyTransaction.create({
    data: {
      groupId: data.groupId,
      fromStoreId: data.fromStoreId,
      toStoreId: data.toStoreId,
      amount: data.amount,
      currency: data.currency ?? group.currency,
      exchangeRate: data.exchangeRate ?? 1,
      description: data.description,
      reference: data.reference,
      type: data.type,
      status: 'pending',
      date: data.date ?? new Date(),
    },
  })

  const fromStore = await db.store.findUnique({ where: { id: data.fromStoreId } })
  const toStore = await db.store.findUnique({ where: { id: data.toStoreId } })

  const entityDesc = `${fromStore?.name ?? data.fromStoreId} → ${toStore?.name ?? data.toStoreId}: ${data.description}`

  const journalEntry = await createJournalEntry({
    date: data.date ?? new Date(),
    description: `IC: ${entityDesc}`,
    reference: txn.id,
    type: 'reconciliation',
    lines: [
      { accountCode: ACCOUNTS.interCompany.dueFrom, debit: data.amount },
      { accountCode: ACCOUNTS.interCompany.dueTo, credit: data.amount },
    ],
  })

  await storeDb(group.storeId).interCompanyTransaction.update({
    where: { id: txn.id },
    data: { journalEntryId: journalEntry.id },
  })

  return { ...txn, journalEntry }
}

export async function runConsolidation(groupId: string, periodStart: Date, periodEnd: Date, runById?: string) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      entities: { include: { entityStore: true } },
      interCompanyTxns: { where: { status: { not: 'eliminated' }, date: { gte: periodStart, lte: periodEnd } } },
    },
  })
  if (!group) throw new ConsolidationError('Group not found', 'NOT_FOUND')
  if (group.entities.length === 0) throw new ConsolidationError('No entities in group', 'NO_ENTITIES')
  const primaryEntity = group.entities.find(e => e.isPrimary) ?? group.entities[0]

  const run = await storeDb(group.storeId).consolidationRun.create({
    data: {
      groupId,
      periodStart,
      periodEnd,
      status: 'running',
      totalEntities: group.entities.length,
      runById: runById,
    },
  })

  try {
    const eliminations: { accountCode: string; debit?: number; credit?: number }[] = []

    for (const txn of group.interCompanyTxns) {
      eliminations.push(
        { accountCode: ACCOUNTS.interCompany.dueTo, debit: txn.amount },
        { accountCode: ACCOUNTS.interCompany.dueFrom, credit: txn.amount }
      )
    }

    if (eliminations.length > 0) {
      await createJournalEntry({
        date: periodEnd,
        description: `Consolidation eliminations ${periodStart.toISOString().slice(0, 10)} - ${periodEnd.toISOString().slice(0, 10)}`,
        reference: `consolidation-${run.id}`,
        type: 'reconciliation',
        lines: eliminations,
      })
    }

    const eliminatedCount = group.interCompanyTxns.length
    for (const txn of group.interCompanyTxns) {
      await storeDb(group.storeId).interCompanyTransaction.update({
        where: { id: txn.id },
        data: { status: 'eliminated', eliminatedAt: periodEnd },
      })
    }

    const revenueAccounts = [ACCOUNTS.salesRevenue, ACCOUNTS.interCompany.icRevenue]
    const expenseAccounts = [ACCOUNTS.cogs, ACCOUNTS.interCompany.icExpense]

    let totalRevenue = 0
    let totalExpenses = 0
    let totalAssets = 0
    let totalLiabilities = 0
    let totalEquity = 0

    for (const entity of group.entities) {
      const entityDb = storeDb(entity.entityStore.id)

      const revenue = await entityDb.journalLine.aggregate({
        where: {
          entry: { date: { gte: periodStart, lte: periodEnd } },
          account: { code: { in: revenueAccounts } },
        },
        _sum: { credit: true },
      })
      totalRevenue += Number(revenue._sum.credit ?? 0)

      const expenses = await entityDb.journalLine.aggregate({
        where: {
          entry: { date: { gte: periodStart, lte: periodEnd } },
          account: { code: { in: expenseAccounts } },
        },
        _sum: { debit: true },
      })
      totalExpenses += Number(expenses._sum.debit ?? 0)

      const assetAccounts = await entityDb.account.findMany({
        where: {
          code: { startsWith: '1' },
          isActive: true,
        },
      })
      const assetCodes = assetAccounts.map(a => a.code)
      if (assetCodes.length > 0) {
        const assets = await entityDb.journalLine.aggregate({
          where: {
            entry: { date: { lte: periodEnd } },
            account: { code: { in: assetCodes } },
          },
          _sum: { debit: true },
        })
        totalAssets += Number(assets._sum.debit ?? 0)
      }

      const liabilityEquityAccounts = await entityDb.account.findMany({
        where: {
          OR: [
            { code: { startsWith: '2' } },
            { code: { startsWith: '3' } },
          ],
          isActive: true,
        },
      })
      const liabilityEquityCodes = liabilityEquityAccounts.map(a => a.code)
      if (liabilityEquityCodes.length > 0) {
        const liabEquity = await entityDb.journalLine.aggregate({
          where: {
            entry: { date: { lte: periodEnd } },
            account: { code: { in: liabilityEquityCodes } },
          },
          _sum: { credit: true },
        })
        totalLiabilities += Number(liabEquity._sum.credit ?? 0)
      }
    }

    totalEquity = totalAssets - totalLiabilities

    await storeDb(group.storeId).consolidationRun.update({
      where: { id: run.id },
      data: {
        status: 'completed',
        eliminatedTxns: eliminatedCount,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        totalAssets,
        totalLiabilities,
        totalEquity,
        completedAt: new Date(),
      },
    })

    return { id: run.id, eliminatedCount }
  } catch (error) {
    await storeDb(group.storeId).consolidationRun.update({
      where: { id: run.id },
      data: { status: 'failed', errorMessage: String(error) },
    })
    throw error
  }
}

export async function getConsolidatedPL(groupId: string, periodStart: Date, periodEnd: Date) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { entities: { include: { entityStore: true } } },
  })
  if (!group) throw new ConsolidationError('Group not found', 'NOT_FOUND')

  let totalRevenue = 0
  let totalCogs = 0
  let totalExpenses = 0
  let totalIcRevenue = 0
  let totalIcExpense = 0

  for (const entity of group.entities) {
    const sdb = storeDb(entity.entityStore.id)
    const journalEntries = await sdb.journalEntry.findMany({
      where: { date: { gte: periodStart, lte: periodEnd } },
      include: { lines: { include: { account: true } } },
    })

    for (const je of journalEntries) {
      for (const line of je.lines) {
        const code = line.account.code
        if (code === ACCOUNTS.salesRevenue) totalRevenue += line.credit - line.debit
        else if (code === ACCOUNTS.cogs) totalCogs += line.debit - line.credit
        else if (code.startsWith('5') && code !== ACCOUNTS.cogs && code !== ACCOUNTS.interCompany.icExpense) totalExpenses += line.debit - line.credit
        else if (code === ACCOUNTS.interCompany.icRevenue) totalIcRevenue += line.credit - line.debit
        else if (code === ACCOUNTS.interCompany.icExpense) totalIcExpense += line.debit - line.credit
      }
    }
  }

  const netIc = totalIcRevenue - totalIcExpense
  const grossProfit = totalRevenue - totalCogs
  const netIncome = grossProfit - totalExpenses + netIc

  return { totalRevenue, totalCogs, grossProfit, totalExpenses, totalIcRevenue, totalIcExpense, netIc, netIncome }
}

export async function getConsolidatedBalanceSheet(groupId: string, asOf: Date) {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { entities: { include: { entityStore: true } } },
  })
  if (!group) throw new ConsolidationError('Group not found', 'NOT_FOUND')

  let totalAssets = 0
  let totalLiabilities = 0
  let totalEquity = 0
  let totalIcDueFrom = 0
  let totalIcDueTo = 0

  for (const entity of group.entities) {
    const sdb = storeDb(entity.entityStore.id)
    const journalEntries = await sdb.journalEntry.findMany({
      where: { date: { lte: asOf } },
      include: { lines: { include: { account: true } } },
    })

    for (const je of journalEntries) {
      for (const line of je.lines) {
        const code = line.account.code
        const net = line.debit - line.credit
        if (code.startsWith('1')) {
          if (code === ACCOUNTS.interCompany.dueFrom) totalIcDueFrom += net
          else totalAssets += net
        } else if (code.startsWith('2')) {
          if (code === ACCOUNTS.interCompany.dueTo) totalIcDueTo -= net
          else totalLiabilities += net
        } else if (code.startsWith('3')) {
          totalEquity += net
        }
      }
    }
  }

  const elimination = Math.min(totalIcDueFrom, totalIcDueTo)
  const consolidatedAssets = totalAssets + (totalIcDueFrom - elimination)
  const consolidatedLiabilities = totalLiabilities + (totalIcDueTo - elimination)

  return { totalAssets: consolidatedAssets, totalLiabilities: consolidatedLiabilities, totalEquity, interCompanyDueFrom: totalIcDueFrom, interCompanyDueTo: totalIcDueTo, icElimination: elimination }
}
