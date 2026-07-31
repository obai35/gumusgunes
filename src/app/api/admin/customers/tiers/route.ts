import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const tiers = await sdb.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } })
  return NextResponse.json({ tiers })
}, 'customers')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, minPoints, benefits, isActive } = await req.json()
  if (!name || minPoints === undefined) return NextResponse.json({ error: 'Name and minPoints are required' }, { status: 400 })
  const tier = await sdb.loyaltyTier.create({
    data: { name, minPoints, benefits: benefits || {}, isActive: isActive ?? true } as any,
  })
  return NextResponse.json({ tier })
}, 'customers')
