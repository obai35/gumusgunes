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
      if (!db.objectStoreNames.contains('counter')) {
        db.createObjectStore('counter', { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function promisifyRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export type OfflineOrder = {
  id?: number
  tempReceiptNumber: string
  realReceiptNumber: string | null
  realOrderId: string | null
  items: { productId: string; quantity: number; discount?: number }[]
  subtotal: number
  discountAmount: number
  total: number
  paymentMethod: string
  cashAmount: number | null
  cardAmount: number | null
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  discountCode: string | null
  shiftId: string | null
  notes: string | null
  synced: boolean
  syncedFailed: boolean
  createdAt: string
  syncedAt: string | null
}

// --- Products cache ---

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

// --- Counter for temp receipt numbers ---

async function getNextSeq(): Promise<number> {
  const db = await openDB()
  const tx = db.transaction('counter', 'readwrite')
  const store = tx.objectStore('counter')
  const existing = await promisifyRequest(store.get('offline_seq'))
  const next = (existing?.value ?? 0) + 1
  await promisifyRequest(store.put({ key: 'offline_seq', value: next }))
  db.close()
  return next
}

// --- Legacy simple queue (used for auto-offline detection when not in offline mode) ---

export async function queueOrder(order: any) {
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  tx.objectStore('orders').add({ ...order, synced: false, createdAt: new Date().toISOString() })
  await new Promise(r => tx.oncomplete = r)
  db.close()
}

// --- All-in-one: rich offline orders (used by explicit offline mode) + legacy cleanup ---

export async function storeOfflineOrder(order: Omit<OfflineOrder, 'id' | 'tempReceiptNumber' | 'synced' | 'syncedFailed' | 'createdAt' | 'syncedAt' | 'realReceiptNumber' | 'realOrderId'>): Promise<{ tempReceiptNumber: string }> {
  const seq = await getNextSeq()
  const tempReceiptNumber = `OFF-${String(seq).padStart(4, '0')}`
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  const entry: OfflineOrder = {
    tempReceiptNumber,
    realReceiptNumber: null,
    realOrderId: null,
    ...order,
    synced: false,
    syncedFailed: false,
    createdAt: new Date().toISOString(),
    syncedAt: null,
  }
  await promisifyRequest(tx.objectStore('orders').add(entry))
  db.close()
  return { tempReceiptNumber }
}

export async function getUnsyncedOrdersWithTempNumbers(): Promise<OfflineOrder[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const data: OfflineOrder[] = []
    const tx = db.transaction('orders', 'readonly')
    const index = tx.objectStore('orders').index('synced')
    index.openCursor(IDBKeyRange.only(false)).onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) {
        const val = cursor.value
        if (val.tempReceiptNumber) data.push(val)
        cursor.continue()
      } else resolve(data)
    }
    tx.oncomplete = () => { db.close() }
  })
}

export async function markOrderSyncedWithRealInfo(id: number, realReceiptNumber: string, realOrderId: string) {
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  const existing = await promisifyRequest(tx.objectStore('orders').get(id)) as any
  if (existing) {
    existing.synced = true
    existing.syncedFailed = false
    existing.realReceiptNumber = realReceiptNumber
    existing.realOrderId = realOrderId
    existing.syncedAt = new Date().toISOString()
    await promisifyRequest(tx.objectStore('orders').put(existing))
  }
  db.close()
}

export async function markOrderSyncFailed(id: number) {
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  const existing = await promisifyRequest(tx.objectStore('orders').get(id)) as any
  if (existing) {
    existing.syncedFailed = true
    await promisifyRequest(tx.objectStore('orders').put(existing))
  }
  db.close()
}

// --- Legacy helpers (keep for existing auto-offline detection) ---

export async function getUnsyncedOrders(): Promise<any[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const data: any[] = []
    const tx = db.transaction('orders', 'readonly')
    const index = tx.objectStore('orders').index('synced')
    index.openCursor(IDBKeyRange.only(false)).onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) {
        const val = cursor.value
        if (!val.tempReceiptNumber) data.push(val)
        cursor.continue()
      } else resolve(data)
    }
    tx.oncomplete = () => { db.close() }
  })
}

export async function markOrderSynced(id: number) {
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  const existing = await new Promise<any>((resolve) => {
    const req = tx.objectStore('orders').get(id)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => resolve(null)
  })
  if (existing) {
    tx.objectStore('orders').put({ ...existing, synced: true })
  }
  await new Promise(r => tx.oncomplete = r)
  db.close()
}
