import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const rules = await sdb.shippingRule.findMany({
    include: { method: { select: { name: true } }, governorate: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ rules })
}, 'shipping')

export const POST = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const rule = await sdb.shippingRule.create({
    data: {
      name: body.name,
      methodId: body.methodId || null,
      minAmount: body.minAmount ? parseFloat(body.minAmount) : null,
      governorateId: body.governorateId || null,
      discountType: body.discountType,
      discountValue: body.discountValue ? parseFloat(body.discountValue) : null,
      isActive: body.isActive !== false,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    } as any,
  })
  return NextResponse.json({ rule })
}, 'shipping')
