import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await params
    const returns = await db.return.findMany({
      where: { orderId: id },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        processedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(returns)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}, 'orders')
