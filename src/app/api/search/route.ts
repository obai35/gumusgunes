import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withRateLimit } from '@/lib/rate-limit'

async function handleGet(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    if (!q) {
      return NextResponse.json({ ok: true, products: [], suggestions: [] })
    }

    const products = await db.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { material: { contains: q } },
          { tags: { contains: q } },
          { sku: { contains: q } },
        ],
      },
      take: 12,
      orderBy: { isBestseller: 'desc' },
      include: { category: true },
    })

    const categories = await db.category.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 6,
    })

    return NextResponse.json({
      ok: true,
      products,
      suggestions: categories.map((c) => c.name),
    })
  } catch (err) {
    console.error('GET /api/search error:', err)
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 })
  }
}

export const GET = withRateLimit(handleGet, { limit: 60, window: '60s' })
