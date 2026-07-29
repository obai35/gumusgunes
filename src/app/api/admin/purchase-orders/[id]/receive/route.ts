import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: NextRequest, { params, admin }: { params: Promise<{ id: string }>; admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const { id } = await params
  const { items } = await req.json()

  const po = await sdb.purchaseOrder.findUnique({ where: { id }, include: { items: true } })
  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (po.status === 'cancelled') return NextResponse.json({ error: 'PO is cancelled' }, { status: 400 })
  if (po.status === 'received') return NextResponse.json({ error: 'PO already fully received' }, { status: 400 })

  const result = await sdb.$transaction(async tx => {
    for (const item of items) {
      const poi = po.items.find(i => i.id === item.id)
      if (!poi) continue
      const newReceived = poi.received + item.received
      if (newReceived > poi.quantity) throw new Error(`Receiving ${newReceived} exceeds order quantity ${poi.quantity} for item ${poi.id}`)

      await tx.purchaseOrderItem.update({
        where: { id: poi.id },
        data: { received: newReceived },
      })

      await tx.product.update({
        where: { id: poi.productId },
        data: { stock: { increment: item.received } },
      })

      await tx.inventoryLog.create({
        data: {
          productId: poi.productId,
          type: 'PURCHASE',
          change: item.received,
          note: `PO ${po.poNumber} received ${item.received} units`,
        },
      })
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { poId: id } })
    const allReceived = updatedItems.every(i => i.received >= i.quantity)
    const anyReceived = updatedItems.some(i => i.received > 0)
    const status = allReceived ? 'received' : anyReceived ? 'partial' : 'pending'

    await tx.purchaseOrder.update({ where: { id }, data: { status } })

    return tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    })
  })

  return NextResponse.json({ ok: true, purchaseOrder: result })
}, 'inventory')
