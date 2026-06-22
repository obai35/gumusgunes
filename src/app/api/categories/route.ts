import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    })
    return NextResponse.json({ ok: true, categories })
  } catch (err) {
    console.error('GET /api/categories error:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to load categories' },
      { status: 500 }
    )
  }
}
