import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const search = req.nextUrl.searchParams.get('search') || ''
    const customers = await db.user.findMany({
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
