import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const DELETE = withAdmin(async (req, { admin, params }) => {
  const tx = storeDb(admin.storeId)
  await tx.priceListItem.deleteMany({
    where: { id: params.itemId, priceListId: params.id },
  })
  return NextResponse.json({ success: true })
}, 'pricing')
