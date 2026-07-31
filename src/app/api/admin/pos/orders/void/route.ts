import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { generateReturnNumber } from '@/lib/pos-utils'

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { orderId, reason } = await req.json()
    if (!orderId) return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })

    const order = await sdb.order.findFirst({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true } } } },
        shift: { select: { branchId: true } },
      },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Order is already voided' }, { status: 400 })
    if (admin.branchId && order.shift?.branchId !== admin.branchId) {
      return NextResponse.json({ error: 'Order does not belong to this branch' }, { status: 403 })
    }

    await sdb.$transaction(async (tx) => {
      const shift = order.shiftId ? await tx.shift.findUnique({ where: { id: order.shiftId } }) : null
      const branchId = shift?.branchId

      for (const item of order.items) {
        if (branchId) {
          await tx.branchStock.upsert({
            where: { branchId_productId: { branchId, productId: item.productId } },
            create: { branchId, productId: item.productId, quantity: item.quantity } as any,
            update: { quantity: { increment: item.quantity } },
          })
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
          } as any,
        })
      }

      const cancelled = await tx.order.updateMany({
        where: { id: orderId, status: { not: 'cancelled' } },
        data: { status: 'cancelled', notes: reason || null },
      })
      if (cancelled.count !== 1) return

      await tx.return.create({
        data: {
          orderId: order.id,
          shiftId: order.shiftId,
          returnNumber: generateReturnNumber(),
          reason: reason || 'other',
          refundMethod: order.paymentMethod === 'split' ? 'cash' : order.paymentMethod,
          refundAmount: order.totalAmount,
          notes: `POS void — ${reason || 'no reason provided'}`,
          restocked: true,
          processedByName: admin.name || 'POS User',
          items: {
            create: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              refundAmount: item.quantity * item.price,
            })),
          },
        } as any,
      })
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Void order error:', err)
    return NextResponse.json({ error: 'Failed to void order' }, { status: 500 })
  }
}, 'pos')
