const DB_NAME = 'pos-offline'
const DB_VERSION = 1

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

export async function queueOrder(order: any) {
  const db = await openDB()
  const tx = db.transaction('orders', 'readwrite')
  tx.objectStore('orders').add({ ...order, synced: false, createdAt: new Date().toISOString() })
  await new Promise(r => tx.oncomplete = r)
  db.close()
}

export async function getUnsyncedOrders(): Promise<any[]> {
  const db = await openDB()
  return new Promise((resolve) => {
    const data: any[] = []
    const tx = db.transaction('orders', 'readonly')
    const index = tx.objectStore('orders').index('synced')
    index.openCursor(IDBKeyRange.only(false)).onsuccess = (e: any) => {
      const cursor = e.target.result
      if (cursor) { data.push(cursor.value); cursor.continue() }
      else resolve(data)
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
