import { db } from '@/lib/db'
import type { Locale } from './translations'

let cached: { en: Record<string, any>; ar: Record<string, any> } | null = null
let cacheTime = 0
const CACHE_TTL = 60000

function setNested(obj: Record<string, any>, path: string[], value: string) {
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    if (!current[path[i]] || typeof current[path[i]] !== 'object') {
      current[path[i]] = {}
    }
    current = current[path[i]]
  }
  current[path[path.length - 1]] = value
}

export async function loadDbTranslations(): Promise<{ en: Record<string, any>; ar: Record<string, any> }> {
  if (cached && Date.now() - cacheTime < CACHE_TTL) return cached
  try {
    const rows = await db.translation.findMany({ select: { key: true, en: true, ar: true } })
    const en: Record<string, any> = {}
    const ar: Record<string, any> = {}
    for (const row of rows) {
      const parts = row.key.split('.')
      setNested(en, parts, row.en)
      setNested(ar, parts, row.ar)
    }
    cached = { en, ar }
    cacheTime = Date.now()
    return cached
  } catch {
    return { en: {}, ar: {} }
  }
}

export function invalidateTranslationCache() {
  cached = null
  cacheTime = 0
}

export function getMergedTranslations(dbT: { en: Record<string, any>; ar: Record<string, any> }, locale: Locale, fallback: any) {
  const dbMap = locale === 'ar' ? dbT.ar : dbT.en
  return deepMerge(fallback, dbMap)
}

function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key])
    } else {
      result[key] = source[key]
    }
  }
  return result
}
