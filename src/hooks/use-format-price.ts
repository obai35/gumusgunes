'use client'

import { useCurrency } from '@/lib/store'
import { formatPrice as formatPriceBase } from '@/lib/format'

/**
 * Returns a formatPrice function bound to the user's selected currency.
 * SSR-safe: returns EGP formatting during server render, updates after hydration.
 */
export function useFormatPrice() {
  const { currency } = useCurrency()
  return (value: number) => formatPriceBase(value, currency)
}
