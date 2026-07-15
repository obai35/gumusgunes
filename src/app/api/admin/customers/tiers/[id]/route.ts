import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const tier = await db.loyaltyTier.findUnique({ where: { id: params.id } })
  if (!tier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ tier })
}, 'customers')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const { name, minPoints, benefits, isActive } = await req.json()
  const tier = await db.loyaltyTier.update({
    where: { id: params.id },
    data: { ...(name !== undefined && { name }), ...(minPoints !== undefined && { minPoints }), ...(benefits !== undefined && { benefits }), ...(isActive !== undefined && { isActive }) },
  })
  return NextResponse.json({ tier })
}, 'customers')

export const DELETE = withAdmin(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  await db.user.updateMany({ where: { loyaltyTierId: params.id }, data: { loyaltyTierId: null } })
  await db.loyaltyTier.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'customers')
