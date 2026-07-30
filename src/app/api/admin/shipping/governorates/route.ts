import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { name, nameAr, countryId } = await req.json()
  if (!name || !countryId) return NextResponse.json({ error: 'Name and countryId are required' }, { status: 400 })
  const governorate = await sdb.governorate.create({ data: { name, nameAr: nameAr || name, countryId } })
  return NextResponse.json({ governorate })
}, 'shipping')
