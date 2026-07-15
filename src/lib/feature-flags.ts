import { db } from '@/lib/db'

const flagCache = new Map<string, { enabled: boolean; expiresAt: number }>()
const CACHE_TTL = 10_000

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = flagCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.enabled
  const flag = await db.featureFlag.findUnique({ where: { key } })
  const enabled = flag?.enabled ?? false
  flagCache.set(key, { enabled, expiresAt: Date.now() + CACHE_TTL })
  return enabled
}

export function clearFeatureFlagCache(key?: string) {
  if (key) flagCache.delete(key)
  else flagCache.clear()
}
