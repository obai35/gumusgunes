export type Currency = 'USD' | 'EUR' | 'TRY'

export const CURRENCIES: { code: Currency; symbol: string; rate: number; locale: string; label: string }[] = [
  { code: 'USD', symbol: '$', rate: 1, locale: 'en-US', label: 'USD $' },
  { code: 'EUR', symbol: '€', rate: 0.92, locale: 'de-DE', label: 'EUR €' },
  { code: 'TRY', symbol: '₺', rate: 34.5, locale: 'tr-TR', label: 'TRY ₺' },
]

export function getCurrencyMeta(code: Currency) {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0]
}

export function formatPrice(value: number, currency: Currency = 'USD'): string {
  const meta = getCurrencyMeta(currency)
  const converted = value * meta.rate
  return new Intl.NumberFormat(meta.locale, {
    style: 'currency',
    currency: meta.code,
    minimumFractionDigits: meta.code === 'TRY' ? 0 : 2,
    maximumFractionDigits: meta.code === 'TRY' ? 0 : 2,
  }).format(converted)
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

export function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch {
    return []
  }
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  const KEY = 'gg_session_id'
  let id = window.localStorage.getItem(KEY)
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    window.localStorage.setItem(KEY, id)
  }
  return id
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
