import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  try {
    const suppliers = await db.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ suppliers })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
