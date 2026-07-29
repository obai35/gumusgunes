import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { createBillPaymentJournalEntry } from '@/lib/purchasing'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { billId, paidAt, paymentMethod } = await req.json()
  if (!billId) return NextResponse.json({ error: 'billId required' }, { status: 400 })

  const bill = await storeDb(storeId).bill.findUnique({ where: { id: billId } })
  if (!bill) return NextResponse.json({ error: 'Bill not found' }, { status: 404 })

  const entry = await createBillPaymentJournalEntry({
    id: bill.id,
    storeId: bill.storeId,
    total: bill.total,
    paidAt: paidAt ? new Date(paidAt) : null,
    paymentMethod: paymentMethod || bill.paymentMethod,
  })

  await storeDb(storeId).bill.update({
    where: { id: billId },
    data: { status: 'paid', paidAt: paidAt ? new Date(paidAt) : new Date() },
  })

  return NextResponse.json({ entry })
}
