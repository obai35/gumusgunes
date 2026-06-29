import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const { shiftId, endingCash, notes } = await req.json()
    if (!shiftId || endingCash === undefined) {
      return NextResponse.json({ error: 'shiftId and endingCash are required' }, { status: 400 })
    }

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 })

    const orders = await prisma.order.findMany({ where: { shiftId } })

    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalCash = orders.reduce((sum, o) => sum + (o.cashAmount || 0), 0)
    const totalCard = orders.reduce((sum, o) => sum + (o.cardAmount || 0), 0)
    const orderCount = orders.length

    const updated = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        isOpen: false,
        closedAt: new Date(),
        endingCash,
        totalSales,
        totalCash,
        totalCard,
        orderCount,
        notes: notes || null,
      },
    })

    return NextResponse.json({ ok: true, shift: updated })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to close shift' }, { status: 500 })
  }
}
