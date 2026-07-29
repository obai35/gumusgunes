import { db } from './db'

export interface AuditEntry {
  adminId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  await db.activityLog.create({
    data: {
      adminId: entry.adminId,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : undefined,
    },
  })
}

export async function withAudit<T>(entry: AuditEntry, fn: () => Promise<T>): Promise<T> {
  const result = await fn()
  await logAudit(entry)
  return result
}

export function getFilterWhere(sp: URLSearchParams): {
  where: Record<string, unknown>
  page: number
  limit: number
} {
  const action = sp.get('action')
  const resource = sp.get('resource')
  const adminId = sp.get('adminId')
  const from = sp.get('from')
  const to = sp.get('to')
  const page = parseInt(sp.get('page') || '1')
  const limit = parseInt(sp.get('limit') || '50')

  const where: Record<string, unknown> = {}
  if (action) where.action = action
  if (resource) where.resource = resource
  if (adminId) where.adminId = adminId
  if (from || to) {
    where.createdAt = {}
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from)
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to)
  }

  return { where, page, limit }
}
