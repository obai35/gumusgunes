import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { createPOReceiptJournalEntry } from '@/lib/purchasing'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { poId } = await req.json()
  if (!poId) return NextResponse.json({ error: 'poId required' }, { status: 400 })

  const po = await storeDb(storeId).purchaseOrder.findUnique({
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
}
