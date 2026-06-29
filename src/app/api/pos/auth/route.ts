import { NextRequest, NextResponse } from 'next/server'
import { verifyPosCredentials, signPosToken } from '@/lib/pos-auth'

export async function POST(req: NextRequest) {
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
