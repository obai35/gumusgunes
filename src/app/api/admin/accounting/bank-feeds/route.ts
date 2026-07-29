import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { getConnector, listConnectors } from '@/lib/bank-connectors'

export const GET = withAdmin(async (_req, { admin }) => {
  const connectors = listConnectors()
  const sdb = storeDb(admin.storeId)
  const accounts = await sdb.bankAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json({ connectors, accounts })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { bankAccountId, connectorId, fromDate } = await req.json()
  if (!bankAccountId || !connectorId) {
    return NextResponse.json({ error: 'bankAccountId and connectorId are required' }, { status: 400 })
  }

  const account = await sdb.bankAccount.findFirst({ where: { id: bankAccountId, storeId: admin.storeId } })
  if (!account) return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })

  const connector = getConnector(connectorId)
  if (!connector) return NextResponse.json({ error: `Unknown connector: ${connectorId}` }, { status: 400 })

  const from = fromDate || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const raw = await connector.fetch(account.accountNumber, from)

  let imported = 0
  for (const tx of raw) {
    const exists = await sdb.bankTransaction.findFirst({
      where: { bankAccountId: account.id, reference: tx.reference || undefined },
    })
    if (exists) continue
    await sdb.bankTransaction.create({
      data: {
        storeId: admin.storeId,
        bankAccountId: account.id,
        transactionDate: new Date(tx.date),
        description: tx.description,
        debit: tx.amount > 0 ? tx.amount : 0,
        credit: tx.amount < 0 ? -tx.amount : 0,
        balance: tx.balance ?? 0,
        reference: tx.reference || null,
      },
    })
    imported++
  }

  if (imported > 0) {
    const balanceTx = await sdb.bankTransaction.aggregate({
      where: { bankAccountId: account.id },
      _sum: { debit: true, credit: true },
    })
    await sdb.bankAccount.update({
      where: { id: account.id },
      data: {
        currentBalance: account.openingBalance + (balanceTx._sum.debit || 0) - (balanceTx._sum.credit || 0),
      },
    })
  }

  return NextResponse.json({ imported, total: raw.length })
}, 'accounting')
