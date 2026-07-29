import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const bill = await sdb.bill.findFirst({ where: { id: params.id }, include: { items: true } })
  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ bill })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const updateData: any = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'paid') updateData.paidAt = new Date()
  if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod
  if (body.notes !== undefined) updateData.notes = body.notes

  const bill = await sdb.bill.update({ where: { id: params.id }, data: updateData, include: { items: true } })
  return NextResponse.json({ bill })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.bill.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'accounting')
