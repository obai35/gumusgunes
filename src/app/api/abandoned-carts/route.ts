import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 50; const skip = (page - 1) * take
  const where: any = { convertedOrderId: null }
  if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }]
  const [carts, total] = await Promise.all([db.abandonedCart.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), db.abandonedCart.count({ where })])
  return NextResponse.json({ carts, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')
