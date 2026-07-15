import { db } from '@/lib/db'

export async function getApplicableTaxRate(country: string, region?: string): Promise<{ name: string; rate: number } | null> {
  try {
    let rate = await db.taxRate.findFirst({
      where: { country, region: region || null, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    if (!rate && region) {
      rate = await db.taxRate.findFirst({
        where: { country, region: null, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    }
    if (!rate) {
      rate = await db.taxRate.findFirst({
        where: { country: 'EG', isActive: true },
        orderBy: { createdAt: 'desc' },
      })
    }
    return rate ? { name: rate.name, rate: rate.rate } : null
  } catch { return null }
}

export function calculateTax(subtotal: number, shipping: number, taxRate: number): number {
  return parseFloat(((subtotal + shipping) * (taxRate / 100)).toFixed(2))
}
