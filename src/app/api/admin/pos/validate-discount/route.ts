import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { code, subtotal } = await req.json()
  const discount = await prisma.discount.findUnique({ where: { code } })
  if (!discount || !discount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
  if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) return NextResponse.json({ error: 'Usage limit reached' }, { status: 400 })

  const amount = discount.type === 'PERCENTAGE' ? subtotal * (discount.value / 100) : discount.value
  return NextResponse.json({ amount: Math.min(amount, subtotal), type: discount.type, value: discount.value })
}
