import { NextResponse } from 'next/server'
import { hashPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const RegisterSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit'),
  phone: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
}).strict()

export async function POST(req: Request) {
  try {
    const parsed = RegisterSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { email, password, name, gender } = parsed.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const user = await db.user.create({
      data: { email, password: await hashPassword(password), name, gender },
    })

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
    response.cookies.set('__session', token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', path: '/api', maxAge: 604800,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
