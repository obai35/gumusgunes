import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { autoAccountReturn } from '@/lib/auto-accounting'

export const POST = withAdmin(async (req, { params, admin: adminCtx }: { params: Promise<{ id: string }>, admin: any }) => {
  const sdb = storeDb(adminCtx.storeId)
  try {
    const { id } = await params
    const body = await req.json()
    const { items, reason, refundMethod, notes, processedById } = body

    if (!items?.length) return NextResponse.json({ error: 'At least one item required' }, { status: 400 })
    if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    if (!refundMethod) return NextResponse.json({ error: 'Refund method is required' }, { status: 400 })
    if (!processedById) return NextResponse.json({ error: 'Processed by is required' }, { status: 400 })

    const adminUser = await sdb.admin.findFirst({ where: { id: processedById } })
    if (!adminUser) return NextResponse.json({ error: 'Admin not found' }, { status: 400 })

    const order = await sdb.order.findFirst({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    for (const ri of items) {
      const original = order.items.find((oi) => oi.productId === ri.productId)
      if (!original) return NextResponse.json({ error: `Product ${ri.productId} not in order` }, { status: 400 })
      if (ri.quantity > original.quantity) return NextResponse.json({ error: `Cannot return more than ordered for product ${ri.productId}` }, { status: 400 })
    }

    const refundAmount = items.reduce((sum: number, ri: any) => sum + (ri.refundAmount || 0), 0)

    const result = await sdb.$transaction(async (tx) => {
      const returnCount = await tx.return.count()
      const returnNumber = `RMA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(returnCount + 1).padStart(6, '0')}`

      const ret = await tx.return.create({
        data: {
          orderId: id,
          returnNumber,
          reason,
          refundMethod,
          refundAmount,
          notes: notes || null,
          restocked: true,
          processedById,
          items: {
            create: items.map((ri: any) => ({
              productId: ri.productId,
              quantity: ri.quantity,
              refundAmount: ri.refundAmount || 0,
            })),
          },
        } as any,
        include: { items: { include: { product: { select: { name: true } } } } },
      })

      for (const ri of items) {
        await tx.product.update({
          where: { id: ri.productId },
          data: { stock: { increment: ri.quantity } },
        })
        await tx.inventoryLog.create({
          data: {
            productId: ri.productId,
            type: 'RETURN',
            change: ri.quantity,
            note: `Return ${returnNumber} - Order ${order.orderNumber}`,
          } as any,
        })
      }

      await tx.order.update({
        where: { id },
        data: { refundedAmount: { increment: refundAmount } },
      })

      return ret
    })

    autoAccountReturn(result.id).catch(console.error)

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 })
  }
}, 'orders')
