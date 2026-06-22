import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Support both id and slug lookups
    const product = await db.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        category: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
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
    const related = await db.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      take: 4,
      orderBy: { isBestseller: 'desc' },
    })

    return NextResponse.json({ ok: true, product, related })
  } catch (err) {
    console.error('GET /api/products/[id] error:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to load product' },
      { status: 500 }
    )
  }
}
