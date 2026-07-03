import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit'),
}).strict()

export async function POST(req: Request) {
  try {
    const parsed = ResetSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const resetToken = await db.resetToken.findUnique({
      where: { token: parsed.data.token },
    })

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
    await db.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    })

    await db.resetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ message: 'Password reset successful' })
  } catch (error) {
    console.error('[reset-password]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
