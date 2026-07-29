import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { recordInterCompanyTxn } from '@/lib/consolidation'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const status = searchParams.get('status')

  const where: any = {}
  if (groupId) where.groupId = groupId
  if (status) where.status = status

  const txns = await storeDb(storeId).interCompanyTransaction.findMany({
    where,
    include: {
      fromStore: { select: { id: true, name: true } },
      toStore: { select: { id: true, name: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  })
  return NextResponse.json({ transactions: txns })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const body = await req.json()
  if (!body.groupId || !body.fromStoreId || !body.toStoreId || !body.amount || !body.description) {
    return NextResponse.json({ error: 'groupId, fromStoreId, toStoreId, amount, description required' }, { status: 400 })
  }

  const group = await storeDb(storeId).group.findFirst({ where: { id: body.groupId } })
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
}
