import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const shiftId = req.nextUrl.searchParams.get('shiftId')
  if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })
  const expenses = await db.expense.findMany({
    where: { shiftId },
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(expenses)
}, 'pos')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { shiftId, supplierId, amount, paymentMethod, description, invoiceNumber, notes } = await req.json()
    if (!shiftId || !amount || !paymentMethod || !description) {
      return NextResponse.json({ error: 'shiftId, amount, paymentMethod, description required' }, { status: 400 })
    }
    const expense = await db.$transaction(async (tx) => {
      const e = await tx.expense.create({
        data: { shiftId, supplierId, amount, paymentMethod, description, invoiceNumber, notes },
      })
      await tx.shift.update({
        where: { id: shiftId },
        data: { totalExpenses: { increment: amount } },
      })
      return e
    })
    return NextResponse.json(expense)
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}, 'pos')
