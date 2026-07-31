import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { recordAssetAcquisition } from '@/lib/depreciation'

export const POST = withAdmin(async (req: NextRequest, { params, admin }) => {
  const { id } = await params

  try {
    const entry = await recordAssetAcquisition(admin.storeId, id)
    return NextResponse.json({ entry })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}, 'accounting')
