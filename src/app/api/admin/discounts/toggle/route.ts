import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { discountId, value } = await req.json()
  await prisma.discount.update({ where: { id: discountId }, data: { isActive: value } })
  return NextResponse.json({ success: true })
}
