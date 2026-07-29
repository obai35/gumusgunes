import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const adminId = req.nextUrl.searchParams.get('adminId')
    const resource = req.nextUrl.searchParams.get('resource')
    const action = req.nextUrl.searchParams.get('action')
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50')
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0')

    const where: any = {}
    if (adminId) where.adminId = adminId
    if (resource) where.resource = resource
    if (action) where.action = action

    const [logs, total] = await Promise.all([
      sdb.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 200),
        skip: offset,
      }),
      sdb.activityLog.count({ where }),
    ])

    return NextResponse.json({ logs, total })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}, 'activity')
