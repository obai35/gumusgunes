import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword, signToken } from '@/lib/customer-auth'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password || !name) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })

    const user = await prisma.user.create({
      data: { email, password: await hashPassword(password), name },
    })

    const token = signToken({ userId: user.id, email: user.email })
    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
