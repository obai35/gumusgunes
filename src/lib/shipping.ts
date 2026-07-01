import { db } from './db'

export type ShippingOption = {
  methodId: string
  methodName: string
  estimatedDays: string
  price: number
}

export async function getShippingOptions(governorateId: string): Promise<ShippingOption[]> {
  const rates = await db.shippingRate.findMany({
    where: {
      governorateId,
      method: { isActive: true },
    },
    include: { method: { select: { id: true, name: true, estimatedDays: true } } },
  })
  return rates.map(r => ({
    methodId: r.method.id,
    methodName: r.method.name,
    estimatedDays: r.method.estimatedDays,
    price: r.price,
  }))
}

export async function calculateShippingCost(params: {
  methodId: string
  governorateId: string
  subtotal: number
  couponCode?: string | null
}): Promise<{ baseCost: number; finalCost: number; discount: number; ruleName?: string }> {
  const rate = await db.shippingRate.findUnique({
    where: { methodId_governorateId: { methodId: params.methodId, governorateId: params.governorateId } },
  })
  if (!rate) throw new Error('Shipping not available for this method and location')

  const baseCost = rate.price
  let finalCost = baseCost

  // Check automatic shipping rules (no coupon required)
  const now = new Date()
  const matchingRules = await db.shippingRule.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ methodId: params.methodId }, { methodId: null }] },
        { OR: [{ minAmount: null }, { minAmount: { lte: params.subtotal } }] },
        { OR: [{ governorateId: params.governorateId }, { governorateId: null }] },
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  let bestDiscount = 0
  let bestRule: string | undefined
  for (const rule of matchingRules) {
    let discount = 0
    if (rule.discountType === 'free') {
      discount = baseCost
    } else if (rule.discountType === 'percentage' && rule.discountValue) {
      discount = baseCost * (rule.discountValue / 100)
    } else if (rule.discountType === 'fixed' && rule.discountValue) {
      discount = Math.min(rule.discountValue, baseCost)
    }
    if (discount > bestDiscount) {
      bestDiscount = discount
      bestRule = rule.name
    }
  }

  finalCost = baseCost - bestDiscount

  // Check coupon (SHIPPING type) — overrides auto rules
  if (params.couponCode) {
    const coupon = await db.discount.findUnique({ where: { code: params.couponCode } })
    if (
      coupon && coupon.isActive && coupon.type === 'SHIPPING'
      && (!coupon.governorateId || coupon.governorateId === params.governorateId)
      && (!coupon.expiresAt || coupon.expiresAt >= now)
      && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)
      && (!coupon.minOrder || params.subtotal >= coupon.minOrder)
    ) {
      if (coupon.value === 0) {
        finalCost = 0
      } else {
        finalCost = baseCost - (baseCost * (coupon.value / 100))
      }
    }
  }

  return { baseCost, finalCost: Math.max(0, finalCost), discount: Math.max(0, baseCost - finalCost), ruleName: bestRule }
}
