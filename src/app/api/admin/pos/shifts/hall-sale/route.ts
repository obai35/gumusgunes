import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const shiftId = req.nextUrl.searchParams.get('shiftId')
    if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })

    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 404 })

    const orders = await prisma.order.findMany({ where: { shiftId } })
    const expenses = await prisma.expense.findMany({ where: { shiftId } })
    const returns = await prisma.return.findMany({ where: { shiftId } })

    const incomeByMethod: Record<string, number> = {
      cash: 0,
      card: 0,
      split: 0,
      bank_transfer: 0,
      instapay: 0,
      wallet: 0,
    }

    for (const order of orders) {
      const method = order.paymentMethod
      if (method === 'split') {
        incomeByMethod.cash += order.cashAmount || 0
        incomeByMethod.card += order.cardAmount || 0
      } else if (method in incomeByMethod) {
        incomeByMethod[method] += order.totalAmount
      }
    }

    const refundsByMethod: Record<string, number> = {}
    for (const ret of returns) {
      const method = ret.refundMethod
      refundsByMethod[method] = (refundsByMethod[method] || 0) + ret.refundAmount
    }

    const expensesByMethod: Record<string, number> = {}
    for (const expense of expenses) {
      const method = expense.paymentMethod
      expensesByMethod[method] = (expensesByMethod[method] || 0) + expense.amount
    }

    const totalIncome = Object.values(incomeByMethod).reduce((s, v) => s + v, 0)
    const totalRefunds = Object.values(refundsByMethod).reduce((s, v) => s + v, 0)
    const totalExpenses = Object.values(expensesByMethod).reduce((s, v) => s + v, 0)
    const netTotal = totalIncome - totalRefunds - totalExpenses
    const expectedCash = shift.startingCash + (incomeByMethod.cash || 0) - (refundsByMethod.cash || 0) - (expensesByMethod.cash || 0)
    const actualEndingCash = shift.endingCash || 0
    const difference = actualEndingCash - expectedCash

    return NextResponse.json({
      shift: {
        id: shift.id,
        startedAt: shift.startedAt,
        closedAt: shift.closedAt,
        startingCash: shift.startingCash,
        endingCash: shift.endingCash,
        orderCount: orders.length,
        isOpen: shift.isOpen,
      },
      incomeByMethod,
      refundsByMethod,
      expensesByMethod,
      totalIncome,
      totalRefunds,
      totalExpenses,
      netTotal,
      expectedCash,
      actualEndingCash,
      difference,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hall sale data' }, { status: 500 })
  }
}
