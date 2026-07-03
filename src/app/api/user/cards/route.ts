import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { z } from 'zod'

const CardSchema = z.object({
  cardholderName: z.string().min(1).max(100),
  last4: z.string().length(4),
  brand: z.string().min(1).max(50),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2024),
  token: z.string().min(1),
}).strict()

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
  const parsed = CardSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { expiryMonth, expiryYear } = parsed.data
  const card = await db.savedCard.create({
    data: {
      userId: user.userId,
      expiryMonth,
      expiryYear,
    },
  })
  return NextResponse.json(card, { status: 201 })
}
