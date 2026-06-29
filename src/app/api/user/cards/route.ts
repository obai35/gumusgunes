import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getUserFromRequest } from '@/lib/auth-api'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cards = await prisma.savedCard.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(cards)
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const card = await prisma.savedCard.create({
    data: {
      userId: user.userId,
      nickname: body.nickname || null,
      lastFour: body.lastFour,
      expiryMonth: body.expiryMonth,
      expiryYear: body.expiryYear,
    },
  })
  return NextResponse.json(card, { status: 201 })
}
