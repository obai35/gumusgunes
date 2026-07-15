import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const suppliers = await db.supplier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, suppliers: suppliers.map(s => ({ id: s.id, name: s.name })) })
}, 'inventory')
