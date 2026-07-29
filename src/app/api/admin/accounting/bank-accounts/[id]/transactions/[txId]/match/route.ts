import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const tx = await sdb.bankTransaction.update({
    where: { id: params.txId },
    data: { matchedEntryId: body.entryId, matchedAt: new Date(), matchedById: admin.id, isReconciled: true },
  })
  return NextResponse.json({ transaction: tx })
}, 'accounting')
