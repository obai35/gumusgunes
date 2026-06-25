import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { items, discountCode } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })

    const products = await prisma.product.findMany({ where: { id: { in: items.map((i: any) => i.productId) } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    let subtotal = 0
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
      subtotal += product.price * item.quantity
    }

    let discountAmount = 0
    let appliedDiscount: any = null
    if (discountCode) {
      appliedDiscount = await prisma.discount.findUnique({ where: { code: discountCode } })
      if (!appliedDiscount || !appliedDiscount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
      if (appliedDiscount.expiresAt && new Date(appliedDiscount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
      if (appliedDiscount.usageLimit && appliedDiscount.usedCount >= appliedDiscount.usageLimit) return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 })
      discountAmount = appliedDiscount.type === 'PERCENTAGE' ? subtotal * (appliedDiscount.value / 100) : appliedDiscount.value
    }

    const total = Math.max(0, subtotal - discountAmount)

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const product = productMap.get(item.productId)!
        await tx.product.update({ where: { id: item.productId }, data: { stock: { decrement: item.quantity } } })
        await tx.inventoryLog.create({
          data: { productId: item.productId, change: -item.quantity, type: 'SALE', note: 'POS sale' },
        })
      }

      if (appliedDiscount) {
        await tx.discount.update({ where: { id: appliedDiscount.id }, data: { usedCount: { increment: 1 } } })
      }

      return tx.order.create({
        data: {
          items: JSON.stringify(items),
          total,
          subtotal,
          discount: discountAmount,
          discountCode: discountCode || null,
          status: 'confirmed',
          paymentMethod: 'pos',
          customerName: 'Walk-in Customer',
          customerEmail: 'pos@gumusgunes.com',
          shippingAddress: 'In-store purchase',
        },
      })
    })

    return NextResponse.json({ orderId: order.id, total: order.total })
  } catch (err) {
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
