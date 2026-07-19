import { NextRequest, NextResponse } from 'next/server'
import { createOtpVerification, sendOtpEmail } from '@/lib/otp'
import { withRateLimit } from '@/lib/rate-limit'

const handler = async (req: NextRequest) => {
  try {
    const { email } = await req.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 })
    }

    const code = await createOtpVerification(email)
    await sendOtpEmail(email, code)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/checkout/send-otp error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to send verification code' }, { status: 500 })
  }
}

export const POST = withRateLimit(handler, { limit: 3, window: '60s', identifier: (req) => req.headers.get('x-forwarded-for') || 'unknown' })
