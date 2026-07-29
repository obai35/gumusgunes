import { NextRequest } from 'next/server'
import { db } from './db'
import { storeDb } from './store-scoped'

let cachedDefaultStoreId: string | null = null

export async function getStoreIdFromRequest(req: NextRequest): Promise<string> {
  const fromHeader = req.headers.get('x-store-id')
  if (fromHeader) return fromHeader

  const fromCookie = req.cookies.get('store_id')?.value
  if (fromCookie) return fromCookie

  const host = req.headers.get('host') || ''
  const store = await db.store.findFirst({
    where: {
      OR: [{ primaryDomain: host }, { customDomains: { contains: host } }],
      isActive: true,
    },
    select: { id: true },
  })
  if (store) return store.id

  if (cachedDefaultStoreId) return cachedDefaultStoreId

  const first = await db.store.findFirst({ where: { isActive: true }, select: { id: true }, orderBy: { createdAt: 'asc' } })
  if (first) {
    cachedDefaultStoreId = first.id
    return first.id
  }

  throw new Error('No active store found')
}

export async function storefrontDb(req: NextRequest) {
  const storeId = await getStoreIdFromRequest(req)
  return { storeId, db: storeDb(storeId) }
}
