import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const hasCost = searchParams.get('hasCost') === 'true'
  const categoryId = searchParams.get('categoryId')

  const where: any = {}
  if (categoryId) where.categoryId = categoryId

  const products = await sdb.product.findMany({
    where,
    include: {
      costBreakdown: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { name: 'asc' },
  })

  let items = products.map(p => ({
    id: p.id, name: p.name, sku: p.sku, imageUrl: p.imageUrl,
    price: p.price, costPrice: p.costPrice,
    category: p.category,
    breakdown: p.costBreakdown,
    margin: p.costBreakdown?.totalCost
      ? (p.price > 0 ? Math.round(((p.price - p.costBreakdown.totalCost) / p.price) * 100 * 100) / 100 : null)
      : null,
  }))

  if (hasCost) items = items.filter(i => i.breakdown)

  return NextResponse.json(items)
}, 'pricing')
