import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req, { params, admin }: { params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { name, estimatedDays, isActive } = await req.json()
  const method = await sdb.shippingMethod.update({ where: { id }, data: { name, estimatedDays, isActive } })
  return NextResponse.json({ method })
}, 'shipping')

export const DELETE = withAdmin(async (req, { params, admin }: { params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.shippingMethod.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'shipping')
