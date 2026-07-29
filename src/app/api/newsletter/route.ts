import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

async function handlePost(req: NextRequest) {
  try {
    const { db: sdb } = await storefrontDb(req)
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const existing = await sdb.newsletter.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }

    await sdb.newsletter.create({
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

export const POST = withRateLimit(handlePost, { limit: 3, window: '60s' })
