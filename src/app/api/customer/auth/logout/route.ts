import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('__session', '', { httpOnly: true, path: '/api', maxAge: 0 })
  response.cookies.set('__session_admin', '', { httpOnly: true, path: '/api', maxAge: 0 })
  return response
}
