import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { decrypt } from '@/lib/encryption'

export async function GET(req: NextRequest) {
  const { db: sdb } = await storefrontDb(req)
  const methods = await sdb.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  const result = methods.map(m => {
    let config = {}
    try { config = JSON.parse(decrypt(m.config)) } catch { try { config = JSON.parse(m.config) } catch {} }
    return { ...m, config }
  })
  return NextResponse.json({ methods: result }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } })
}
