import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { recordAssetAcquisition } from '@/lib/depreciation'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  try {
    const entry = await recordAssetAcquisition(storeId, id)
    return NextResponse.json({ entry })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
