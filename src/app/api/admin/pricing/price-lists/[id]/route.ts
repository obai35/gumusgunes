import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin, params }) => {
  const tx = storeDb(admin.storeId)
  const data = await tx.priceList.findFirstOrThrow({
    where: { id: params.id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, sku: true, price: true, costPrice: true, imageUrl: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  return NextResponse.json(data)
}, 'pricing')

export const PUT = withAdmin(async (req, { admin, params }) => {
  const body = await req.json()
  const tx = storeDb(admin.storeId)
  const data = await tx.priceList.updateMany({
    where: { id: params.id },
    data: body,
  })
  return NextResponse.json(data)
}, 'pricing')

export const DELETE = withAdmin(async (req, { admin, params }) => {
  const tx = storeDb(admin.storeId)
  await tx.priceList.deleteMany({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'pricing')
