import { db } from '@/lib/db'

export async function logAudit(params: {
  adminId: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, unknown>
}) {
  try {
    await db.activityLog.create({
      data: {
        adminId: params.adminId,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        details: params.details ? JSON.stringify(params.details) : null,
      },
    })
  } catch (error) {
    console.error('[audit] Failed to log:', error)
  }
}
