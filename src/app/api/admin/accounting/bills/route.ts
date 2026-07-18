import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { billNumber: { contains: search, mode: 'insensitive' } },
    { supplierName: { contains: search, mode: 'insensitive' } },
  ]

  const [bills, total] = await Promise.all([
    db.bill.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { items: true } }),
    db.bill.count({ where }),
  ])
  return NextResponse.json({ bills, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const count = await db.bill.count()
  const billNumber = `BILL-${String(count + 1).padStart(5, '0')}`

  const bill = await db.bill.create({
    data: {
      billNumber,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      subtotal: body.subtotal,
      tax: body.tax || 0,
      total: body.total,
      status: 'pending',
      issuedAt: new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      notes: body.notes,
      items: { create: (body.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
    },
    include: { items: true },
  })
  return NextResponse.json({ bill })
}, 'accounting')
