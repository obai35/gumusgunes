import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function generateReceiptNumber(): string {
  const now = new Date()
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const seq = crypto.randomUUID().slice(0, 6).toUpperCase()
  return `R-${datePart}-${seq}`
}

export async function POST(req: Request) {
  try {
    const { items, discountCode, paymentMethod, cashAmount, cardAmount, shiftId } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    if (!paymentMethod) return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })

    if (!shiftId) return NextResponse.json({ error: 'An open shift is required to process sales' }, { status: 400 })
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 400 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })

    const products = await prisma.product.findMany({ where: { id: { in: items.map((i: any) => i.productId) } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    let subtotal = 0
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}` }, { status: 400 })
      subtotal += product.price * item.quantity
    }

    let discountAmount = 0
    let appliedDiscount: any = null
    if (discountCode) {
      appliedDiscount = await prisma.discount.findUnique({ where: { code: discountCode } })
      if (!appliedDiscount || !appliedDiscount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
      if (appliedDiscount.expiresAt && new Date(appliedDiscount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
      if (appliedDiscount.maxUses && appliedDiscount.usedCount >= appliedDiscount.maxUses) return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 })

      let eligibleSubtotal = subtotal
      if (appliedDiscount.appliesTo !== 'all' && appliedDiscount.targetValue && items?.length) {
        const target = appliedDiscount.targetValue.toLowerCase()
        const productsWithCat = await prisma.product.findMany({
          where: { id: { in: items.map((i: any) => i.productId) } },
          include: { category: { select: { name: true, parent: { select: { name: true } } } } },
        })
        const productCatMap = new Map(productsWithCat.map(p => [p.id, p]))
        eligibleSubtotal = 0
        for (const item of items) {
          const product = productCatMap.get(item.productId)
          if (!product) continue
          if (appliedDiscount.appliesTo === 'category') {
            const catName = product.category.name.toLowerCase()
            const parentName = (product.category as any).parent?.name?.toLowerCase()
            if (catName === target || parentName === target) eligibleSubtotal += product.price * item.quantity
          } else if (appliedDiscount.appliesTo === 'tag') {
            const tags: string[] = JSON.parse(product.tags || '[]')
            if (tags.some(t => t.toLowerCase().includes(target))) eligibleSubtotal += product.price * item.quantity
          }
        }
      }
      discountAmount = appliedDiscount.type === 'PERCENTAGE' ? eligibleSubtotal * (appliedDiscount.value / 100) : Math.min(appliedDiscount.value, eligibleSubtotal)
    }

    const total = Math.max(0, subtotal - discountAmount)

    if (paymentMethod === 'split') {
      const cash = cashAmount || 0
      const card = cardAmount || 0
      if (Math.abs((cash + card) - total) > 0.01) {
        return NextResponse.json({ error: `Split amounts ($${cash.toFixed(2)} + $${card.toFixed(2)} = $${(cash + card).toFixed(2)}) must equal total $${total.toFixed(2)}` }, { status: 400 })
      }
    }

    const orderNumber = `P-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
    const receiptNumber = generateReceiptNumber()

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
          orderNumber,
          receiptNumber,
          shiftId: shiftId || undefined,
          email: 'pos@gumusgunes.com',
          fullName: 'Walk-in Customer',
          address: 'In-store purchase',
          city: '-',
          postalCode: '-',
          country: 'EG',
          totalAmount: total,
          subtotal,
          shipping: 0,
          tax: 0,
          discountAmount: discountAmount || null,
          discountId: appliedDiscount?.id || null,
          status: 'confirmed',
          paymentMethod,
          cashAmount: cashAmount || null,
          cardAmount: cardAmount || null,
          paymentStatus: 'paid',
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
              }
            }),
          },
        },
      })
    })

    const fullOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    })
    return NextResponse.json({ orderId: fullOrder!.id, total: fullOrder!.totalAmount, order: fullOrder })
  } catch (err) {
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
