import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params, admin }: { params: { id: string } }) => {
  const sdb = storeDb(admin.storeId)
  const invoice = await sdb.invoice.findFirst({ where: { id: params.id }, include: { items: true } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ invoice })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { params, admin }: { params: { id: string } }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const updateData: any = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'paid') updateData.paidAt = new Date()
  if (body.notes !== undefined) updateData.notes = body.notes

  const invoice = await sdb.invoice.update({ where: { id: params.id }, data: updateData, include: { items: true } })
  return NextResponse.json({ invoice })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params, admin }: { params: { id: string } }) => {
  const sdb = storeDb(admin.storeId)
  await sdb.invoice.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'accounting')
