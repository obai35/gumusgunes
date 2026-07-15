import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const tiers = await db.loyaltyTier.findMany({ orderBy: { minPoints: 'asc' } })
  return NextResponse.json({ tiers })
}, 'customers')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, minPoints, benefits, isActive } = await req.json()
  if (!name || minPoints === undefined) return NextResponse.json({ error: 'Name and minPoints are required' }, { status: 400 })
  const tier = await db.loyaltyTier.create({
    data: { name, minPoints, benefits: benefits || {}, isActive: isActive ?? true },
  })
  return NextResponse.json({ tier })
}, 'customers')
