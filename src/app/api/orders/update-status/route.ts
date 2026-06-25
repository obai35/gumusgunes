import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { orderId, field, value } = await req.json()
  if (!['status', 'paymentStatus'].includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  await prisma.order.update({ where: { id: orderId }, data: { [field]: value } })
  return NextResponse.json({ success: true })
}
