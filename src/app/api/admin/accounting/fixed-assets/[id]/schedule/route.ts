import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'
import { getAssetSchedule } from '@/lib/depreciation'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const asset = await storeDb(storeId).fixedAsset.findFirst({ where: { id } })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const schedule = await getAssetSchedule(asset)
  return NextResponse.json({ schedule })
}
