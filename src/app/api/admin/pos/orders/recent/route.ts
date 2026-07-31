import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const GET = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const shiftId = searchParams.get('shiftId')
  const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '10') || 10))

  const orders = await sdb.order.findMany({
    where: shiftId
      ? { shiftId, ...(admin.branchId ? { shift: { branchId: admin.branchId } } : {}) }
      : admin.branchId
        ? { shift: { branchId: admin.branchId } }
        : undefined,
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
}, 'pos')