import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rate-limit'

// GET /api/wishlist?sessionId=xxx
async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ ok: true, items: [] })
    }
    const items = await db.wishlistItem.findMany({
      where: { sessionId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      ok: true,
      items: items.map((i) => i.product),
    })
  } catch (err) {
    console.error('GET /api/wishlist error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGet, { limit: 30, window: '60s' })

// POST { sessionId, productId }
async function handlePost(req: NextRequest) {
  try {
    const body = await req.json()
    const { sessionId, productId } = body
    if (!sessionId || !productId) {
      return NextResponse.json({ ok: false, error: 'Missing sessionId or productId' }, { status: 400 })
    }
    const existing = await db.wishlistItem.findUnique({
      where: { sessionId_productId: { sessionId, productId } },
    })
    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } })
      return NextResponse.json({ ok: true, action: 'removed' })
    }
    await db.wishlistItem.create({ data: { sessionId, productId } })
    return NextResponse.json({ ok: true, action: 'added' })
  } catch (err) {
    console.error('POST /api/wishlist error:', err)
    return NextResponse.json({ ok: false, error: 'Failed' }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePost, { limit: 30, window: '60s' })
