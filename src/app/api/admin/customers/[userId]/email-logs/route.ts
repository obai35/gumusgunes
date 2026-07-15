import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: { userId: string } }) => {
  const emailLogs = await db.emailLog.findMany({
    where: { userId: params.userId },
    orderBy: { sentAt: 'desc' },
    take: 200,
  })
  return NextResponse.json({ emailLogs })
}, 'customers')
