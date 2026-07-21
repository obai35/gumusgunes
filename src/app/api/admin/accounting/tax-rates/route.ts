import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const rates = await db.taxRate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ rates })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, rate, country, region, isActive } = await req.json()
  const taxRate = await db.taxRate.create({
    data: {
      name,
      rate,
      country: country || 'EG',
      region: region || null,
      isActive: isActive !== undefined ? isActive : true,
    },
  })
  return NextResponse.json({ ok: true, taxRate })
}, 'accounting')
