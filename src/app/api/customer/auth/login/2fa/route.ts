import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { withRateLimit } from '@/lib/rate-limit'
import { verifyTotpCode } from '@/lib/totp'
import { signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const parsed = Schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { tempToken, code } = parsed.data
    const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
    if (!JWT_SECRET) throw new Error('JWT_SECRET not configured')

    let payload: { userId: string; email: string }
    try {
      payload = jwt.verify(tempToken, JWT_SECRET) as { userId: string; email: string }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired temp token' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.totpSecret || !user.totpEnabled) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }

    if (!verifyTotpCode(code, user.totpSecret)) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('2FA login error:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 5, window: '60s' })
