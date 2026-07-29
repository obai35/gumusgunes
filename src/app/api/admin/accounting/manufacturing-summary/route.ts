import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)

  const totalOrders = await sdb.productionOrder.count()
  const inProgress = await sdb.productionOrder.count({ where: { status: 'in_progress' } })
  const completed = await sdb.productionOrder.count({ where: { status: 'completed' } })
  const draft = await sdb.productionOrder.count({ where: { status: 'draft' } })

  const activeOrders = await sdb.productionOrder.findMany({
    where: { status: 'in_progress' },
    include: { product: true, materials: true, laborEntries: true },
  })

  const totalActualCost = activeOrders.reduce((s, o) => s + o.actualMaterialCost + o.actualLaborCost + o.actualOverheadCost, 0)
  const totalStandardCost = activeOrders.reduce((s, o) => s + o.standardCost, 0)

  return NextResponse.json({
    totalOrders,
    inProgress,
    completed,
    draft,
    activeOrders: activeOrders.length,
    totalActualCost,
    totalStandardCost,
    variance: totalStandardCost > 0 ? ((totalActualCost - totalStandardCost) / totalStandardCost * 100) : 0,
  })
})
