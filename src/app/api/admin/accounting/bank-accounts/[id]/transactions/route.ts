import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const transactions = await sdb.bankTransaction.findMany({
    where: { bankAccountId: params.id },
    orderBy: { transactionDate: 'desc' },
    include: { matchedEntry: { include: { lines: { include: { account: true } } } } },
  })
  return NextResponse.json({ transactions })
}, 'accounting')
