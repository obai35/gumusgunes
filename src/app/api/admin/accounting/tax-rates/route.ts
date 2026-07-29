import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const rates = await sdb.taxRate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ rates })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, rate, country, region, isActive } = await req.json()
  const taxRate = await sdb.taxRate.create({
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
