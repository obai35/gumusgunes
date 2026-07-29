import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { createBillJournalEntry } from '@/lib/purchasing'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { billId } = await req.json()
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const bill = await storeDb(storeId).bill.findUnique({
    where: { id: billId },
    include: { items: true },
  })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  const entry = await createBillJournalEntry({
    id: bill.id,
    storeId: bill.storeId,
    subtotal: bill.subtotal,
    tax: bill.tax,
    total: bill.total,
    issuedAt: bill.issuedAt,
    notes: bill.notes,
    items: bill.items.map(i => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
  })
  return NextResponse.json({ entry })
}
