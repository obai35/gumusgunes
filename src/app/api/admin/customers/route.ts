import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAdmin } from '@/lib/admin-permissions'

const prisma = new PrismaClient()

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const limit = 20
    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ],
    } : {}

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true, createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            select: { totalAmount: true, createdAt: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ])

    const enriched = customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      createdAt: c.createdAt,
      orderCount: c._count.orders,
      totalSpend: 0,
      lastOrderDate: c.orders[0]?.createdAt || null,
    }))

    const userIds = customers.map(c => c.id)
    const orderAggs = await prisma.order.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds }, status: { not: 'cancelled' } },
      _sum: { totalAmount: true },
    })
    const spendMap = new Map(orderAggs.map(o => [o.userId, o._sum.totalAmount || 0]))
    for (const c of enriched) {
      c.totalSpend = spendMap.get(c.id) || 0
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [activeCustomerCount, revenueResult, orderCountResult] = await Promise.all([
      prisma.user.count({
        where: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } },
      }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'cancelled' } } }),
      prisma.order.count({ where: { status: { not: 'cancelled' } } }),
    ])

    const totalRevenue = revenueResult._sum.totalAmount || 0
    const avgOrderValue = orderCountResult > 0 ? totalRevenue / orderCountResult : 0

    return NextResponse.json({
      customers: enriched,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        totalCustomers: total,
        activeCustomers: activeCustomerCount,
        totalRevenue,
        avgOrderValue,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
  }
}, 'customers')
