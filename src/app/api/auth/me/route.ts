import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { verifyToken, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

const handler = async (req: NextRequest) => {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload = verifyToken(auth.slice(7))
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, phone: true, tokenVersion: true, createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.tokenVersion !== payload.tokenVersion) {
    return NextResponse.json({ error: 'Session expired. Please sign in again.' }, { status: 401 })
  }

  return NextResponse.json({ user })
}

export const GET = withRateLimit(handler, { limit: 30, window: '60s' })
