import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: { userId: string } }) => {
  const notes = await db.customerNote.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ notes })
}, 'customers')
