import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const accounts = await db.bankAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json({ accounts })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const account = await db.bankAccount.create({
    data: { name: body.name, accountNumber: body.accountNumber, bankName: body.bankName, openingBalance: body.openingBalance || 0, currentBalance: body.openingBalance || 0 },
  })
  return NextResponse.json({ account })
}, 'accounting')
