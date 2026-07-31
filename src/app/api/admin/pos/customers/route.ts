import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withPosOrAdmin } from '@/lib/pos-or-admin'

export const GET = withPosOrAdmin(async (req: NextRequest, { admin }) => {
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
