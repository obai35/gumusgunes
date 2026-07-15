import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const dateParam = sp.get('date') || new Date().toISOString().slice(0, 10)
    const asOfDate = new Date(dateParam)
    asOfDate.setHours(23, 59, 59, 999)

    const accounts = await db.account.findMany({
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            entry: { date: { lte: asOfDate } },
          },
          select: { debit: true, credit: true },
        },
      },
    })

    const groups: Record<string, { code: string; name: string; balance: number }[]> = {
      asset: [],
      liability: [],
      equity: [],
    }

    for (const acc of accounts) {
      if (!groups[acc.type]) continue
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      let balance = totalDebit - totalCredit
      if (['liability', 'equity'].includes(acc.type)) {
        balance = totalCredit - totalDebit
      }
      groups[acc.type].push({ code: acc.code, name: acc.name, balance })
    }

    const totalAssets = groups.asset.reduce((s, a) => s + a.balance, 0)
    const totalLiabilities = groups.liability.reduce((s, l) => s + l.balance, 0)
    const totalEquity = groups.equity.reduce((s, e) => s + e.balance, 0)

    return NextResponse.json({
      asOfDate: asOfDate.toISOString(),
      groups,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    })
  } catch (e) {
    console.error('Balance sheet GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch balance sheet' }, { status: 500 })
  }
}, 'accounting')
