import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { discountId, value } = await req.json()
  await sdb.discount.update({ where: { id: discountId }, data: { isActive: value } })
  return NextResponse.json({ success: true })
}, 'discounts')
