import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cards = await db.savedCard.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(cards)
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const card = await db.savedCard.create({
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
