import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { productId, field, value } = await req.json()
  const allowed = ['isActive', 'isFeatured', 'isNew', 'isBestseller']
  if (!allowed.includes(field)) return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  await sdb.product.update({ where: { id: productId }, data: { [field]: value } })
  return NextResponse.json({ success: true })
}, 'products')
