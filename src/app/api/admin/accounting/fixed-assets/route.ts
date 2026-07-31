import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const status = req.nextUrl.searchParams.get('status')
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '50')))

  const where: any = {}
  if (status) where.status = status

  const [assets, total] = await Promise.all([
    sdb.fixedAsset.findMany({
      where,
      include: { depreciationEntries: { orderBy: { periodDate: 'desc' }, take: 5 } },
      orderBy: { purchaseDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    sdb.fixedAsset.count({ where }),
  ])
  return NextResponse.json({ assets, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  if (!body.name || !body.assetNumber || !body.purchaseCost || !body.usefulLifeYears) {
    return NextResponse.json({ error: 'name, assetNumber, purchaseCost, usefulLifeYears required' }, { status: 400 })
  }

  const asset = await (sdb.fixedAsset as any).create({
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
}, 'accounting')
