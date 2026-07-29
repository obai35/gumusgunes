import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { storeDb } from '@/lib/store-scoped'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))

  const where: any = {}
  if (status) where.status = status

  const [assets, total] = await Promise.all([
    storeDb(storeId).fixedAsset.findMany({
      where,
      include: { depreciationEntries: { orderBy: { periodDate: 'desc' }, take: 5 } },
      orderBy: { purchaseDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    storeDb(storeId).fixedAsset.count({ where }),
  ])
  return NextResponse.json({ assets, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const storeId = session.user.storeId
  if (!storeId) return NextResponse.json({ error: 'No store' }, { status: 400 })

  const body = await req.json()
  if (!body.name || !body.assetNumber || !body.purchaseCost || !body.usefulLifeYears) {
    return NextResponse.json({ error: 'name, assetNumber, purchaseCost, usefulLifeYears required' }, { status: 400 })
  }

  const asset = await (storeDb(storeId).fixedAsset as any).create({
    data: {
      name: body.name,
      nameAr: body.nameAr || null,
      assetNumber: body.assetNumber,
      category: body.category || 'equipment',
      purchaseDate: new Date(body.purchaseDate || new Date()),
      purchaseCost: body.purchaseCost,
      salvageValue: body.salvageValue || 0,
      usefulLifeYears: body.usefulLifeYears,
      depreciationMethod: body.depreciationMethod || 'straight-line',
      currentBookValue: body.purchaseCost,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ asset })
}
