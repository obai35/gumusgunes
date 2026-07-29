import { db } from '@/lib/db'
import { FX_GAIN_ACCOUNT, FX_LOSS_ACCOUNT } from './accounting'

export const BASE_CURRENCY = 'EGP'

let ratesCache: { code: string; exchangeRate: number }[] | null = null
let ratesCacheTime = 0
const CACHE_TTL = 300_000

export async function getExchangeRate(currency: string): Promise<number> {
  if (currency === BASE_CURRENCY) return 1
  const now = Date.now()
  if (!ratesCache || now - ratesCacheTime > CACHE_TTL) {
    ratesCache = await db.currency.findMany({
      where: { isActive: true },
      select: { code: true, exchangeRate: true },
    })
    ratesCacheTime = now
  }
  const found = ratesCache.find(c => c.code === currency)
  if (!found) return 1
  return found.exchangeRate
}

export function convertToBase(amount: number, fromCurrency: string, exchangeRate: number): number {
  if (fromCurrency === BASE_CURRENCY) return amount
  return amount * exchangeRate
}

export function fxGainLoss(
  recognizedAmount: number,
  settledAmount: number,
): { amount: number; accountCode: string } | null {
  const diff = settledAmount - recognizedAmount
  if (Math.abs(diff) < 0.01) return null
  if (diff > 0) return { amount: diff, accountCode: FX_GAIN_ACCOUNT }
  return { amount: Math.abs(diff), accountCode: FX_LOSS_ACCOUNT }
}

export function invalidateRatesCache(): void {
  ratesCache = null
  ratesCacheTime = 0
}
