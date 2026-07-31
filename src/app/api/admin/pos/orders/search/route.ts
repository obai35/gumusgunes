import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const searchParams = req.nextUrl.searchParams
    const q = searchParams.get('q') || ''
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const shiftId = searchParams.get('shiftId')
    const branchId = searchParams.get('branchId')
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20') || 20))

    const where: any = {}
    if (q) {
      where.OR = [
        { id: q },
        { orderNumber: { contains: q } },
        { receiptNumber: { contains: q } },
        { fullName: { contains: q } },
      ]
    }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z')
    }
    if (shiftId) where.shiftId = shiftId
    if (status) where.status = status
    if (branchId && !admin.branchId) where.shift = { branchId }
    if (admin.branchId) where.shift = { branchId: admin.branchId }

    const [orders, total] = await Promise.all([
      sdb.order.findMany({
        where,
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          shift: { select: { branchId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      sdb.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: 'Failed to search orders' }, { status: 500 })
  }
}, 'pos')
