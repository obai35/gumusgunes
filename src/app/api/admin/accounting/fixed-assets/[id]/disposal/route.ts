import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { recordAssetDisposal } from '@/lib/depreciation'

export const POST = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  const { disposalDate, proceeds } = await req.json()
  try {
    const result = await recordAssetDisposal(admin.storeId, id, disposalDate ? new Date(disposalDate) : new Date(), proceeds || 0)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}, 'accounting')
