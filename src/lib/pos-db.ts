const DB_NAME = 'pos-offline'
const DB_VERSION = 2

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('orders')) {
        const store = db.createObjectStore('orders', { keyPath: 'id', autoIncrement: true })
        store.createIndex('synced', 'synced', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// --- Products cache (IndexedDB) ---

export async function cacheProducts(products: any[]) {
  const db = await openDB()
  const tx = db.transaction('products', 'readwrite')
  for (const p of products) tx.objectStore('products').put(p)
  await new Promise(r => tx.oncomplete = r)
  db.close()
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const data: any[] = []
    const tx = db.transaction('products', 'readonly')
    tx.objectStore('products').openCursor().onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) { data.push(cursor.value); cursor.continue() }
      else resolve(data)
    }
    tx.oncomplete = () => { db.close() }
  })
}

// --- Offline order queue (localStorage for reliability, no versioning issues) ---

const PENDING_KEY = 'pos_pending'
const COUNTER_KEY = 'pos_offline_counter'

function getNextSeq(): number {
  const val = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10)
  localStorage.setItem(COUNTER_KEY, String(val + 1))
  return val + 1
}

export function getUnsyncedLegacyOrders(): any[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    return all.filter((o: any) => !o.tempReceiptNumber)
  } catch { return [] }
}

export function getUnsyncedOrdersWithTempNumbers(): any[] {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return []
    const all = JSON.parse(raw)
    return all.filter((o: any) => o.tempReceiptNumber && !o.synced)
  } catch { return [] }
}

export function getAllPendingOrders(): any[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || '[]')
  } catch { return [] }
}

export function addPendingOrder(order: any) {
  try {
    const all = getAllPendingOrders()
    all.push(order)
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  } catch {}
}

export function updatePendingOrder(index: number, updates: any) {
  try {
    const all = getAllPendingOrders()
    if (all[index]) {
      all[index] = { ...all[index], ...updates }
      localStorage.setItem(PENDING_KEY, JSON.stringify(all))
    }
  } catch {}
}

export function removePendingOrder(index: number) {
  try {
    const all = getAllPendingOrders()
    all.splice(index, 1)
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  } catch {}
}

// --- Combined offline order storage ---

export async function queueOrder(order: any) {
  addPendingOrder({ ...order, synced: false, createdAt: new Date().toISOString() })
}

export async function storeOfflineOrder(order: Omit<any, 'tempReceiptNumber' | 'synced' | 'createdAt'>): Promise<{ tempReceiptNumber: string }> {
  const seq = getNextSeq()
  const tempReceiptNumber = `OFF-${String(seq).padStart(4, '0')}`
  addPendingOrder({
    ...order,
    tempReceiptNumber,
    synced: false,
    createdAt: new Date().toISOString(),
  })
  return { tempReceiptNumber }
}

export async function getUnsyncedOrders(): Promise<any[]> {
  return getUnsyncedLegacyOrders()
}

export async function markOrderSynced(id: number) {
  const all = getAllPendingOrders()
  const idx = all.findIndex((o: any) => o.id === id)
  if (idx !== -1) {
    all[idx].synced = true
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  }
}

export async function markOrderSyncedWithRealInfo(tempReceiptNumber: string, realReceiptNumber: string, realOrderId: string) {
  const all = getAllPendingOrders()
  const idx = all.findIndex((o: any) => o.tempReceiptNumber === tempReceiptNumber)
  if (idx !== -1) {
    all[idx].synced = true
    all[idx].realReceiptNumber = realReceiptNumber
    all[idx].realOrderId = realOrderId
    all[idx].syncedAt = new Date().toISOString()
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  }
}

export async function markOrderSyncFailed(tempReceiptNumber: string) {
  const all = getAllPendingOrders()
  const idx = all.findIndex((o: any) => o.tempReceiptNumber === tempReceiptNumber)
  if (idx !== -1) {
    all[idx].syncedFailed = true
    localStorage.setItem(PENDING_KEY, JSON.stringify(all))
  }
}
