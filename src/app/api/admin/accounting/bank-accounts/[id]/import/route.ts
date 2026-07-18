import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params }) => {
  const body = await req.json()
  const { transactions } = body
  const created = []
  for (const tx of transactions) {
    const createdTx = await db.bankTransaction.create({
      data: {
        bankAccountId: params.id,
        transactionDate: new Date(tx.date),
        description: tx.description,
        reference: tx.reference,
        debit: tx.debit || 0,
        credit: tx.credit || 0,
        balance: tx.balance || 0,
      },
    })
    created.push(createdTx)
  }
  return NextResponse.json({ imported: created.length })
}, 'accounting')
