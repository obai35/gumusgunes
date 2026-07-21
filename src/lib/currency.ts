import { db } from '@/lib/db'
import { FX_GAIN_ACCOUNT, FX_LOSS_ACCOUNT } from './accounting'

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{ convertedAmount: number; rate: number }> {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1 }
  }
  const rate = await getExchangeRate(toCurrency)
  return { convertedAmount: parseFloat((amount * rate).toFixed(2)), rate }
}

export async function recordFXGainLoss(
  journalEntryId: string,
  originalAmount: number,
  convertedAmount: number,
  currency: string
): Promise<void> {
  if (currency === 'EGP') return

  const difference = convertedAmount - originalAmount
  if (Math.abs(difference) < 0.01) return

  console.log(
    `[FX] Entry ${journalEntryId}: ${difference > 0 ? 'gain' : 'loss'} of ${Math.abs(difference)} ${currency}`
  )
}

export async function getExchangeRate(currencyCode: string): Promise<number> {
  if (currencyCode === 'EGP') return 1

  const currency = await db.currency.findUnique({ where: { code: currencyCode } })
  if (!currency || !currency.isActive) return 1

  return currency.exchangeRate
}
