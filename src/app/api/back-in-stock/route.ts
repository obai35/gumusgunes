import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { withRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  productId: z.string().min(1),
})

async function handlePost(req: NextRequest) {
  try {
    const { db: sdb, storeId } = await storefrontDb(req)
    const body = await req.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Valid email and product are required.' },
        { status: 400 }
      )
    }

    const { email, productId } = parsed.data

    const product = await sdb.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
    }

    // If already in stock, let them know
    if (product.stock > 0) {
      return NextResponse.json({
        ok: true,
        alreadyInStock: true,
        message: 'Good news — this piece is already in stock!',
      })
    }

    // Idempotent: if already subscribed, acknowledge
    const existing = await sdb.backInStock.findUnique({
      where: { email_productId: { email: email.toLowerCase(), productId } },
    })
    if (existing) {
      return NextResponse.json({ ok: true, alreadySubscribed: true })
    }

    await sdb.backInStock.create({
      data: { email: email.toLowerCase(), productId, storeId },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('POST /api/back-in-stock error:', err)
    return NextResponse.json({ ok: false, error: 'Subscription failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePost, { limit: 5, window: '60s' })
