import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'day'

    const now = new Date()
    let from: Date
    if (period === 'week') {
      from = new Date(now)
      from.setDate(from.getDate() - from.getDay())
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setHours(0, 0, 0, 0)
    }

    const branches = await db.branch.findMany({
      include: {
        shifts: {
          where: { startedAt: { gte: from } },
          include: { orders: { select: { id: true, totalAmount: true, paymentMethod: true, cashAmount: true, cardAmount: true, status: true } } },
        },
      },
    })

    const result = branches.map((branch) => {
      const orders = branch.shifts.flatMap((s: any) => s.orders).filter((o: any) => o.status !== 'cancelled')
      const totalRevenue = orders.reduce((sum: number, o: any) => sum + o.totalAmount, 0)
      const orderCount = orders.length
      const cashTotal = orders.reduce((sum: number, o: any) => sum + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0)
      const cardTotal = orders.reduce((sum: number, o: any) => sum + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0)
      const otherTotal = orders.filter((o: any) => !['cash', 'card', 'split'].includes(o.paymentMethod)).reduce((sum: number, o: any) => sum + o.totalAmount, 0)

      return {
        id: branch.id,
        name: branch.name,
        totalRevenue,
        orderCount,
        cashTotal,
        cardTotal,
        otherTotal,
      }
    })

    return NextResponse.json({ branches: result, period })
  } catch (e) {
    console.error('Branches GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch branch data' }, { status: 500 })
  }
}, 'accounting')
