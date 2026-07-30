import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const accounts = await sdb.bankAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json({ accounts })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const account = await sdb.bankAccount.create({
    data: { name: body.name, accountNumber: body.accountNumber, bankName: body.bankName, openingBalance: body.openingBalance || 0, currentBalance: body.openingBalance || 0 } as any,
  })
  return NextResponse.json({ account })
}, 'accounting')
