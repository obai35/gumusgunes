import { NextResponse } from 'next/server'
import { verifyPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
}).strict()

export async function POST(req: Request) {
  try {
    const parsed = LoginSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { email, password } = parsed.data

    const user = await db.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    if (!user.password) {
      return NextResponse.json({ error: 'This account uses Google sign-in. Please sign in with Google.', code: 'google_only_account' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

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
