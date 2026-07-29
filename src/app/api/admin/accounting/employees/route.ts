import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const employees = await sdb.employee.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json({ employees })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()
  const employee = await sdb.employee.create({
    data: {
      storeId: admin.storeId,
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      position: body.position || null,
      salary: body.salary || 0,
      bankAccountName: body.bankAccountName || null,
      bankAccountNumber: body.bankAccountNumber || null,
      bankName: body.bankName || null,
      taxId: body.taxId || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json({ employee })
}, 'accounting')
