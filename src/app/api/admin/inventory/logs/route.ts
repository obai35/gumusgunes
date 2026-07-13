import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req) => {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const skip = parseInt(searchParams.get('skip') || '0')

    const where = productId ? { productId } : {}

    const [logs, total] = await Promise.all([
      db.inventoryLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: productId ? undefined : { product: { select: { name: true, sku: true } } },
      }),
      db.inventoryLog.count({ where }),
    ])
    return NextResponse.json({ ok: true, logs, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
  }
}, 'inventory')
