import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 50; const skip = (page - 1) * take
  const where: any = {}
  if (search) where.OR = [{ referredEmail: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
  const [referrals, total] = await Promise.all([sdb.referral.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), sdb.referral.count({ where })])
  return NextResponse.json({ referrals, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')
