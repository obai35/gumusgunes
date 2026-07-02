import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: Request) => {
  try {
    const { shiftId, endingCash, notes } = await req.json()
    if (!shiftId || endingCash === undefined) {
      return NextResponse.json({ error: 'shiftId and endingCash are required' }, { status: 400 })
    }

    const shift = await db.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is already closed' }, { status: 400 })

    const orders = await db.order.findMany({ where: { shiftId } })

    const totalSales = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalCash = orders.reduce((sum, o) => sum + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0)
    const totalCard = orders.reduce((sum, o) => sum + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0)
    const totalBankTransfer = orders.filter((o) => o.paymentMethod === 'bank_transfer').reduce((sum, o) => sum + o.totalAmount, 0)
    const totalInstapay = orders.filter((o) => o.paymentMethod === 'instapay').reduce((sum, o) => sum + o.totalAmount, 0)
    const totalWallet = orders.filter((o) => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.totalAmount, 0)
    const totalExpenses = await db.expense.aggregate({ where: { shiftId }, _sum: { amount: true } }).then(r => r._sum.amount || 0)
    const orderCount = orders.length

    const updated = await db.shift.update({
      where: { id: shiftId },
      data: {
        isOpen: false,
        closedAt: new Date(),
        endingCash,
        totalSales,
        totalCash,
        totalCard,
        totalBankTransfer,
        totalInstapay,
        totalWallet,
        totalExpenses,
        orderCount,
        notes: notes || null,
      },
    })

    return NextResponse.json({ ok: true, shift: updated })
  } catch {
    return NextResponse.json({ error: 'Failed to close shift' }, { status: 500 })
  }
}, 'pos')
