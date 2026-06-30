import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const categoryId = searchParams.get('categoryId') || ''

    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const take = 50
    const skip = (page - 1) * take

    const where: any = {}
    if (search) where.name = { contains: search }
    if (categoryId) where.categoryId = categoryId

    const [products, total] = await Promise.all([
      db.product.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip, include: { category: { select: { id: true, name: true } } } }),
      db.product.count({ where }),
    ])
    return NextResponse.json({ ok: true, products, total, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    console.error('GET /api/admin/products error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to load products' }, { status: 500 })
  }
}
