import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req, { admin, params }) => {
  const body = await req.json()
  const { productId, price, minQuantity } = body

  const tx = storeDb(admin.storeId)

  const existing = await tx.priceListItem.findUnique({
    where: { priceListId_productId: { priceListId: params.id, productId } },
  })

  let item
  if (existing) {
    item = await tx.priceListItem.update({
      where: { id: existing.id },
      data: { price, minQuantity: minQuantity ?? 1 },
    })
  } else {
    item = await (tx.priceListItem as any).create({
      data: {
        priceListId: params.id,
        productId,
        price,
        minQuantity: minQuantity ?? 1,
      },
    })
  }

  return NextResponse.json(item, { status: 201 })
}, 'pricing')
