import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { orderId, reason } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

    const order = await sdb.order.findFirst({
      where: { id: orderId },
      include: { items: { include: { product: { select: { id: true } } } } },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Order is already voided' }, { status: 400 })

    await sdb.$transaction(async (tx) => {
      const shift = order.shiftId ? await tx.shift.findUnique({ where: { id: order.shiftId } }) : null
      const branchId = shift?.branchId

      for (const item of order.items) {
        if (branchId) {
          const existing = await tx.branchStock.findUnique({
            where: { branchId_productId: { branchId, productId: item.productId } },
          })
          if (existing) {
            await tx.branchStock.update({
              where: { branchId_productId: { branchId, productId: item.productId } },
              data: { quantity: { increment: item.quantity } },
            })
          }
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            type: 'RETURN',
            change: item.quantity,
            note: `Voided order ${order.orderNumber}${reason ? ` — ${reason}` : ''}`,
          },
        })
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled', notes: reason || null },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Void order error:', err)
    return NextResponse.json({ error: 'Failed to void order' }, { status: 500 })
  }
}, 'pos')
