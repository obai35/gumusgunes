import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url)
    const shiftId = searchParams.get('shiftId')
    if (!shiftId) return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })

    const shift = await db.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

    const [orders, returns] = await Promise.all([
      db.order.findMany({
        where: { shiftId, status: { not: 'cancelled' } },
        include: {
          items: {
            include: { product: { select: { id: true, name: true, price: true, sku: true } } },
          },
        },
      }),
      db.return.findMany({
        where: { shiftId },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    const cashRevenue = orders.filter((o) => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0)
    const cardRevenue = orders.filter((o) => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0)
    const splitRevenue = orders.filter((o) => o.paymentMethod === 'split').reduce((sum, o) => sum + o.totalAmount, 0)
    const bankTransferRevenue = orders.filter((o) => o.paymentMethod === 'bank_transfer').reduce((sum, o) => sum + o.totalAmount, 0)
    const instapayRevenue = orders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.totalAmount, 0)
    const walletRevenue = orders.filter((o) => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.totalAmount, 0)
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalReturns = returns.reduce((sum, r) => sum + r.refundAmount, 0)

    const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {}
    for (const order of orders) {
      for (const item of order.items) {
        const key = item.product.id
        if (!productCounts[key]) {
          productCounts[key] = { name: item.product.name, quantity: 0, revenue: 0 }
        }
        productCounts[key].quantity += item.quantity
        productCounts[key].revenue += item.price * item.quantity
      }
    }

    const topProducts = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    const paymentMethods: Record<string, number> = {
      cash: 0,
      card: 0,
      split: 0,
      bank_transfer: 0,
      instapay: 0,
      wallet: 0,
    }
    for (const o of orders) {
      if (paymentMethods[o.paymentMethod] !== undefined) paymentMethods[o.paymentMethod]++
    }

    const netRevenue = totalRevenue - totalReturns

    return NextResponse.json({
      shift: {
        id: shift.id,
        branchId: shift.branchId,
        startedAt: shift.startedAt,
        closedAt: shift.closedAt,
        startingCash: shift.startingCash,
        endingCash: shift.endingCash,
        totalSales: shift.totalSales,
        totalCash: shift.totalCash,
        totalCard: shift.totalCard,
        totalBankTransfer: shift.totalBankTransfer,
        totalInstapay: shift.totalInstapay,
        totalWallet: shift.totalWallet,
        totalExpenses: shift.totalExpenses,
        orderCount: shift.orderCount,
        notes: shift.notes,
        isOpen: shift.isOpen,
      },
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        cashAmount: o.cashAmount,
        cardAmount: o.cardAmount,
        createdAt: o.createdAt,
        items: o.items.map((i) => ({
          id: i.id,
          quantity: i.quantity,
          price: i.price,
          product: i.product,
        })),
      })),
      returns: returns.map((r) => ({
        id: r.id,
        returnNumber: r.returnNumber,
        reason: r.reason,
        refundMethod: r.refundMethod,
        refundAmount: r.refundAmount,
        createdAt: r.createdAt,
        processedByName: r.processedByName,
        items: r.items.map((ri) => ({
          product: ri.product,
          quantity: ri.quantity,
          refundAmount: ri.refundAmount,
        })),
      })),
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        totalReturns,
        netRevenue,
        cashRevenue,
        cardRevenue,
        splitRevenue,
        bankTransferRevenue,
        instapayRevenue,
        walletRevenue,
        averageOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
        topProducts,
        paymentMethods,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shift summary' }, { status: 500 })
  }
}, 'pos')
