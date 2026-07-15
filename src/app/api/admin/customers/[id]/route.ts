import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const customer = await db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, name: true, email: true, phone: true, createdAt: true,
        loyaltyPoints: true,
        loyaltyTier: { select: { id: true, name: true, benefits: true } },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            items: { include: { product: { select: { name: true } } } },
            shift: { select: { branch: { select: { name: true } } } },
          },
        },
        addresses: {
          select: { id: true, fullName: true, phone: true, street: true, city: true, state: true, postalCode: true, country: true, isDefault: true },
        },
      },
    })
    if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const totalSpend = customer.orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0)

    return NextResponse.json({ customer: { ...customer, totalSpend } })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'customers')
