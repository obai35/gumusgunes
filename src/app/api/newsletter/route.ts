import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const existing = await db.newsletter.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }

    await db.newsletter.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name || null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/newsletter error:', err)
    return NextResponse.json({ ok: false, error: 'Subscription failed' }, { status: 500 })
  }
}
