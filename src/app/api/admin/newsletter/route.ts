import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const take = 50
    const skip = (page - 1) * take
    const search = searchParams.get('search') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [subscribers, total, totalThisMonth] = await Promise.all([
      sdb.newsletter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      sdb.newsletter.count(),
      sdb.newsletter.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    return NextResponse.json({ ok: true, subscribers, total, totalThisMonth, page, totalPages: Math.ceil(total / take) })
  } catch (err) {
    console.error('GET /api/admin/newsletter error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to load subscribers' }, { status: 500 })
  }
}, 'newsletter')

export const DELETE = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ ok: false, error: 'Missing subscriber id' }, { status: 400 })

    const sub = await sdb.newsletter.findUnique({ where: { id } })
    if (!sub) return NextResponse.json({ ok: false, error: 'Subscriber not found' }, { status: 404 })

    await sdb.newsletter.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('DELETE /api/admin/newsletter error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to delete subscriber' }, { status: 500 })
  }
}, 'newsletter')
