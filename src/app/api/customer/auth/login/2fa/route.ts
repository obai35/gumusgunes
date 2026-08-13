import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { verifyTotpCode } from '@/lib/totp'
import { signToken, verifyTotpTempToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { lockedFor, recordFailedAttempt, resetFailedAttempts } from '@/lib/lockout'
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

    const payload = verifyTotpTempToken(tempToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired temp token' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.totpSecret || !user.totpEnabled) {
      return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
    }
    if (payload.tokenVersion !== user.tokenVersion) {
      return NextResponse.json({ error: 'Session revoked. Please sign in again.' }, { status: 401 })
    }

    const lockedSeconds = lockedFor(user)
    if (lockedSeconds !== null) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(lockedSeconds) } }
      )
    }

    if (!verifyTotpCode(code, user.totpSecret)) {
      await recordFailedAttempt(user, (data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    await resetFailedAttempts((data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})

    const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
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

export const POST = withRateLimit(handler, { limit: 5, window: '60s', failClosed: true })