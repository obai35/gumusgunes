import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const body = await req.json()
  const rule = await db.shippingRule.update({
    where: { id },
    data: {
      name: body.name,
      methodId: body.methodId || null,
      minAmount: body.minAmount ? parseFloat(body.minAmount) : null,
      governorateId: body.governorateId || null,
      discountType: body.discountType,
      discountValue: body.discountValue ? parseFloat(body.discountValue) : null,
      isActive: body.isActive,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json({ rule })
}, 'shipping')

export const DELETE = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  await db.shippingRule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'shipping')
