import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const search = req.nextUrl.searchParams.get('search') || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.poNumber = { contains: search, mode: 'insensitive' }

  const [purchaseOrders, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.purchaseOrder.count({ where }),
  ])

  return NextResponse.json({
    ok: true,
    purchaseOrders: purchaseOrders.map(po => ({
      ...po,
      total: po.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0),
    })),
    total,
    totalPages: Math.ceil(total / limit),
  })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest) => {
  const { supplierId, notes, items } = await req.json()

  if (!supplierId) return NextResponse.json({ error: 'Supplier required' }, { status: 400 })
  if (!items?.length) return NextResponse.json({ error: 'At least one item required' }, { status: 400 })

  const count = await db.purchaseOrder.count()
  const poNumber = `PO-${String(count + 1).padStart(5, '0')}`

  const purchaseOrder = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes,
      items: {
        create: items.map((i: { productId: string; quantity: number; unitCost: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  })

  return NextResponse.json({ ok: true, purchaseOrder })
}, 'inventory')
