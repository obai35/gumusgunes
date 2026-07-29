import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'
import { withRateLimit } from '@/lib/rate-limit'

async function handleGet(req: NextRequest) {
  try {
    const { db: sdb } = await storefrontDb(req)
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    if (!q) {
      return NextResponse.json({ ok: true, products: [], suggestions: [] })
    }

    const products = await sdb.product.findMany({
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
      select: {
        id: true, name: true, slug: true, price: true, imageUrl: true,
        rating: true, reviewCount: true, isNew: true, isBestseller: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      take: 12,
      orderBy: { isBestseller: 'desc' },
    })

    const categories = await sdb.category.findMany({
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
