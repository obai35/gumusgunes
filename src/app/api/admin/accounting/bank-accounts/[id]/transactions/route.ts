import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }) => {
  const transactions = await db.bankTransaction.findMany({
    where: { bankAccountId: params.id },
    orderBy: { transactionDate: 'desc' },
    include: { matchedEntry: { include: { lines: { include: { account: true } } } } },
  })
  return NextResponse.json({ transactions })
}, 'accounting')
