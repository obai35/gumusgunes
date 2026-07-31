import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const countries = await sdb.country.findMany({
    orderBy: { name: 'asc' },
    include: { governorates: { orderBy: { name: 'asc' } } },
  })
  return NextResponse.json({ countries })
}, 'shipping')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, nameAr, isoCode } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const country = await sdb.country.create({ data: { name, nameAr: nameAr || name, isoCode: isoCode || '' } as any })
  return NextResponse.json({ country })
}, 'shipping')
