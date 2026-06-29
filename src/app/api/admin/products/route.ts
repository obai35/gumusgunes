import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const take = 50
    const skip = (page - 1) * take

    const [products, total] = await Promise.all([
      db.product.findMany({
        where: search ? { name: { contains: search } } : undefined,
        orderBy: { createdAt: 'desc' },
        take, skip,
      }),
      db.product.count({ where: search ? { name: { contains: search } } : undefined }),
    ])
    return NextResponse.json({ ok: true, products, total, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    console.error('GET /api/admin/products error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to load products' }, { status: 500 })
  }
}
