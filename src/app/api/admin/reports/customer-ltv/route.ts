import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const cohortMonths = parseInt(req.nextUrl.searchParams.get('months') || '12')

    const users = await sdb.user.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const orders = await sdb.order.findMany({
      where: { userId: { not: null }, status: { not: 'cancelled' } },
      select: { userId: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const orderMap = new Map<string, { total: number; count: number; firstDate: Date }>()
    for (const o of orders) {
      if (!o.userId) continue
      const existing = orderMap.get(o.userId)
      if (existing) {
        existing.total += o.totalAmount
        existing.count++
        if (o.createdAt < existing.firstDate) existing.firstDate = o.createdAt
      } else {
        orderMap.set(o.userId, { total: o.totalAmount, count: 1, firstDate: o.createdAt })
      }
    }

    const cohorts: Record<string, { users: number; totalRevenue: number; totalOrders: number }> = {}
    for (const u of users) {
      const cohort = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!cohorts[cohort]) cohorts[cohort] = { users: 0, totalRevenue: 0, totalOrders: 0 }
      cohorts[cohort].users++
      const orderData = orderMap.get(u.id)
      if (orderData) {
        cohorts[cohort].totalRevenue += orderData.total
        cohorts[cohort].totalOrders += orderData.count
      }
    }

    const cohortData = Object.entries(cohorts)
      .map(([cohort, data]) => ({
        cohort,
        users: data.users,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalOrders: data.totalOrders,
        ltv: data.users > 0 ? Math.round((data.totalRevenue / data.users) * 100) / 100 : 0,
        avgOrdersPerUser: data.users > 0 ? Math.round((data.totalOrders / data.users) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))
      .slice(-cohortMonths)

    const overall = {
      totalUsers: users.length,
      totalRevenue: cohortData.reduce((s, c) => s + c.totalRevenue, 0),
      totalOrders: cohortData.reduce((s, c) => s + c.totalOrders, 0),
      avgLtv: cohortData.length > 0
        ? Math.round((cohortData.reduce((s, c) => s + c.ltv, 0) / cohortData.length) * 100) / 100
        : 0,
    }

    const userAov = orderMap.size > 0
      ? Math.round(([...orderMap.values()].reduce((s, o) => s + o.total, 0) / orderMap.size) * 100) / 100
      : 0

    return NextResponse.json({ cohortData, overall, userAov })
  } catch (e) {
    console.error('Customer LTV error:', e)
    return NextResponse.json({ error: 'Failed to load customer LTV' }, { status: 500 })
  }
}, 'reports')