import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const flat = req.nextUrl.searchParams.get('flat') === 'true'

    const categories = await db.category.findMany({
      where: { isVisible: true },
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
        parent: { select: { id: true, name: true, slug: true } },
        children: { select: { id: true, name: true, slug: true, icon: true, imageUrl: true } },
      },
    })

    if (flat) {
      return NextResponse.json({ ok: true, categories }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
    }

    const parents = categories.filter(c => !c.parentId)
    const withChildren = parents.map(p => ({
      ...p,
      children: categories.filter(c => c.parentId === p.id),
    }))

    return NextResponse.json({ ok: true, categories: withChildren }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to load categories' },
      { status: 500 }
    )
  }
}
