import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { createBillPaymentJournalEntry } from '@/lib/purchasing'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const { billId, paidAt, paymentMethod } = await req.json()
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const bill = await storeDb(admin.storeId).bill.findUnique({ where: { id: billId } })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  const entry = await createBillPaymentJournalEntry({
    id: bill.id,
    storeId: bill.storeId,
    total: bill.total,
    paidAt: paidAt ? new Date(paidAt) : null,
    paymentMethod: paymentMethod || bill.paymentMethod,
  })

  await storeDb(admin.storeId).bill.update({
    where: { id: billId },
    data: { status: 'paid', paidAt: paidAt ? new Date(paidAt) : new Date() },
  })

  return NextResponse.json({ entry })
}, 'accounting')
