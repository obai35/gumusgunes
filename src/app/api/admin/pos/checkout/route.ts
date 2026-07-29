import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { VALID_PAYMENT_METHODS, generateReceiptNumber } from '@/lib/pos-utils'

export const POST = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { items, discountCode, paymentMethod, cashAmount, cardAmount, shiftId, customerId, customerName, customerEmail, customerPhone, notes, taxRate, taxAmount } = await req.json()
    if (!items?.length) return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 })
    }

    if (!shiftId) return NextResponse.json({ error: 'An open shift is required to process sales' }, { status: 400 })
    const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 400 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })
    const branchId = shift.branchId

    const products = await sdb.product.findMany({ where: { id: { in: items.map((i: any) => i.productId ) } } })
    const productMap = new Map(products.map((p) => [p.id, p]))

    const branchStocks = await sdb.branchStock.findMany({ where: { branchId, productId: { in: items.map((i: any) => i.productId) } } })
    const branchStockMap = new Map(branchStocks.map((bs) => [bs.productId, bs.quantity]))

    let subtotal = 0
    let totalItemDiscount = 0
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      const branchQty = branchStockMap.get(item.productId) || 0
      if (branchQty < item.quantity) return NextResponse.json({ error: `Insufficient stock at branch for ${product.name}. Branch: ${branchQty}, requested: ${item.quantity}` }, { status: 400 })
      subtotal += product.price * item.quantity
      totalItemDiscount += (item.discount || 0)
    }

    let discountAmount = 0
    let appliedDiscount: any = null
    if (discountCode) {
      appliedDiscount = await sdb.discount.findFirst({ where: { code: discountCode } })
      if (!appliedDiscount || !appliedDiscount.isActive) return NextResponse.json({ error: 'Invalid discount code' }, { status: 400 })
      if (appliedDiscount.expiresAt && new Date(appliedDiscount.expiresAt) < new Date()) return NextResponse.json({ error: 'Discount code expired' }, { status: 400 })
      if (appliedDiscount.maxUses && appliedDiscount.usedCount >= appliedDiscount.maxUses) return NextResponse.json({ error: 'Discount code usage limit reached' }, { status: 400 })

      let eligibleSubtotal = subtotal
      if (appliedDiscount.appliesTo !== 'all' && appliedDiscount.targetValue && items?.length) {
        const target = appliedDiscount.targetValue.toLowerCase()
        const productsWithCat = await sdb.product.findMany({
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

    const total = Math.max(0, subtotal - totalItemDiscount - discountAmount)

    if (paymentMethod === 'split') {
      const cash = cashAmount || 0
      const card = cardAmount || 0
      if (Math.abs((cash + card) - total) > 0.01) {
        return NextResponse.json({ error: `Split amounts (${cash.toFixed(2)} E£ + ${card.toFixed(2)} E£ = ${(cash + card).toFixed(2)} E£) must equal total ${total.toFixed(2)} E£` }, { status: 400 })
      }
    }

    let resolvedName = 'Walk-in Customer'
    let resolvedEmail = 'pos@gumusgunes.com'
    let resolvedPhone: string | null = null
    let resolvedUserId: string | null = null

    if (customerId) {
      const user = await sdb.user.findFirst({ where: { id: customerId } })
      if (user) {
        resolvedName = user.name
        resolvedEmail = user.email
        resolvedPhone = user.phone
        resolvedUserId = user.id
      }
    } else if (customerName && customerEmail) {
      resolvedName = customerName
      resolvedEmail = customerEmail
      resolvedPhone = customerPhone || null
    }

    const orderNumber = `P-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`
    const receiptNumber = generateReceiptNumber()

    const order = await sdb.$transaction(async (tx) => {
      for (const item of items) {
        await tx.branchStock.upsert({
          where: { branchId_productId: { branchId, productId: item.productId } },
          create: { branchId, productId: item.productId, quantity: 0 },
          update: { quantity: { decrement: item.quantity } },
        })
        await tx.inventoryLog.create({
          data: { productId: item.productId, change: -item.quantity, type: 'SALE', note: `POS sale - Branch ${branchId}` },
        })
      }

      if (appliedDiscount) {
        await tx.discount.update({ where: { id: appliedDiscount.id }, data: { usedCount: { increment: 1 } } })
      }

      return tx.order.create({
        data: {
          orderNumber,
          receiptNumber,
          shiftId,
          userId: resolvedUserId,
          email: resolvedEmail,
          fullName: resolvedName,
          phone: resolvedPhone,
          address: 'In-store purchase',
          city: '-',
          postalCode: '-',
          country: 'EG',
          totalAmount: total,
          subtotal,
          shipping: 0,
          tax: taxAmount ?? 0,
          discountAmount: (discountAmount + totalItemDiscount) || null,
          discountId: appliedDiscount?.id || null,
          status: 'confirmed',
          paymentMethod,
          cashAmount: paymentMethod === 'split' ? (cashAmount || 0) : (paymentMethod === 'cash' ? total : null),
          cardAmount: paymentMethod === 'split' ? (cardAmount || 0) : (paymentMethod === 'card' ? total : null),
          notes: notes || null,
          paymentStatus: 'paid',
            items: {
            create: items.map((item: any) => {
              const product = productMap.get(item.productId)!
              return {
                productId: item.productId,
                quantity: item.quantity,
                price: product.price,
                discount: item.discount || 0,
              }
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
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}, 'pos')

export const PUT = withAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { orderId, action, items: returnItems, fullReturn, reason, refundMethod, cashRefundAmount, cardRefundAmount } = await req.json()
    if (!orderId || action !== 'return') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const order = await sdb.order.findFirst({
      where: { id: orderId },
      include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } }, shift: { select: { branchId: true } } },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Order already returned' }, { status: 400 })

    const branchId = order.shift?.branchId
    let totalRefund = 0
    const returnedItems: Array<{ productId: string; productName: string; quantity: number; refundAmount: number }> = []

    const branch = branchId ? await sdb.branch.findFirst({ where: { id: branchId }, select: { name: true } }) : null

    const returnRecord = await sdb.$transaction(async (tx) => {
      for (const ri of returnItems || []) {
        const orderItem = order.items.find(i => i.id === ri.itemId)
        if (!orderItem) continue
        const returnQty = Math.min(ri.quantity, orderItem.quantity)
        if (returnQty <= 0) continue

        const priceAfterDiscount = orderItem.price - (orderItem.discount ?? 0)
        const refundForItem = priceAfterDiscount * returnQty
        totalRefund += refundForItem

        if (branchId) {
          await tx.branchStock.upsert({
            where: { branchId_productId: { branchId, productId: orderItem.productId } },
            create: { branchId, productId: orderItem.productId, quantity: returnQty },
            update: { quantity: { increment: returnQty } },
          })
        } else {
          await tx.product.update({
            where: { id: orderItem.productId },
            data: { stock: { increment: returnQty } },
          })
        }

        await tx.inventoryLog.create({
          data: {
            productId: orderItem.productId,
            type: 'RETURN',
            change: returnQty,
            note: `POS return - Order ${order.orderNumber}`,
          },
        })

        const remaining = orderItem.quantity - returnQty
        if (remaining <= 0) {
          await tx.orderItem.delete({ where: { id: orderItem.id } })
        } else {
          await tx.orderItem.update({
            where: { id: orderItem.id },
            data: { quantity: remaining },
          })
        }

        returnedItems.push({ productId: orderItem.productId, productName: orderItem.product.name, quantity: returnQty, refundAmount: refundForItem })
      }

      const updatedItems = await tx.orderItem.findMany({
        where: { orderId },
        include: { product: { select: { id: true, name: true, sku: true } } },
      })
      const newTotal = updatedItems.reduce((sum, i) => sum + (i.price - (i.discount ?? 0)) * i.quantity, 0)
      const newRefunded = (order.refundedAmount || 0) + totalRefund

      const data: any = { refundedAmount: newRefunded }
      if (fullReturn) data.status = 'cancelled'
      if (updatedItems.length > 0 && !fullReturn) data.totalAmount = newTotal

      await tx.order.update({ where: { id: orderId }, data })

      if (updatedItems.length === 0) {
        await tx.order.update({ where: { id: orderId }, data: { status: 'cancelled', totalAmount: 0 } })
      }

      const returnNumber = `RET-${order.orderNumber}`
      const notes = refundMethod === 'split' && cashRefundAmount !== undefined && cardRefundAmount !== undefined
        ? `Split refund: EGP ${cashRefundAmount.toFixed(2)} cash, EGP ${cardRefundAmount.toFixed(2)} card`
        : null
      return tx.return.create({
        data: {
          orderId,
          shiftId: order.shiftId || undefined,
          returnNumber,
          reason: reason || 'customer_change',
          refundMethod: refundMethod || order.paymentMethod,
          refundAmount: totalRefund,
          restocked: true,
          notes,
          processedByName: 'POS User',
          items: {
            create: returnedItems.map(ri => ({
              productId: ri.productId,
              quantity: ri.quantity,
              refundAmount: ri.refundAmount,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
          order: { select: { receiptNumber: true, orderNumber: true } },
        },
      })
    })

    return NextResponse.json({
      ok: true,
      returnData: {
        id: returnRecord.id,
        returnNumber: returnRecord.returnNumber,
        reason: returnRecord.reason,
        refundMethod: returnRecord.refundMethod,
        refundAmount: returnRecord.refundAmount,
        createdAt: returnRecord.createdAt.toISOString(),
        items: returnRecord.items.map(ri => ({
          product: { name: ri.product.name },
          quantity: ri.quantity,
          refundAmount: ri.refundAmount,
        })),
        notes: returnRecord.notes || undefined,
        order: { receiptNumber: returnRecord.order.receiptNumber || '' },
        processedBy: { name: returnRecord.processedByName || 'POS User' },
      },
      branchName: branch?.name || 'Branch',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to return order' }, { status: 500 })
  }
}, 'pos')
