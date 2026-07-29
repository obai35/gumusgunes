import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const count = await sdb.invoice.count()
  return NextResponse.json({ nextNumber: `INV-${String(count + 1).padStart(5, '0')}` })
}, 'accounting')
