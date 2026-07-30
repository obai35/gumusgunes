import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { invoiceNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerEmail: { contains: search, mode: 'insensitive' } },
  ]

  const [invoices, total] = await Promise.all([
    sdb.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { items: true } }),
    sdb.invoice.count({ where }),
  ])
  return NextResponse.json({ invoices, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const count = await sdb.invoice.count()
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

  if (body.orderId) {
    const order = await sdb.order.findFirst({ where: { id: body.orderId }, include: { items: { include: { product: true } } } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const invoice = await sdb.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerName: order.fullName,
        customerEmail: order.email,
        customerPhone: order.phone,
        customerAddress: order.address,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.totalAmount,
        status: 'draft',
        items: { create: order.items.map(i => ({ productId: i.productId, name: i.product?.name || `Product ${i.productId.slice(0, 8)}`, quantity: i.quantity, unitPrice: i.price, total: i.price * i.quantity } as any)) },
      } as any,
      include: { items: true },
    })
    return NextResponse.json({ invoice })
  }

  const invoice = await sdb.invoice.create({
    data: {
      invoiceNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      subtotal: body.subtotal,
      tax: body.tax || 0,
      shipping: body.shipping || 0,
      total: body.total,
      status: 'draft',
      issuedAt: new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      notes: body.notes,
      items: { create: (body.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice } as any)) },
    } as any,
    include: { items: true },
  })
  return NextResponse.json({ invoice })
}, 'accounting')
