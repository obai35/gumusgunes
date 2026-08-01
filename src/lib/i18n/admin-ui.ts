'use client'

import { useLocale } from '@/lib/store'
import { useHydrated } from '@/hooks/use-hydrated'
import { adminUiAr } from './admin-ui-ar'
import { formatPrice } from '@/lib/format'

const AR_LOCALE = 'ar-EG'
const EN_LOCALE = 'en-US'

const exact = new Map(Object.entries(adminUiAr))

const SEGMENT_SKIP = new Set([
  'No', 'Yes', 'New', 'E£', 'EG', 'PO', 'SKU', 'RMA', 'COGS', 'VAT', 'BOM',
  '2FA', 'P&L', 'KPI', 'LTV', 'Mfg', 'OH', 'AR', 'AP', 'IC', 'QC', 'FIFO',
  'R²', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
  'Oct', 'Nov', 'Dec', 'Don',
])

const segments = Object.keys(adminUiAr)
  .filter((k) => k.length >= 3 && !SEGMENT_SKIP.has(k))
  .sort((a, b) => b.length - a.length)

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function keyRegex(key: string): RegExp {
  const left = /^[A-Za-z0-9]/.test(key) ? '(?<![A-Za-z0-9])' : ''
  const right = /[A-Za-z0-9]$/.test(key) ? '(?![A-Za-z0-9])' : ''
  return new RegExp(left + escapeRegExp(key) + right, 'g')
}

function translateStatic(text: string): string {
  let out = text
  let guard = 0
  while (guard++ < 60) {
    let replaced = false
    for (const key of segments) {
      const ar = adminUiAr[key]
      if (!ar) continue
      const re = keyRegex(key)
      if (re.test(out)) {
        out = out.replace(re, ar)
        replaced = true
      }
    }
    if (!replaced) break
  }
  return out
}

export function useAdminTranslate() {
  const { locale } = useLocale()
  const hydrated = useHydrated()
  const isAr = (hydrated ? locale : 'en') === 'ar'

  function ta(text: string): string {
    if (!text || !isAr) return text
    if (exact.has(text)) return exact.get(text)!
    if (!/[\p{L}]/u.test(text)) return text
    const parts = text.split(/(\$\{[^}]*\})/g)
    return parts.map((p) => (p.startsWith('${') ? p : translateStatic(p))).join('')
  }

  function fmtNum(value: number | null | undefined, fractionDigits = 0): string {
    if (value == null || Number.isNaN(value)) return '—'
    return new Intl.NumberFormat(isAr ? AR_LOCALE : EN_LOCALE, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value)
  }

  function fmtDate(date: string | Date | null | undefined): string {
    if (!date) return '—'
    return new Intl.DateTimeFormat(isAr ? AR_LOCALE : EN_LOCALE, {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(date))
  }

  function fmtDateTime(date: string | Date | null | undefined): string {
    if (!date) return '—'
    return new Intl.DateTimeFormat(isAr ? AR_LOCALE : EN_LOCALE, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(date))
  }

  function fmtCurrency(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '—'
    return formatPrice(value, undefined, 'E£', isAr ? AR_LOCALE : EN_LOCALE)
  }

  return { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency, isAr }
}
