import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { name, nameAr, isoCode, isActive } = await req.json()
  const country = await sdb.country.update({ where: { id }, data: { name, nameAr, isoCode, isActive } })
  return NextResponse.json({ country })
}, 'shipping')

export const DELETE = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.country.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'shipping')
