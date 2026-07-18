import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const count = await db.invoice.count()
  return NextResponse.json({ nextNumber: `INV-${String(count + 1).padStart(5, '0')}` })
}, 'accounting')
