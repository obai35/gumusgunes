import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { VALID_PAYMENT_METHODS, generateReceiptNumber, formatEGP } from '@/lib/pos-utils'

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { items, paymentMethod, notes, shiftId, cashAmount, cardAmount, fullName } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 })
    }
    if (!shiftId) return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })

    const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 400 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })
    const branchId = shift.branchId

    const products = await sdb.product.findMany({ where: { id: { in: items.map((i: any) => i.productId) } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const branchStocks = await sdb.branchStock.findMany({ where: { branchId, productId: { in: items.map((i: any) => i.productId) } } })
    const branchStockMap = new Map(branchStocks.map((bs) => [bs.productId, bs.quantity]))

    let totalAmount = 0
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      const qty = item.quantity || 1
      const branchQty = branchStockMap.get(item.productId) || 0
      if (branchQty < qty) return NextResponse.json({ error: `Insufficient stock at branch for ${product.name}. Branch: ${branchQty}, requested: ${qty}` }, { status: 400 })
      const price = item.price || product.price
      totalAmount += price * qty
    }

    if (paymentMethod === 'split') {
      const cash = cashAmount || 0
      const card = cardAmount || 0
      if (Math.abs((cash + card) - totalAmount) > 0.01) {
        return NextResponse.json({ error: `Split amounts must equal total ${formatEGP(totalAmount)}` }, { status: 400 })
      }
    }

    const orderNumber = `P-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
    const receiptNumber = generateReceiptNumber()

    const order = await sdb.$transaction(async (tx) => {
      for (const item of items) {
        const qty = item.quantity || 1
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId, productId: item.productId } },
          create: { branchId, productId: item.productId, quantity: 0 },
          update: { quantity: { decrement: qty } },
        })
        await tx.inventoryLog.create({
          data: { productId: item.productId, change: -qty, type: 'SALE', note: `Manual POS order - Branch ${branchId}` },
        })
      }

      return tx.order.create({
        data: {
          orderNumber,
          receiptNumber,
          shiftId,
          email: 'pos@gumusgunes.com',
          fullName: fullName || 'Walk-in Customer',
          address: 'In-store purchase',
          city: '-',
          postalCode: '-',
          country: 'EG',
          totalAmount,
          subtotal: totalAmount,
          shipping: 0,
          tax: 0,
          status: 'confirmed',
          paymentMethod,
          cashAmount: cashAmount || null,
          cardAmount: cardAmount || null,
          paymentStatus: 'paid',
          notes: notes || null,
          items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!
              const qty = item.quantity || 1
              const price = item.price || product.price
              return { productId: item.productId, quantity: qty, price }
            }),
          },
        },
      })
    })

    const fullOrder = await sdb.order.findFirst({
      where: { id: order.id },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    })
    return NextResponse.json({ orderId: fullOrder!.id, total: fullOrder!.totalAmount, order: fullOrder })
  } catch {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}, 'pos')
