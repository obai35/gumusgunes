import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const branchId = req.nextUrl.searchParams.get('branchId')
    if (!branchId) return NextResponse.json({ error: 'branchId required' }, { status: 400 })

    const shifts = await sdb.shift.findMany({
      where: { branchId },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(shifts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch shift history' }, { status: 500 })
  }
}, 'pos')
