import { db } from '@/lib/db'
import { logger } from './logger'

let _defaultStoreId: string | null = null
async function getDefaultStoreId(): Promise<string> {
  if (_defaultStoreId) return _defaultStoreId
  const store = await db.store.findFirst()
  _defaultStoreId = store?.id ?? ''
  return _defaultStoreId
}

export async function logAudit(params: {
  adminId: string
  action: string
  resource: string
  resourceId?: string
  storeId?: string
  details?: Record<string, unknown>
}) {
  try {
    await db.activityLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        storeId: params.storeId ?? (await getDefaultStoreId()),
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
  } catch (error) {
    logger.error({ error }, 'Audit log failed')
  }
}

export async function auditWithSnapshot(data: {
  adminId: string
  action: string
  resource: string
  resourceId: string
  storeId?: string
  before: Record<string, unknown>
  after?: Record<string, unknown>
}): Promise<void> {
  try {
    const admin = await db.admin.findUnique({ where: { id: data.adminId }, select: { name: true } })
    await db.activityLog.create({
      data: {
        adminId: data.adminId,
        adminName: admin?.name ?? '',
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        storeId: data.storeId ?? (await getDefaultStoreId()),
        details: JSON.stringify({ before: data.before, after: data.after }),
      },
    })
  } catch (error) {
    logger.error({ error }, 'Audit snapshot failed')
  }
}

export async function getAuditTrail(params: {
  resource?: string
  resourceId?: string
  action?: string
  adminId?: string
  storeId?: string
  limit?: number
  offset?: number
}): Promise<{ logs: Array<Record<string, unknown>>; total: number }> {
  const where: Record<string, unknown> = {}
  if (params.resource) where.resource = params.resource
  if (params.resourceId) where.resourceId = params.resourceId
  if (params.action) where.action = params.action
  if (params.adminId) where.adminId = params.adminId
  if (params.storeId) where.storeId = params.storeId

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit ?? 50,
      skip: params.offset ?? 0,
    }),
    db.activityLog.count({ where }),
  ])

  return {
    logs: logs.map((l) => ({ ...l, details: l.details ? (JSON.parse(l.details) as Record<string, unknown>) : null })),
    total,
  }
}
