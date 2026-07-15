import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req, { params }) => {
  const discount = await db.discount.findUnique({ where: { id: params.id } })
  if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ discount })
}, 'discounts')

export const PUT = withAdmin(async (req, { params }) => {
  const discount = await db.discount.findUnique({ where: { id: params.id } })
  if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { code, type, value, maxUses, expiresAt, appliesTo, targetValue, minOrder, isActive, governorateId } = await req.json()
  const data: any = {}
  if (code !== undefined) data.code = code.toUpperCase().replace(/\s+/g, '_')
  if (type !== undefined) data.type = type
  if (value !== undefined) data.value = parseFloat(value)
  if (maxUses !== undefined) data.maxUses = maxUses ? parseInt(maxUses) : null
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null
  if (appliesTo !== undefined) data.appliesTo = appliesTo
  if (targetValue !== undefined) data.targetValue = targetValue || null
  if (minOrder !== undefined) data.minOrder = minOrder ? parseFloat(minOrder) : null
  if (isActive !== undefined) data.isActive = isActive
  if (governorateId !== undefined) data.governorateId = governorateId || null
  const updated = await db.discount.update({ where: { id: params.id }, data })
  return NextResponse.json({ discount: updated })
}, 'discounts')

export const DELETE = withAdmin(async (_req, { params }) => {
  await db.discount.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'discounts')
