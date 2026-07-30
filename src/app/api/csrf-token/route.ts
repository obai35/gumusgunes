import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET() {
  const token = crypto.randomUUID()
  const response = NextResponse.json({ token })
  response.cookies.set('__csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 1800,
  })
  return response
}
