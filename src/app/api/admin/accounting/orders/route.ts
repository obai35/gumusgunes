import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = sp.get('search') || ''
    const status = sp.get('status') || ''
    const paymentStatus = sp.get('paymentStatus') || ''
    const branchId = sp.get('branchId') || ''
    const from = sp.get('from') || ''
    const to = sp.get('to') || ''
    const page = parseInt(sp.get('page') || '1')
    const limit = parseInt(sp.get('limit') || '30')

    const where: any = {}
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { receiptNumber: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (branchId) where.shift = { branchId }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z')
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { name: true } } } },
          shift: { include: { branch: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e) {
    console.error('Orders GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
