import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ResetSchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit'),
}).strict()

const handler = async (req: NextRequest) => {
  try {
    const parsed = ResetSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const records = await db.resetToken.findMany({
      where: { email: parsed.data.email, usedAt: null, expiresAt: { gt: new Date() } },
    })

    let resetToken: (typeof records)[number] | null = null
    for (const r of records) {
      if (await bcrypt.compare(parsed.data.token, r.token)) {
        resetToken = r
        break
      }
    }

    if (!resetToken) {
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

export const POST = withRateLimit(handler, { limit: 5, window: '120s' })
