import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getMonthlyBudgetVsActual } from '@/lib/fpna'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const data = await getMonthlyBudgetVsActual(admin.storeId, year)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch monthly budget vs actual' }, { status: 500 })
  }
}, 'accounting')
