import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import sanitizeHtml from 'sanitize-html'

const ReviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(1).max(80),
  authorEmail: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  comment: z.string().min(1).max(2000),
})

async function handlePost(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ReviewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid review data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const { productId, ...rest } = parsed.data

    const sanitizedTitle = sanitizeHtml(rest.title, { allowedTags: [], allowedAttributes: {} })
    const sanitizedComment = sanitizeHtml(rest.comment, { allowedTags: [], allowedAttributes: {} })

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ ok: false, error: 'Product not found' }, { status: 404 })
    }

    const review = await db.review.create({
      data: { ...rest, title: sanitizedTitle, comment: sanitizedComment, productId, authorEmail: rest.authorEmail || null },
    })

    // Recalculate rating + reviewCount
    const agg = await db.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: true,
    })
    await db.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count,
      },
    })

    return NextResponse.json({ ok: true, review })
  } catch (err) {
    console.error('POST /api/reviews error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to submit review' }, { status: 500 })
  }
}

export const POST = withRateLimit(handlePost, { limit: 5, window: '60s' })
