import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const asset = await storeDb(storeId).fixedAsset.findFirst({
    where: { id },
    include: { depreciationEntries: { orderBy: { periodDate: 'desc' } } },
  })
  if (!asset) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ asset })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  const body = await req.json()
  const asset = await storeDb(storeId).fixedAsset.update({
    where: { id },
    data: {
      name: body.name,
      nameAr: body.nameAr,
      category: body.category,
      salvageValue: body.salvageValue,
      usefulLifeYears: body.usefulLifeYears,
      depreciationMethod: body.depreciationMethod,
      notes: body.notes,
    },
  })
  return NextResponse.json({ asset })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })
  const { id } = await params

  await storeDb(storeId).fixedAsset.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
