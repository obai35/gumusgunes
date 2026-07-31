import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { getAPAging } from '@/lib/purchasing'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const aging = await getAPAging(admin.storeId)
  return NextResponse.json({ aging })
}, 'accounting')
