import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const rules = await db.shippingRule.findMany({
    include: { method: { select: { name: true } }, governorate: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ rules })
}

export async function POST(req: Request) {
  const body = await req.json()
  const rule = await db.shippingRule.create({
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
    },
  })
  return NextResponse.json({ rule })
}
