import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-api'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { z } from 'zod'

const CardSchema = z.object({
  nickname: z.string().max(100).optional().nullable().default(null),
  lastFour: z.string().length(4),
  expiryMonth: z.number().int().min(1).max(12),
  expiryYear: z.number().int().min(2024),
}).strict()

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { db: sdb, storeId } = await storefrontDb(req)
  const cards = await sdb.savedCard.findMany({
    where: { userId: user.userId, storeId },
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
  const { nickname, lastFour, expiryMonth, expiryYear } = parsed.data
  const { db: sdb, storeId } = await storefrontDb(req)
  const card = await sdb.savedCard.create({
    data: { userId: user.userId, storeId, nickname, lastFour, expiryMonth, expiryYear },
  })
  return NextResponse.json(card, { status: 201 })
}
