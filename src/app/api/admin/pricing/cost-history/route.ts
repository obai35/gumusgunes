import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId')
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)

  const tx = storeDb(admin.storeId)
  const where: any = {}
  if (productId) where.productId = productId

  const data = await tx.costHistory.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      product: { select: { id: true, name: true, sku: true, imageUrl: true } },
    },
  })

  return NextResponse.json(data)
}, 'pricing')

export const POST = withAdmin(async (req, { admin }) => {
  const body = await req.json()
  const { productId, unitCost, quantity, reference, referenceId, type, note, beforeCost, afterCost } = body

  const totalCost = unitCost * (quantity || 1)
  const tx = storeDb(admin.storeId)

  const data = await (tx.costHistory as any).create({
    data: {
      productId,
      unitCost,
      quantity: quantity || 1,
      totalCost,
      beforeCost: beforeCost || null,
      afterCost: afterCost || null,
      reference,
      referenceId,
      type: type || 'manual_adjustment',
      note,
    },
  })

  await tx.product.update({
    where: { id: productId },
    data: { costPrice: unitCost },
  })

  return NextResponse.json(data, { status: 201 })
}, 'pricing')
