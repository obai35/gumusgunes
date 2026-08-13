import { NextRequest, NextResponse } from 'next/server'
import { withDualRateLimit } from '@/lib/rate-limit'
import { verifyPassword, signToken, signTotpTempToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { lockedFor, recordFailedAttempt, resetFailedAttempts } from '@/lib/lockout'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const parsed = LoginSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { email, password } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.', code: 'google_only_account' }, { status: 401 })
    }

    const lockedSeconds = lockedFor(user)
    if (lockedSeconds !== null) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(lockedSeconds) } }
      )
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      await recordFailedAttempt(user, (data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (user.totpEnabled) {
      const tempToken = signTotpTempToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
      return NextResponse.json({ requiresTotp: true, tempToken })
    }

    await resetFailedAttempts((data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})

    const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, gender: user.gender }
    })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('Customer login error:', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export const POST = withDualRateLimit(handler, {
  limit: 10,
  window: '60s',
  emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
  failClosed: true,
})
