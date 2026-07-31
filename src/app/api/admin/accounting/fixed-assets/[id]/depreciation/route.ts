import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { runDepreciationForAsset } from '@/lib/depreciation'

export const POST = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const { periodDate } = await req.json()
  try {
    const result = await runDepreciationForAsset(admin.storeId, id, periodDate ? new Date(periodDate) : new Date())
    if (!result) return NextResponse.json({ error: 'No depreciation to record (amount = 0)' }, { status: 400 })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}, 'accounting')
