import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { admin, params }: any) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const totalCost = body.hours * body.rate

  const item = await sdb.productionOrderLabor.create({
    data: {
      orderId: params.id,
      hours: body.hours,
      rate: body.rate,
      totalCost,
      description: body.description,
    },
  })

  return NextResponse.json(item, { status: 201 })
})
