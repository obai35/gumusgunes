import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storefrontDb } from '@/lib/storefront-db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { db: sdb } = await storefrontDb(_req)
    const { id } = await params
    // Support both id and slug lookups
    const product = await sdb.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      select: {
        id: true, name: true, slug: true, description: true, price: true, compareAtPrice: true,
        sku: true, imageUrl: true, images: true, material: true, weight: true, rating: true, reviewCount: true,
        stock: true, tags: true, isNew: true, isBestseller: true, isFeatured: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
      categoryId: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, authorName: true, rating: true, title: true, comment: true, createdAt: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { ok: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Suggest related products from the same category
    const related = await sdb.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      select: {
        id: true, name: true, slug: true, price: true, imageUrl: true,
        rating: true, reviewCount: true, isNew: true, isBestseller: true,
      },
      take: 4,
      orderBy: { isBestseller: 'desc' },
    })

    return NextResponse.json({ ok: true, product, related }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch (err) {
    console.error('GET /api/products/[id] error:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to load product' },
      { status: 500 }
    )
  }
}
