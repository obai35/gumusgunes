import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req, { params, admin }: { params: Promise<{ id: string }>, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const { id } = await params
    const returns = await sdb.return.findMany({
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
