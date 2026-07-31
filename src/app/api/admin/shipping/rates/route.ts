import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const [rates, methods, governorates] = await Promise.all([
    sdb.shippingRate.findMany(),
    sdb.shippingMethod.findMany({ where: { isActive: true } }),
    sdb.governorate.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ rates, methods, governorates })
}, 'shipping')

export const PUT = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { rates } = await req.json()
  // rates: Array<{ methodId: string; governorateId: string; price: number }>
  await sdb.$transaction(async (tx) => {
    for (const r of rates) {
      await tx.shippingRate.upsert({
        where: { methodId_governorateId: { methodId: r.methodId, governorateId: r.governorateId } },
        update: { price: r.price },
        create: { methodId: r.methodId, governorateId: r.governorateId, price: r.price } as any,
      })
    }
  })
  return NextResponse.json({ ok: true })
}, 'shipping')
