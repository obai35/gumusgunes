import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req: Request) => {
  const { discountId, value } = await req.json()
  await db.discount.update({ where: { id: discountId }, data: { isActive: value } })
  return NextResponse.json({ success: true })
}, 'discounts')
