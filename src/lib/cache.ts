interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const store = new Map<string, CacheEntry<any>>()

export function getCached<T>(key: string): T | null {
  const entry = store.get(key)
  if (!entry || Date.now() > entry.expiresAt) {
    store.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache<T>(key: string, data: T, ttlMs = 60000): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function clearCache(pattern?: string): void {
  if (!pattern) { store.clear(); return }
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key)
  }
}

setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.expiresAt) store.delete(key)
  }
}, 300000)
