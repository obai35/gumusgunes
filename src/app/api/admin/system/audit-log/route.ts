import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const action = searchParams.get('action')
  const resource = searchParams.get('resource')
  const adminId = searchParams.get('adminId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: any = {}
  if (action) where.action = action
  if (resource) where.resource = resource
  if (adminId) where.adminId = adminId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ])

  const distinctActions = await db.activityLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
    take: 50,
  })

  const distinctResources = await db.activityLog.groupBy({
    by: ['resource'],
    _count: { resource: true },
    orderBy: { _count: { resource: 'desc' } },
    take: 50,
  })

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: {
      actions: distinctActions.map(a => ({ value: a.action, count: a._count.action })),
      resources: distinctResources.map(r => ({ value: r.resource, count: r._count.resource })),
    },
  })
}, 'system')
