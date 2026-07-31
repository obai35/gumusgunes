import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getInventoryValuationDetail } from '@/lib/purchasing'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const valuation = await getInventoryValuationDetail(admin.storeId)
  return NextResponse.json({ valuation })
}, 'accounting')
