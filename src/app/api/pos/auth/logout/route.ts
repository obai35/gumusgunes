import { NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

const handler = async () => {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('__session_pos', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  })
  return response
}

export const POST = withRateLimit(handler, { limit: 10, window: '60s', failClosed: true })