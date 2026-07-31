import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const config = await sdb.referralConfig.findFirst()
  return NextResponse.json({ config: config || { rewardType: 'discount', rewardValue: 10, minOrder: 0, maxPerUser: 10, discountDays: 30, isActive: true } })
}, 'marketing')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { rewardType, rewardValue, minOrder, maxPerUser, discountDays, isActive } = await req.json()
    const existing = await sdb.referralConfig.findFirst()
    let config
    const d = { rewardType, rewardValue: parseFloat(rewardValue), minOrder: parseFloat(minOrder), maxPerUser: parseInt(maxPerUser), discountDays: parseInt(discountDays), isActive }
    if (existing) config = await sdb.referralConfig.update({ where: { id: existing.id }, data: d })
    else config = await sdb.referralConfig.create({ data: d as any })
    return NextResponse.json({ config })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
