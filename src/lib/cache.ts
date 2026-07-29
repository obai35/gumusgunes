type CacheEntry = {
  data: any
  expiresAt: number
}

const store = new Map<string, CacheEntry>()

export function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const existing = store.get(key)
  if (existing && existing.expiresAt > Date.now()) {
    return Promise.resolve(existing.data as T)
  }
  return fetcher().then((data) => {
    store.set(key, { data, expiresAt: Date.now() + ttlMs })
    return data
  })
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) { store.clear(); return }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) store.delete(key)
  }
}
