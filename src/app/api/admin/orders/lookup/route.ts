import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    if (!q.trim()) return NextResponse.json({ orders: [] })

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { receiptNumber: { contains: q } },
          { orderNumber: { contains: q } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        orderNumber: true,
        receiptNumber: true,
        fullName: true,
        email: true,
        totalAmount: true,
        subtotal: true,
        discountAmount: true,
        paymentMethod: true,
        cashAmount: true,
        cardAmount: true,
        status: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ orders })
  } catch (err) {
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
