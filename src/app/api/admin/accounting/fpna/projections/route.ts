import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getFinancialProjections } from '@/lib/fpna'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.storeId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const baseYear = parseInt(searchParams.get('baseYear') || new Date().getFullYear().toString())
    const years = parseInt(searchParams.get('years') || '3')

    const data = await getFinancialProjections(session.user.storeId, baseYear, years)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projections' }, { status: 500 })
  }
}
