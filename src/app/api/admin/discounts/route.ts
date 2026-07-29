import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async ({ admin }) => {
  const sdb = storeDb(admin.storeId)
  const discounts = await sdb.discount.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ discounts })
}, 'discounts')
