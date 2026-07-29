import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }: { params: { id: string }, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const tier = await sdb.loyaltyTier.findFirst({ where: { id: params.id } })
  if (!tier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tier })
}, 'customers')

export const PUT = withAdmin(async (req: NextRequest, { params, admin }: { params: { id: string }, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { name, minPoints, benefits, isActive } = await req.json()
  const tier = await sdb.loyaltyTier.update({
    where: { id: params.id },
    data: { ...(name !== undefined && { name }), ...(minPoints !== undefined && { minPoints }), ...(benefits !== undefined && { benefits }), ...(isActive !== undefined && { isActive }) },
  })
  return NextResponse.json({ tier })
}, 'customers')

export const DELETE = withAdmin(async (_req: NextRequest, { params, admin }: { params: { id: string }, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.user.updateMany({ where: { loyaltyTierId: params.id }, data: { loyaltyTierId: null } })
  await sdb.loyaltyTier.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'customers')
