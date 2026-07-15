import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const action = sp.get('action')
    const resource = sp.get('resource')
    const adminId = sp.get('adminId')
    const from = sp.get('from')
    const to = sp.get('to')
    const page = parseInt(sp.get('page') || '1')
    const limit = parseInt(sp.get('limit') || '50')

    const where: any = {}
    if (action) where.action = action
    if (resource) where.resource = resource
    if (adminId) where.adminId = adminId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
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

    const logsWithParsed = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }))

    const distinctActions = await db.activityLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    })

    const distinctResources = await db.activityLog.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    })

    return NextResponse.json({
      logs: logsWithParsed,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        actions: distinctActions.map(a => a.action),
        resources: distinctResources.map(r => r.resource),
      },
    })
  } catch (e) {
    console.error('Audit GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}, 'accounting')
