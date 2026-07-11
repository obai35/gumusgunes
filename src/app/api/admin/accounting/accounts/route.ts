import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { z } from 'zod'

const AccountSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Code must be 4 digits'),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  parentId: z.string().optional(),
})

export const GET = withAdmin(async () => {
  const accounts = await db.account.findMany({
    orderBy: { code: 'asc' },
    include: {
      journalLines: {
        select: { debit: true, credit: true },
      },
    },
  })

  const accountsWithBalance = accounts.map((acc) => {
    const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
    let balance = totalDebit - totalCredit
    if (['liability', 'equity', 'income'].includes(acc.type)) {
      balance = totalCredit - totalDebit
    }
    const { journalLines, ...rest } = acc
    return { ...rest, balance }
  })

  return NextResponse.json({ accounts: accountsWithBalance })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const existing = await db.account.findUnique({ where: { code: parsed.data.code } })
  if (existing) return NextResponse.json({ error: 'Account code already exists' }, { status: 400 })
  const account = await db.account.create({ data: parsed.data })
  return NextResponse.json({ account })
}, 'accounting')
