import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const q = (req.nextUrl.searchParams.get('q') || '').trim()
  if (!q) {
    return NextResponse.json({ products: [], orders: [], customers: [] })
  }

  const sdb = storeDb(admin.storeId)
  const contains = { contains: q, mode: 'insensitive' as const }
  const take = 5

  const [products, orders, customers] = await Promise.all([
    sdb.product.findMany({
      where: { OR: [{ name: contains }, { sku: contains }] },
      select: { id: true, name: true, sku: true, price: true, imageUrl: true, isActive: true },
      take,
      orderBy: { createdAt: 'desc' },
    }),
    sdb.order.findMany({
      where: {
        OR: [
          { orderNumber: contains },
          { receiptNumber: contains },
          { fullName: contains },
          { email: contains },
        ],
      },
      select: { id: true, orderNumber: true, fullName: true, email: true, status: true, totalAmount: true },
      take,
      orderBy: { createdAt: 'desc' },
    }),
    sdb.user.findMany({
      where: { OR: [{ name: contains }, { email: contains }, { phone: contains }] },
      select: { id: true, name: true, email: true, phone: true },
      take,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return NextResponse.json({ products, orders, customers })
})
