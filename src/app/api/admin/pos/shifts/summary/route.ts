import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const shiftId = searchParams.get('shiftId')
    if (!shiftId) return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where: { shiftId },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, price: true, sku: true } } },
        },
      },
    })

    const cashRevenue = orders.filter((o) => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.totalAmount, 0)
    const cardRevenue = orders.filter((o) => o.paymentMethod === 'card').reduce((sum, o) => sum + o.totalAmount, 0)
    const splitRevenue = orders.filter((o) => o.paymentMethod === 'split').reduce((sum, o) => sum + o.totalAmount, 0)
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

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

    const paymentMethods = {
      cash: orders.filter((o) => o.paymentMethod === 'cash').length,
      card: orders.filter((o) => o.paymentMethod === 'card').length,
      split: orders.filter((o) => o.paymentMethod === 'split').length,
    }

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
      summary: {
        totalOrders: orders.length,
        totalRevenue,
        cashRevenue,
        cardRevenue,
        splitRevenue,
        averageOrder: orders.length > 0 ? totalRevenue / orders.length : 0,
        topProducts,
        paymentMethods,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch shift summary' }, { status: 500 })
  }
}
