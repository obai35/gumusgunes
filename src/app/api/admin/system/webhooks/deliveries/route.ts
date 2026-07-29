import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const webhookId = searchParams.get('webhookId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const where: any = {}
  if (webhookId) where.webhookId = webhookId
  const [deliveries, total] = await Promise.all([
    sdb.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { webhook: { select: { name: true, url: true } } },
    }),
    sdb.webhookDelivery.count({ where }),
  ])
  return NextResponse.json({
    deliveries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}, 'system')
