import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const methods = await sdb.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } })
  const result = methods.map(m => {
    let config = {}
    try { config = JSON.parse(decrypt(m.config)) } catch { try { config = JSON.parse(m.config) } catch {} }
    return { ...m, config }
  })
  return NextResponse.json({ methods: result })
}, 'payments')
