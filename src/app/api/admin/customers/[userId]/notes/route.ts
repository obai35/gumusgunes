import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'

export const GET = withAdmin(async (_req: NextRequest, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const notes = await sdb.customerNote.findMany({
    where: { userId: params.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return NextResponse.json({ notes })
}, 'customers')
