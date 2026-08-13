import { NextRequest, NextResponse } from 'next/server'
import { withDualRateLimit } from '@/lib/rate-limit'
import { verifyPassword, signToken, TEMP_TOKEN_COOKIE, signTotpTempToken, verifyTotpTempToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { lockedFor, recordFailedAttempt, resetFailedAttempts } from '@/lib/lockout'
import { z } from 'zod'

const Step1Schema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
}).strict()

const Step2Schema = z.object({
  tempToken: z.string().optional(),
  totpToken: z.string().length(6, 'Invalid verification code format'),
}).strict()

function clearTempTokenCookie(response: NextResponse): NextResponse {
  response.cookies.set(TEMP_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}

function invalidInput(details: Record<string, unknown>) {
  return NextResponse.json({ error: 'Invalid input', details }, { status: 400 })
}

async function handlePasswordStep(body: unknown): Promise<NextResponse> {
  const parsed = Step1Schema.safeParse(body)
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors)
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
    return NextResponse.json({ totpRequired: true, tempToken })
  }

  await resetFailedAttempts((data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})

  const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
  const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
  response.cookies.set('__session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', path: '/api', maxAge: 604800,
  })
  return response
}

async function handleTotpStep(req: NextRequest, body: unknown): Promise<NextResponse> {
  const parsed = Step2Schema.safeParse(body)
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors)
  }
  const { tempToken: bodyToken, totpToken } = parsed.data
  const tempToken = bodyToken || req.cookies.get(TEMP_TOKEN_COOKIE)?.value
  if (!tempToken) {
    return NextResponse.json({ error: 'Invalid or expired temp token' }, { status: 401 })
  }

  let payload = verifyTotpTempToken(tempToken)
  if (!payload || !payload.totp || !payload.userId) {
    return NextResponse.json({ error: 'Invalid or expired temp token' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: '2FA not enabled' }, { status: 400 })
  }
  if (typeof payload.tokenVersion === 'number' && payload.tokenVersion !== user.tokenVersion) {
    return NextResponse.json({ error: 'Session revoked. Please sign in again.' }, { status: 401 })
  }

  const lockedSeconds = lockedFor(user)
  if (lockedSeconds !== null) {
    return NextResponse.json(
      { error: 'Account temporarily locked. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(lockedSeconds) } }
    )
  }

  const { verifyTotpCode } = await import('@/lib/totp')
  if (!verifyTotpCode(totpToken, user.totpSecret)) {
    await recordFailedAttempt(user, (data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})
    return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
  }

  await resetFailedAttempts((data) => db.user.update({ where: { id: user.id }, data })).catch(() => {})

  const token = signToken({ userId: user.id, email: user.email, tokenVersion: user.tokenVersion })
  const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
  response.cookies.set('__session', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', path: '/api', maxAge: 604800,
  })
  return clearTempTokenCookie(response)
}

const handler = async (req: NextRequest) => {
  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    if ('totpToken' in body) return handleTotpStep(req, body)
    return handlePasswordStep(body)
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