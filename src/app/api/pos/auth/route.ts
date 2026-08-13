import { NextRequest, NextResponse } from 'next/server'
import { verifyPosCredentials, signPosToken } from '@/lib/pos-auth'
import { withDualRateLimit } from '@/lib/rate-limit'

const handler = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const user = await verifyPosCredentials(email, password)
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const token = signPosToken(user)
    return NextResponse.json({ ok: true, token, user })
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
