import { NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { VALID_PAYMENT_METHODS, generateReceiptNumber, generateOrderNumber, formatEGP } from '@/lib/pos-utils'

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
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
    if (admin.branchId && shift.branchId !== admin.branchId) {
      return NextResponse.json({ error: 'Shift does not belong to this branch' }, { status: 403 })
    }
    const branchId = shift.branchId

    const validatedItems: { productId: string; quantity: number }[] = []
    for (const item of items) {
      if (!item?.productId || typeof item.productId !== 'string') {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }
      const quantity = Math.floor(Number(item.quantity))
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json({ error: 'Invalid cart item' }, { status: 400 })
      }
      validatedItems.push({ productId: item.productId, quantity })
    }

    const products = await sdb.product.findMany({ where: { id: { in: validatedItems.map((i) => i.productId) } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const branchStocks = await sdb.branchStock.findMany({ where: { branchId, productId: { in: validatedItems.map((i) => i.productId) } } })
    const branchStockMap = new Map(branchStocks.map((bs) => [bs.productId, bs.quantity]))

    let totalAmount = 0
    for (const item of validatedItems) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      const branchQty = branchStockMap.get(item.productId) || 0
      if (branchQty < item.quantity) return NextResponse.json({ error: `Insufficient stock at branch for ${product.name}. Branch: ${branchQty}, requested: ${item.quantity}` }, { status: 400 })
      totalAmount += product.price * item.quantity
    }

    if (paymentMethod === 'split') {
      const cash = Number(cashAmount) || 0
      const card = Number(cardAmount) || 0
      if (Math.abs((cash + card) - totalAmount) > 0.01) {
        return NextResponse.json({ error: `Split amounts must equal total ${formatEGP(totalAmount)}` }, { status: 400 })
      }
    }

    const orderNumber = generateOrderNumber()
    const receiptNumber = generateReceiptNumber()
    const normalizedCash = paymentMethod === 'cash' ? totalAmount : paymentMethod === 'split' ? (Number(cashAmount) || 0) : null
    const normalizedCard = paymentMethod === 'card' ? totalAmount : paymentMethod === 'split' ? (Number(cardAmount) || 0) : null

    const order = await sdb.$transaction(async (tx) => {
      for (const item of validatedItems) {
        const stockRow = await tx.branchStock.findUnique({ where: { branchId_productId: { branchId, productId: item.productId } } })
        const decrement = await tx.branchStock.updateMany({
          where: { branchId, productId: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        })
        if (decrement.count !== 1) {
          const product = productMap.get(item.productId)!
          throw new Error(`Insufficient stock at branch for ${product.name}. Branch: ${stockRow?.quantity ?? 0}, requested: ${item.quantity}`)
        }
        await tx.inventoryLog.create({
          data: { productId: item.productId, change: -item.quantity, type: 'SALE', note: `Manual POS order - Branch ${branchId}` } as any,
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
          cashAmount: normalizedCash,
          cardAmount: normalizedCard,
          paymentStatus: 'paid',
          notes: notes || null,
          items: {
            create: validatedItems.map((item) => {
              const product = productMap.get(item.productId)!
              return { productId: item.productId, quantity: item.quantity, price: product.price }
            }),
          },
        } as any,
      })
    })

    const fullOrder = await sdb.order.findFirst({
      where: { id: order.id },
      include: { items: { include: { product: { select: { name: true, sku: true } } } } },
    })
    return NextResponse.json({ orderId: fullOrder!.id, total: fullOrder!.totalAmount, order: fullOrder })
  } catch (err: any) {
    const message = err?.message || ''
    if (message.startsWith('Insufficient stock')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    console.error('Manual order error:', err)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}, 'pos')
