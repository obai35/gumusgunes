import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''

    const products = await db.product.findMany({
      where: search ? { name: { contains: search } } : undefined,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ ok: true, products })
  } catch (err) {
    console.error('GET /api/admin/products error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to load products' }, { status: 500 })
  }
}
