import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getFinancialProjections } from '@/lib/fpna'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const { searchParams } = new URL(req.url)
    const baseYear = parseInt(searchParams.get('baseYear') || new Date().getFullYear().toString())
    const years = parseInt(searchParams.get('years') || '3')

    const data = await getFinancialProjections(admin.storeId, baseYear, years)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projections' }, { status: 500 })
  }
}, 'accounting')
