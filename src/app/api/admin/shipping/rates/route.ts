import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const [rates, methods, governorates] = await Promise.all([
    db.shippingRate.findMany(),
    db.shippingMethod.findMany({ where: { isActive: true } }),
    db.governorate.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ rates, methods, governorates })
}, 'shipping')

export const PUT = withAdmin(async (req) => {
  const { rates } = await req.json()
  // rates: Array<{ methodId: string; governorateId: string; price: number }>
  await db.$transaction(async (tx) => {
    for (const r of rates) {
      await tx.shippingRate.upsert({
        where: { methodId_governorateId: { methodId: r.methodId, governorateId: r.governorateId } },
        update: { price: r.price },
        create: { methodId: r.methodId, governorateId: r.governorateId, price: r.price },
      })
    }
  })
  return NextResponse.json({ ok: true })
}, 'shipping')
