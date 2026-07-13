import { NextRequest, NextResponse } from 'next/server'
import { verifyOtpCode } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ ok: false, error: 'Email and code are required' }, { status: 400 })
    }

    const valid = await verifyOtpCode(email, code)

    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Invalid or expired code' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/checkout/verify-otp error:', err)
    return NextResponse.json({ ok: false, error: 'Verification failed' }, { status: 500 })
  }
}
