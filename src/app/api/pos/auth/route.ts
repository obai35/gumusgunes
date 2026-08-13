import { NextRequest, NextResponse } from 'next/server'
import { signPosToken } from '@/lib/pos-auth'
import { withDualRateLimit } from '@/lib/rate-limit'
import { verifyPassword } from '@/lib/password'
import { db } from '@/lib/db'
import { lockedFor, recordFailedAttempt, resetFailedAttempts } from '@/lib/lockout'

const handler = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const branch = await db.branch.findUnique({ where: { email } })
    if (!branch || !branch.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const lockedSeconds = lockedFor(branch)
    if (lockedSeconds !== null) {
      return NextResponse.json(
        { error: 'Account temporarily locked. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(lockedSeconds) } }
      )
    }

    const valid = await verifyPassword(password, branch.password)
    if (!valid) {
      await recordFailedAttempt(branch, (data) => db.branch.update({ where: { id: branch.id }, data })).catch(() => {})
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    await resetFailedAttempts((data) => db.branch.update({ where: { id: branch.id }, data })).catch(() => {})

    const user = { id: branch.id, name: branch.name, email: branch.email, branchId: branch.id }
    const token = signPosToken({ ...user, tokenVersion: branch.tokenVersion })

    const response = NextResponse.json({ ok: true, user })
    response.cookies.set('__session_pos', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    })
    return response
  } catch (err) {
    console.error('POST /api/pos/auth error:', err)
    return NextResponse.json({ ok: false, error: 'Login failed' }, { status: 500 })
  }
}

export const POST = withDualRateLimit(handler, {
  limit: 5,
  window: '30s',
  emailOf: async (req) => (await req.clone().json().catch(() => null))?.email,
  failClosed: true,
})