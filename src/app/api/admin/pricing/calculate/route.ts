import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { runCostAllocation } from '@/lib/cost-allocation'

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const result = await runCostAllocation(admin.storeId)
  return NextResponse.json(result)
}, 'pricing')
