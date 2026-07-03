import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 0,
  }
  for (const path of ['/', '/api']) {
    response.cookies.set('__session', '', { ...cookieOptions, path })
    response.cookies.set('__session_admin', '', { ...cookieOptions, path })
  }
  return response
}
