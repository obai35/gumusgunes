import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const discounts = await db.discount.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ discounts })
}, 'discounts')
