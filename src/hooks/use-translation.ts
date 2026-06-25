'use client'

import { useLocale } from '@/lib/store'
import { translations, LOCALES } from '@/lib/i18n/translations'
import type { Locale } from '@/lib/i18n/translations'
import { useHydrated } from './use-hydrated'

function resolvePath(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function useTranslation() {
  const { locale } = useLocale()
  const hydrated = useHydrated()

  function t(path: string, ...args: (string | number)[]): string {
    const currentLocale: Locale = hydrated ? locale : 'en'
    const dict = translations[currentLocale] as unknown as Record<string, unknown>
    let text = resolvePath(dict, path)
    if (!text) {
      const fallback = translations.en as unknown as Record<string, unknown>
      text = resolvePath(fallback, path)
    }
    if (!text) return path
    if (args.length > 0) {
      args.forEach((arg, i) => {
        text = (text as string).replace(`{${i}}`, String(arg))
      })
    }
    return text as string
  }

  function getDir(): 'ltr' | 'rtl' {
    return LOCALES.find((l) => l.code === locale)?.dir ?? 'ltr'
  }

  return { t, locale, dir: getDir() }
}
