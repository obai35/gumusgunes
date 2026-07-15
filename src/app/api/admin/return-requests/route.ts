import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [{ rmaNumber: { contains: search, mode: 'insensitive' } }, { order: { orderNumber: { contains: search, mode: 'insensitive' } } }]

  const [returnRequests, total] = await Promise.all([
    db.returnRequest.findMany({
      where,
      include: {
        order: { select: { id: true, orderNumber: true, fullName: true } },
        product: { select: { id: true, name: true, sku: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.returnRequest.count({ where }),
  ])

  return NextResponse.json({ ok: true, returnRequests, total, totalPages: Math.ceil(total / limit) })
}, 'orders')

export const POST = withAdmin(async (req: NextRequest) => {
  const { orderId, productId, quantity, reason, notes } = await req.json()
  if (!orderId || !productId || !quantity || !reason) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const count = await db.returnRequest.count()
  const rmaNumber = `RMA-${String(count + 1).padStart(5, '0')}`

  const returnRequest = await db.returnRequest.create({
    data: { orderId, productId, quantity, reason, notes, rmaNumber },
    include: {
      order: { select: { orderNumber: true, fullName: true } },
      product: { select: { name: true, sku: true } },
    },
  })

  return NextResponse.json({ ok: true, returnRequest })
}, 'orders')
