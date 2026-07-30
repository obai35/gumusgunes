import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const PUT = withAdmin(async (req, { params, admin }: { params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { name, nameAr, countryId } = await req.json()
  const governorate = await sdb.governorate.update({ where: { id }, data: { name, nameAr, countryId } })
  return NextResponse.json({ governorate })
}, 'shipping')

export const DELETE = withAdmin(async (req, { params, admin }: { params: Promise<{ id: string }> }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  await sdb.governorate.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'shipping')
