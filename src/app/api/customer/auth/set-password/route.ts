import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/auth-api'
import { hashPassword } from '@/lib/customer-auth'
import { db } from '@/lib/db'

const SetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit'),
}).strict()

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const parsed = SetPasswordSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({
      where: { id: user.userId },
      select: { password: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.password !== '') {
      return NextResponse.json({ error: 'Password already set' }, { status: 400 })
    }

    await db.user.update({
      where: { id: user.userId },
      data: { password: await hashPassword(parsed.data.password) },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Set password error:', e)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}
