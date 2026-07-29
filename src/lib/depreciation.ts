import { storeDb } from '@/lib/store-scoped'
import { createJournalEntry, ACCOUNTS } from './accounting'

export function calculateStraightLine(cost: number, salvage: number, lifeYears: number): number {
  if (lifeYears <= 0) return 0
  return Math.max(0, (cost - salvage) / lifeYears)
}

export function calculateDecliningBalance(cost: number, salvage: number, lifeYears: number, year: number): number {
  if (lifeYears <= 0 || year <= 0) return 0
  const rate = 2 / lifeYears
  const bookValue = cost - (cost - salvage) * (1 - Math.pow(1 - rate, year - 1))
  const depreciation = bookValue * rate
  const maxDep = cost - salvage - (cost - salvage) * (1 - Math.pow(1 - rate, year - 1))
  return Math.max(0, Math.min(depreciation, maxDep))
}

export function calculateSumOfYears(cost: number, salvage: number, lifeYears: number, year: number): number {
  if (lifeYears <= 0 || year <= 0) return 0
  const remainingLife = lifeYears - year + 1
  const sumOfYears = (lifeYears * (lifeYears + 1)) / 2
  return Math.max(0, ((cost - salvage) * remainingLife) / sumOfYears)
}

export function calculateYearlyDepreciation(
  cost: number,
  salvage: number,
  lifeYears: number,
  method: string,
  year: number,
): number {
  switch (method) {
    case 'straight-line':
      return calculateStraightLine(cost, salvage, lifeYears)
    case 'declining-balance':
      return calculateDecliningBalance(cost, salvage, lifeYears, year)
    case 'sum-of-years':
      return calculateSumOfYears(cost, salvage, lifeYears, year)
    default:
      return calculateStraightLine(cost, salvage, lifeYears)
  }
}

export async function getAssetSchedule(asset: {
  purchaseCost: number
  salvageValue: number
  usefulLifeYears: number
  depreciationMethod: string
  purchaseDate: Date
}) {
  const schedule: { year: number; amount: number; bookValue: number }[] = []
  let remaining = asset.purchaseCost - asset.salvageValue

  for (let y = 1; y <= asset.usefulLifeYears; y++) {
    const amount = calculateYearlyDepreciation(
      asset.purchaseCost, asset.salvageValue, asset.usefulLifeYears,
      asset.depreciationMethod, y,
    )
    remaining -= amount
    schedule.push({
      year: y,
      amount: Math.round(amount * 100) / 100,
      bookValue: Math.max(0, Math.round((asset.purchaseCost - (asset.purchaseCost - asset.salvageValue - remaining)) * 100) / 100),
    })
  }
  return schedule
}

export async function runDepreciationForAsset(storeId: string, assetId: string, periodDate: Date) {
  const asset = await storeDb(storeId).fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Asset not found')
  if (asset.status !== 'active') throw new Error('Asset is not active')

  const yearsSincePurchase = new Date(periodDate).getFullYear() - new Date(asset.purchaseDate).getFullYear()
  const year = Math.min(Math.max(1, yearsSincePurchase), asset.usefulLifeYears)

  const amount = calculateYearlyDepreciation(
    asset.purchaseCost, asset.salvageValue, asset.usefulLifeYears,
    asset.depreciationMethod, year,
  )

  if (amount <= 0) return null

  const entry = await createJournalEntry({
    date: periodDate,
    description: `Depreciation for ${asset.name} (${asset.depreciationMethod})`,
    reference: asset.id,
    storeId,
    type: 'depreciation',
    lines: [
      { accountCode: ACCOUNTS.expenses.depreciation, debit: amount },
      { accountCode: ACCOUNTS.accumulatedDepreciation, credit: amount },
    ],
  })

  const newAccumulated = asset.accumulatedDepreciation + amount
  const newBookValue = Math.max(0, asset.purchaseCost - newAccumulated)
  const newStatus = newBookValue <= 0 ? 'fully-depreciated' : 'active'

  await storeDb(storeId).depreciationEntry.create({
    data: {
      assetId: asset.id,
      periodDate,
      amount,
      journalEntryId: entry.id,
    },
  })

  await storeDb(storeId).fixedAsset.update({
    where: { id: assetId },
    data: {
      accumulatedDepreciation: newAccumulated,
      currentBookValue: newBookValue,
      status: newStatus,
    },
  })

  return { entry, amount, newBookValue, newStatus }
}

export async function recordAssetAcquisition(storeId: string, assetId: string) {
  const asset = await storeDb(storeId).fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Asset not found')

  return createJournalEntry({
    date: asset.purchaseDate,
    description: `Acquisition of ${asset.name} (${asset.assetNumber})`,
    reference: asset.id,
    storeId,
    type: 'asset-acquisition',
    lines: [
      { accountCode: ACCOUNTS.fixedAssets, debit: asset.purchaseCost },
      { accountCode: ACCOUNTS.cash, credit: asset.purchaseCost },
    ],
  })
}

export async function recordAssetDisposal(storeId: string, assetId: string, disposalDate: Date, proceeds: number) {
  const asset = await storeDb(storeId).fixedAsset.findUnique({ where: { id: assetId } })
  if (!asset) throw new Error('Asset not found')

  const bookValue = asset.currentBookValue
  const gainLoss = proceeds - bookValue
  const lines: { accountCode: string; debit?: number; credit?: number }[] = [
    { accountCode: ACCOUNTS.accumulatedDepreciation, debit: asset.accumulatedDepreciation },
    { accountCode: ACCOUNTS.fixedAssets, credit: asset.purchaseCost },
  ]
  if (proceeds > 0) {
    lines.push({ accountCode: ACCOUNTS.cash, debit: proceeds })
  }
  if (gainLoss > 0) {
    lines.push({ accountCode: ACCOUNTS.salesRevenue, credit: gainLoss })
  } else if (gainLoss < 0) {
    lines.push({ accountCode: ACCOUNTS.expenses.other, debit: Math.abs(gainLoss) })
  }

  const entry = await createJournalEntry({
    date: disposalDate,
    description: `Disposal of ${asset.name} (${asset.assetNumber})`,
    reference: asset.id,
    storeId,
    type: 'depreciation',
    lines,
  })

  await storeDb(storeId).fixedAsset.update({
    where: { id: assetId },
    data: { status: 'disposed', disposalDate, disposalProceeds: proceeds, currentBookValue: 0 },
  })

  return { entry, gainLoss }
}
