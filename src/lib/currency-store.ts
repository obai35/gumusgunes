'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type CurrencyInfo = {
  code: string
  name: string
  symbol: string
  exchangeRate: number
  isDefault: boolean
}

type CurrencyStore = {
  currencies: CurrencyInfo[]
  selected: CurrencyInfo
  loading: boolean
  setSelected: (code: string) => void
  loadCurrencies: () => Promise<void>
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currencies: [],
      selected: { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', exchangeRate: 1, isDefault: true },
      loading: true,
      setSelected: (code: string) => {
        const found = get().currencies.find(c => c.code === code) || get().currencies[0] || get().selected
        set({ selected: found })
      },
      loadCurrencies: async () => {
        try {
          const res = await fetch('/api/currencies')
          const data = await res.json()
          if (data.ok && Array.isArray(data.currencies)) {
            const active = data.currencies.filter((c: any) => c.isActive)
            const defaults = active.filter((c: any) => c.isDefault)
            set({ currencies: active, selected: defaults[0] || active[0] || get().selected, loading: false })
          }
        } catch { set({ loading: false }) }
      },
    }),
    { name: 'gg_currency_new', partialize: (state) => ({ selected: state.selected }) }
  )
)

export function formatConvertedPrice(priceInEgp: number, currency: { exchangeRate: number; symbol: string; code: string }): string {
  const converted = priceInEgp * currency.exchangeRate
  const localeMap: Record<string, string> = { EGP: 'ar-EG', USD: 'en-US', EUR: 'de-DE', TRY: 'tr-TR' }
  const locale = localeMap[currency.code] || 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: currency.code === 'TRY' ? 0 : 2,
    maximumFractionDigits: currency.code === 'TRY' ? 0 : 2,
  }).format(converted)
}
