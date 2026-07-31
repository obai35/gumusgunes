import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'
import { getAssetSchedule } from '@/lib/depreciation'

export const GET = withAdmin(async (req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params

  const asset = await sdb.fixedAsset.findFirst({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const schedule = await getAssetSchedule(asset)
  return NextResponse.json({ schedule })
}, 'accounting')
