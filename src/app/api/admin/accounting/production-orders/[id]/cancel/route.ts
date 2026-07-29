import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { cancelProductionOrder } from '@/lib/manufacturing'

export const POST = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  try {
    const item = await cancelProductionOrder(params.id, admin.storeId)
    return NextResponse.json(item)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
})
