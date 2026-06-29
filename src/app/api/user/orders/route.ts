import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const orders = await prisma.order.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: { select: { name: true, imageUrl: true, slug: true } } } } },
  })
  return NextResponse.json(orders)
}
