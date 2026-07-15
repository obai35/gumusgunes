import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 50; const skip = (page - 1) * take
  const where: any = {}
  if (search) where.OR = [{ referredEmail: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
  const [referrals, total] = await Promise.all([db.referral.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), db.referral.count({ where })])
  return NextResponse.json({ referrals, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')
