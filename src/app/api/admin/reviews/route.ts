import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const take = 20
    const skip = (page - 1) * take
    const search = searchParams.get('search') || ''
    const rating = searchParams.get('rating') || ''
    const verified = searchParams.get('verified') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { authorName: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (rating) {
      where.rating = parseInt(rating)
    }

    if (verified === 'verified') where.isVerified = true
    else if (verified === 'unverified') where.isVerified = false

    const [reviews, total] = await Promise.all([
      sdb.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { product: { select: { name: true, slug: true } } },
        take,
        skip,
      }),
      sdb.review.count({ where }),
    ])

    return NextResponse.json({ ok: true, reviews, total, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    console.error('GET /api/admin/reviews error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to load reviews' }, { status: 500 })
  }
}, 'reviews')

export const PUT = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'Missing review id' }, { status: 400 })

    const review = await sdb.review.findFirst({ where: { id } })
    if (!review) return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 })

    const updated = await sdb.review.update({
      where: { id },
      data: { isVerified: !review.isVerified },
      include: { product: { select: { name: true, slug: true } } },
    })

    return NextResponse.json({ ok: true, review: updated })
  } catch (err) {
    console.error('PUT /api/admin/reviews error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to update review' }, { status: 500 })
  }
}, 'reviews')

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'Missing review id' }, { status: 400 })

    const review = await sdb.review.findFirst({ where: { id } })
    if (!review) return NextResponse.json({ ok: false, error: 'Review not found' }, { status: 404 })

    await sdb.review.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/reviews error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to delete review' }, { status: 500 })
  }
}, 'reviews')
