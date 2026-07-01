import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'month'
    const branchId = req.nextUrl.searchParams.get('branchId') || undefined
    const customStart = req.nextUrl.searchParams.get('customStart') || undefined
    const customEnd = req.nextUrl.searchParams.get('customEnd') || undefined

    const now = new Date()
    let start = new Date(now)
    let end = new Date(now)

    if (customStart && customEnd) {
      start = new Date(customStart)
      start.setHours(0, 0, 0, 0)
      end = new Date(customEnd)
      end.setHours(23, 59, 59, 999)
    } else {
      switch (period) {
        case 'day': {
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          break
        }
        case 'week': {
          const day = start.getDay()
          const diff = start.getDate() - day + (day === 0 ? -6 : 1)
          start.setDate(diff)
          start.setHours(0, 0, 0, 0)
          end.setDate(start.getDate() + 6)
          end.setHours(23, 59, 59, 999)
          break
        }
        case 'month': {
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          end.setMonth(end.getMonth() + 1, 0)
          end.setHours(23, 59, 59, 999)
          break
        }
        case 'year': {
          start.setMonth(0, 1)
          start.setHours(0, 0, 0, 0)
          end.setMonth(11, 31)
          end.setHours(23, 59, 59, 999)
          break
        }
      }
    }

    const where: any = { createdAt: { gte: start, lte: end } }
    if (branchId) where.branchId = branchId

    const [expenses, totalAgg] = await Promise.all([
      db.expense.findMany({
        where,
        include: { branch: { select: { name: true } }, supplier: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.expense.aggregate({ where, _sum: { amount: true } }),
    ])

    const byMethod: Record<string, number> = {}
    for (const e of expenses) {
      byMethod[e.paymentMethod] = (byMethod[e.paymentMethod] || 0) + e.amount
    }

    return NextResponse.json({
      expenses,
      totalExpenses: totalAgg._sum.amount || 0,
      count: expenses.length,
      byMethod,
    })
  } catch (e) {
    console.error('Expenses GET error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { amount, description, paymentMethod, branchId, supplierId, invoiceNumber, notes } = await req.json()
    if (!amount || !description || !paymentMethod) {
      return NextResponse.json({ error: 'Amount, description, and payment method required' }, { status: 400 })
    }
    const expense = await db.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        paymentMethod,
        branchId: branchId || null,
        supplierId: supplierId || null,
        invoiceNumber: invoiceNumber || null,
        notes: notes || null,
      },
    })
    return NextResponse.json({ ok: true, expense })
  } catch (e) {
    console.error('Expenses POST error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Expenses DELETE error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
