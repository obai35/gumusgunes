import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const customers = await sdb.user.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      } : {},
      select: { id: true, name: true, email: true, phone: true },
      take: 20,
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ customers })
  } catch {
    return NextResponse.json({ customers: [] })
  }
}, 'pos')
