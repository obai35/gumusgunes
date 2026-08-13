import { NextRequest, NextResponse } from 'next/server'
import { withDualRateLimit } from '@/lib/rate-limit'
import { verifyPassword, signToken, hashPassword } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { logAudit } from '@/lib/audit'
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

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfter = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      )
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1
      const lockData: Record<string, unknown> = { failedLoginAttempts: attempts }
      if (attempts >= 10) {
        lockData.lockedUntil = new Date(Date.now() + 15 * 60 * 1000)
      }
      await db.user.update({ where: { id: user.id }, data: lockData }).catch(() => {})
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } }).catch(() => {})

    const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
    response.cookies.set('__session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/api', maxAge: 604800,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}

export const POST = withDualRateLimit(handler, {
  limit: 10,
  window: '60s',
  emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
  failClosed: true,
})
