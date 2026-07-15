import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const config = await db.referralConfig.findFirst()
  return NextResponse.json({ config: config || { rewardType: 'discount', rewardValue: 10, minOrder: 0, maxPerUser: 10, discountDays: 30, isActive: true } })
}, 'marketing')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { rewardType, rewardValue, minOrder, maxPerUser, discountDays, isActive } = await req.json()
    const existing = await db.referralConfig.findFirst()
    let config
    const d = { rewardType, rewardValue: parseFloat(rewardValue), minOrder: parseFloat(minOrder), maxPerUser: parseInt(maxPerUser), discountDays: parseInt(discountDays), isActive }
    if (existing) config = await db.referralConfig.update({ where: { id: existing.id }, data: d })
    else config = await db.referralConfig.create({ data: d })
    return NextResponse.json({ config })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
