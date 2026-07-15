import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = sp.get('month') ? parseInt(sp.get('month')!) : undefined

    const where: any = { year }
    if (month) where.month = month

    const budgets = await db.budget.findMany({
      where,
      orderBy: [{ month: 'asc' }, { accountCode: 'asc' }],
    })

    const byMonth: Record<number, { month: number; budgets: typeof budgets; total: number }> = {}
    for (const b of budgets) {
      if (!byMonth[b.month]) byMonth[b.month] = { month: b.month, budgets: [], total: 0 }
      byMonth[b.month].budgets.push(b)
      byMonth[b.month].total += b.amount
    }

    return NextResponse.json({ budgets, byMonth: Object.values(byMonth).sort((a, b) => a.month - b.month) })
  } catch (e) {
    console.error('Budgets GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { accountCode, month, year, amount } = await req.json()
    if (!accountCode || !month || !year || amount === undefined) {
      return NextResponse.json({ error: 'accountCode, month, year, amount required' }, { status: 400 })
    }

    const budget = await db.budget.upsert({
      where: { accountCode_month_year: { accountCode, month, year } },
      update: { amount },
      create: { accountCode, month, year, amount },
    })

    return NextResponse.json({ budget })
  } catch (e) {
    console.error('Budgets POST error:', e)
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
  }
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.budget.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Budgets DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}, 'accounting')
