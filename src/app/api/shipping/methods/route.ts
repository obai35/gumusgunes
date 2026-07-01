import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const governorateId = url.searchParams.get('governorateId')
  if (!governorateId) return NextResponse.json({ error: 'governorateId is required' }, { status: 400 })

  const rates = await db.shippingRate.findMany({
    where: { governorateId, method: { isActive: true } },
    include: { method: { select: { id: true, name: true, estimatedDays: true } } },
    orderBy: { price: 'asc' },
  })
  const methods = rates.map(r => ({
    id: r.method.id,
    name: r.method.name,
    estimatedDays: r.method.estimatedDays,
    price: r.price,
  }))
  return NextResponse.json({ methods })
}
