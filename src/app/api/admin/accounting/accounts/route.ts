import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'
import { z } from 'zod'

const AccountSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Code must be 4 digits'),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  parentId: z.string().optional(),
})

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const searchParams = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
  const typeFilter = searchParams.get('type') || undefined

  const where: any = {}
  if (typeFilter) where.type = typeFilter

  const [accounts, total] = await Promise.all([
    sdb.account.findMany({
      where,
      orderBy: { code: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    sdb.account.count({ where }),
  ])

  const accountIds = accounts.map(a => a.id)
  const lineAggs = accountIds.length > 0
    ? await sdb.journalLine.groupBy({
        by: ['accountId'],
        where: { accountId: { in: accountIds } },
        _sum: { debit: true, credit: true },
      })
    : []

  const balanceMap: Record<string, number> = {}
  for (const agg of lineAggs) {
    const d = agg._sum.debit || 0
    const c = agg._sum.credit || 0
    balanceMap[agg.accountId] = d - c
  }

  const accountsWithBalance = accounts.map((acc) => {
    let balance = balanceMap[acc.id] || 0
    if (['liability', 'equity', 'income'].includes(acc.type)) {
      balance = -balance
    }
    return { ...acc, balance }
  })

  return NextResponse.json({
    accounts: accountsWithBalance,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const existing = await sdb.account.findFirst({ where: { code: parsed.data.code } })
  if (existing) return NextResponse.json({ error: 'Account code already exists' }, { status: 400 })
  const account = await sdb.account.create({ data: parsed.data as any })
  return NextResponse.json({ account })
}, 'accounting')
