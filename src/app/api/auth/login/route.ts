import { NextResponse } from 'next/server'
import { verifyPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, totpToken } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (user.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true, userId: user.id })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, user.totpSecret!)) return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
    response.cookies.set('__session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/api', maxAge: 604800,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
