'use client'

import { useCurrencyStore } from '@/lib/currency-store'
import { formatConvertedPrice } from '@/lib/currency-store'

export function useFormatPrice() {
  const { selected } = useCurrencyStore()
  return (value: number) => formatConvertedPrice(value, selected)
}
