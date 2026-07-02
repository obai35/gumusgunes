import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAdmin } from '@/lib/admin-permissions'

const prisma = new PrismaClient()

export const POST = withAdmin(async (req: Request) => {
  const { discountId, value } = await req.json()
  await prisma.discount.update({ where: { id: discountId }, data: { isActive: value } })
  return NextResponse.json({ success: true })
}, 'discounts')
