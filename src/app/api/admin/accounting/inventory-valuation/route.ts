import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getInventoryValuation } from '@/lib/cogs'

export const GET = withAdmin(async () => {
  try {
    const valuation = await getInventoryValuation()
    return NextResponse.json(valuation)
  } catch (e) {
    console.error('Inventory valuation error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
