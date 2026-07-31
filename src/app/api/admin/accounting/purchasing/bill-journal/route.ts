import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { createBillJournalEntry } from '@/lib/purchasing'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const { billId } = await req.json()
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const bill = await storeDb(admin.storeId).bill.findUnique({
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
}, 'accounting')
