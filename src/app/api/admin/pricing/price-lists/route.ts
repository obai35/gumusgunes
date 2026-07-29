import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const tx = storeDb(admin.storeId)
  const data = await tx.priceList.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      _count: { select: { items: true } },
      ...(productId ? {
        items: {
          where: { productId },
          include: { product: { select: { id: true, name: true, sku: true, price: true, costPrice: true, imageUrl: true } } },
        },
      } : {}),
    },
  })
  return NextResponse.json(data)
}, 'pricing')

export const POST = withAdmin(async (req, { admin }) => {
  const body = await req.json()
  const { name, slug, description, type, value, currency, isDefault, isActive, sortOrder } = body
  const tx = storeDb(admin.storeId)
  const data = await (tx.priceList as any).create({
    data: {
      name, slug, description, type: type || 'markup',
      value: value || null, currency: currency || 'EGP',
      isDefault: isDefault || false, isActive: isActive ?? true,
      sortOrder: sortOrder || 0,
    },
  })
  return NextResponse.json(data, { status: 201 })
}, 'pricing')
