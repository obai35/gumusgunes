import { db } from './db'

type ActivityInput = {
  adminId?: string
  adminName?: string
  action: string
  resource: string
  resourceId?: string
  details?: string
}

export async function logActivity(input: ActivityInput) {
  try {
    await db.activityLog.create({ data: input })
  } catch {
    // silently fail - activity logging should never break the app
  }
}
