import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = searchParams.get('type')
  const accountId = searchParams.get('accountId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }
  if (type) where.type = type
  if (accountId) {
    where.lines = { some: { accountId } }
  }

  const [entries, total] = await Promise.all([
    sdb.journalEntry.findMany({
      where,
      include: {
        lines: { include: { account: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    sdb.journalEntry.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')
