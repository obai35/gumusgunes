import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const suppliers = await sdb.supplier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, suppliers: suppliers.map(s => ({ id: s.id, name: s.name })) })
}, 'inventory')
