'use client'

import { useEffect } from 'react'
import { useCurrencyStore } from '@/lib/currency-store'

export function CurrencyInit() {
  const loadCurrencies = useCurrencyStore((s) => s.loadCurrencies)
  useEffect(() => { loadCurrencies() }, [loadCurrencies])
  return null
}
