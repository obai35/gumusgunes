import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getConsolidatedPL, getConsolidatedBalanceSheet } from '@/lib/consolidation'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get('groupId')
  const reportType = searchParams.get('type') ?? 'pl'
  const periodStart = searchParams.get('periodStart')
  const periodEnd = searchParams.get('periodEnd')
  const asOf = searchParams.get('asOf')

  if (!groupId) return NextResponse.json({ error: 'groupId required' }, { status: 400 })

  try {
    if (reportType === 'pl') {
      if (!periodStart || !periodEnd) return NextResponse.json({ error: 'periodStart and periodEnd required for PL' }, { status: 400 })
      const report = await getConsolidatedPL(groupId, new Date(periodStart), new Date(periodEnd))
      return NextResponse.json({ report, type: 'pl' })
    } else if (reportType === 'balance-sheet') {
      const asOfDate = asOf ? new Date(asOf) : new Date()
      const report = await getConsolidatedBalanceSheet(groupId, asOfDate)
      return NextResponse.json({ report, type: 'balance-sheet' })
    }
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
