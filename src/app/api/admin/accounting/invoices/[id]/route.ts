import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const invoice = await db.invoice.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ invoice })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const updateData: any = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'paid') updateData.paidAt = new Date()
  if (body.notes !== undefined) updateData.notes = body.notes

  const invoice = await db.invoice.update({ where: { id: params.id }, data: updateData, include: { items: true } })
  return NextResponse.json({ invoice })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await db.invoice.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'accounting')
