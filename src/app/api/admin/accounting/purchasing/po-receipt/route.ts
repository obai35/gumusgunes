import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { createPOReceiptJournalEntry } from '@/lib/purchasing'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const { poId } = await req.json()
  if (!poId) return NextResponse.json({ error: 'poId required' }, { status: 400 })

  const po = await storeDb(admin.storeId).purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  })
  if (!po) return NextResponse.json({ error: 'PO not found' }, { status: 404 })

  const entry = await createPOReceiptJournalEntry({
    id: po.id,
    storeId: po.storeId,
    total: po.total,
    receivedAt: new Date(),
    items: po.items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
  })

  return NextResponse.json({ entry })
}, 'accounting')
