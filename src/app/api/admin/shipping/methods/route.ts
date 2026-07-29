import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const methods = await sdb.shippingMethod.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ methods })
}, 'shipping')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, estimatedDays } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const method = await sdb.shippingMethod.create({ data: { name, estimatedDays: estimatedDays || '' } })
  return NextResponse.json({ method })
}, 'shipping')
