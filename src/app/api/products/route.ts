import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category') // slug
    const featured = searchParams.get('featured')
    const isNew = searchParams.get('new')
    const bestseller = searchParams.get('bestseller')
    const limit = searchParams.get('limit')
    const sort = searchParams.get('sort') // 'price-asc' | 'price-desc' | 'newest' | 'rating'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const tags = searchParams.get('tags')

    const where: Prisma.ProductWhereInput = { isActive: true }
    if (category && category !== 'all') {
      where.category = { slug: category }
    }
    if (featured === 'true') where.isFeatured = true
    if (isNew === 'true') where.isNew = true
    if (bestseller === 'true') where.isBestseller = true
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }
    if (tags) {
      // Simple substring match on the JSON tags string
      const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        where.OR = tagList.map((t) => ({
          tags: { contains: `"${t}"` },
        }))
      }
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price-asc'
        ? { price: 'asc' }
        : sort === 'price-desc'
          ? { price: 'desc' }
          : sort === 'rating'
            ? { rating: 'desc' }
            : { createdAt: 'desc' }

    const products = await db.product.findMany({
      where,
      orderBy,
      include: { category: true },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({ ok: true, products, count: products.length })
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to load products' },
      { status: 500 }
    )
  }
}
