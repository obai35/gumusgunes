export type LocaleCode = 'en' | 'ar'

export function getCurrencyMeta(code: string) {
  return null
}

export function formatPrice(value: number, currencyCode: string = 'EGP', symbol: string = 'E£', locale: string = 'ar-EG'): string {
  const converted = value * 1
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted)
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch { return [] }
}

export function parseImages(images: string | null | undefined): string[] {
  if (!images) return []
  try {
    const parsed = JSON.parse(images)
    if (Array.isArray(parsed)) return parsed
    return []
  } catch { return [] }
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
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
    id = 'sess_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16) + Date.now().toString(36)
    window.localStorage.setItem(KEY, id)
  }
  return id
}

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ')
}
