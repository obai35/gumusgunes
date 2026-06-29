import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const take = 20
  const skip = (page - 1) * take

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { name: true, imageUrl: true, slug: true } } } } },
      take, skip,
    }),
    prisma.order.count({ where: { userId: user.userId } }),
  ])
  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / take) })
}
