import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const shiftId = searchParams.get('shiftId')
  const limit = Math.min(20, parseInt(searchParams.get('limit') || '10'))

  const orders = await sdb.order.findMany({
    where: shiftId ? { shiftId } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      orderNumber: true,
      receiptNumber: true,
      totalAmount: true,
      paymentMethod: true,
      paymentStatus: true,
      status: true,
      createdAt: true,
      items: {
        take: 3,
        select: { id: true, quantity: true, price: true, product: { select: { name: true } } },
      },
    },
  })

  return NextResponse.json({ ok: true, orders })
})