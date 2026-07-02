import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const user = await db.user.create({
      data: { email, name, password: await hashPassword(password) },
    })

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name }
    })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
