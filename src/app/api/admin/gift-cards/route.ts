import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 20; const skip = (page - 1) * take
  const where: any = {}
  if (search) where.OR = [{ code: { contains: search, mode: 'insensitive' } }, { recipientEmail: { contains: search, mode: 'insensitive' } }]
  const [giftCards, total] = await Promise.all([db.giftCard.findMany({ where, orderBy: { issuedAt: 'desc' }, take, skip }), db.giftCard.count({ where })])
  return NextResponse.json({ giftCards, total, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { code, recipientEmail, initialBalance, expiresAt } = body
    const giftCard = await db.giftCard.create({
      data: {
        code: code || `GIFT-${Date.now().toString(36).toUpperCase()}`,
        recipientEmail: recipientEmail || null,
        initialBalance: parseFloat(initialBalance),
        balance: parseFloat(initialBalance),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })
    return NextResponse.json({ giftCard })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
