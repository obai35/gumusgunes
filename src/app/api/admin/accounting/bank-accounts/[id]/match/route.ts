import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params }) => {
  const unmatched = await db.bankTransaction.findMany({
    where: { bankAccountId: params.id, matchedEntryId: null },
    orderBy: { transactionDate: 'desc' },
  })
  const entries = await db.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  })
  const suggestions: { transactionId: string; entryId: string; score: number }[] = []
  for (const tx of unmatched) {
    for (const entry of entries) {
      const entryTotal = entry.lines.reduce((s, l) => s + l.debit + l.credit, 0)
      const txAmount = tx.debit + tx.credit
      if (Math.abs(entryTotal - txAmount) < 0.01) {
        suggestions.push({ transactionId: tx.id, entryId: entry.id, score: 100 })
      }
    }
  }
  return NextResponse.json({ suggestions })
}, 'accounting')
