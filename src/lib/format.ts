export function formatPrice(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
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
