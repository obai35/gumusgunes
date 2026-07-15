import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 20; const skip = (page - 1) * take
  const where: any = {}
  if (search) where.name = { contains: search, mode: 'insensitive' }
  const [sales, total] = await Promise.all([db.saleCampaign.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), db.saleCampaign.count({ where })])
  return NextResponse.json({ sales, total, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { name, appliesTo, discountType, discountValue, minOrder, startDate, endDate, targetValue } = body
    const slug = body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const sale = await db.saleCampaign.create({
      data: {
        name, slug, appliesTo: appliesTo || 'all', discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        targetValue: targetValue || null,
        startDate: new Date(startDate), endDate: new Date(endDate),
      },
    })
    return NextResponse.json({ sale })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
