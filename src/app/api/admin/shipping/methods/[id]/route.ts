import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { name, estimatedDays, isActive } = await req.json()
  const method = await db.shippingMethod.update({ where: { id }, data: { name, estimatedDays, isActive } })
  return NextResponse.json({ method })
}, 'shipping')

export const DELETE = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  await db.shippingMethod.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'shipping')
