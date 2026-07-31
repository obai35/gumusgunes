import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { recordInterCompanyTxn } from '@/lib/consolidation'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const status = searchParams.get('status')

  const where: any = {}
  if (groupId) where.groupId = groupId
  if (status) where.status = status

  const txns = await storeDb(admin.storeId).interCompanyTransaction.findMany({
    where,
    include: {
      fromStore: { select: { id: true, name: true } },
      toStore: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })
  return NextResponse.json({ transactions: txns })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const body = await req.json()
  if (!body.groupId || !body.fromStoreId || !body.toStoreId || !body.amount || !body.description) {
    return NextResponse.json({ error: 'groupId, fromStoreId, toStoreId, amount, description required' }, { status: 400 })
  }

  const group = await storeDb(admin.storeId).group.findFirst({ where: { id: body.groupId } })
  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

  const txn = await recordInterCompanyTxn({
    groupId: body.groupId,
    fromStoreId: body.fromStoreId,
    toStoreId: body.toStoreId,
    amount: body.amount,
    currency: body.currency,
    exchangeRate: body.exchangeRate,
    description: body.description,
    reference: body.reference,
    type: body.type ?? 'sale',
    date: body.date ? new Date(body.date) : undefined,
  })

  return NextResponse.json({ transaction: txn })
}, 'accounting')
