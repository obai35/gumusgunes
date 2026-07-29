import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const suppliers = await sdb.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
