import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'
import { VALID_PAYMENT_METHODS } from '@/lib/pos-utils'

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const shiftId = req.nextUrl.searchParams.get('shiftId')
  if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })
  const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
  if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
  if (admin.branchId && shift.branchId !== admin.branchId) {
    return NextResponse.json({ error: 'Shift does not belong to this branch' }, { status: 403 })
  }
  const expenses = await sdb.expense.findMany({
    where: { shiftId },
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(expenses)
}, 'pos')

export const POST = withPosOrAdmin(async (req: Request, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { shiftId, supplierId, amount, paymentMethod, description, invoiceNumber, notes } = await req.json()
    if (!shiftId || amount === undefined || !paymentMethod || !description) {
      return NextResponse.json({ error: 'shiftId, amount, paymentMethod, description required' }, { status: 400 })
    }
    const validatedAmount = Number(amount)
    if (!Number.isFinite(validatedAmount) || validatedAmount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Valid payment method is required' }, { status: 400 })
    }
    const shift = await sdb.shift.findFirst({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })
    if (admin.branchId && shift.branchId !== admin.branchId) {
      return NextResponse.json({ error: 'Shift does not belong to this branch' }, { status: 403 })
    }
    const expense = await sdb.$transaction(async (tx) => {
      const e = await tx.expense.create({
        data: { shiftId, supplierId, amount: validatedAmount, paymentMethod, description, invoiceNumber, notes } as any,
      })
      await tx.shift.update({
        where: { id: shiftId },
        data: { totalExpenses: { increment: validatedAmount } },
      })
      return e
    })
    return NextResponse.json(expense)
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}, 'pos')
