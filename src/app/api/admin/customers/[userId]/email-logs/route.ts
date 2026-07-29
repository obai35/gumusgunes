import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }: { params: { userId: string }, admin: any }) => {
  const sdb = storeDb(admin.storeId)
  const emailLogs = await sdb.emailLog.findMany({
    where: { userId: params.userId },
    orderBy: { sentAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ emailLogs })
}, 'customers')
