import { NextRequest, NextResponse } from 'next/server'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const runs = await sdb.payrollRun.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { employee: true } }, processedBy: true },
  })
  return NextResponse.json({ runs })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  const sdb = storeDb(admin.storeId)
  const body = await req.json()

  const periodStart = new Date(body.periodStart)
  const periodEnd = new Date(body.periodEnd)

  const employees = await sdb.employee.findMany({
    where: { storeId: admin.storeId, isActive: true },
  })

  const items = employees.map((e) => ({
    salary: body.customSalaries?.[e.id] ?? e.salary,
    deductions: body.customDeductions?.[e.id] ?? 0,
    bonus: body.customBonus?.[e.id] ?? 0,
    netPay: 0,
    employeeId: e.id,
    notes: body.customNotes?.[e.id] ?? null,
  }))

  for (const item of items) {
    item.netPay = item.salary + item.bonus - item.deductions
  }

  const totalSalaries = items.reduce((s, i) => s + i.salary, 0)
  const totalDeductions = items.reduce((s, i) => s + i.deductions, 0)
  const totalNet = items.reduce((s, i) => s + i.netPay, 0)

  const run = await sdb.payrollRun.create({
    data: {
      storeId: admin.storeId,
      periodStart,
      periodEnd,
      totalSalaries,
      totalDeductions,
      totalNet,
      status: 'draft',
      items: {
        create: items.map((i) => ({
          storeId: admin.storeId,
          employeeId: i.employeeId,
          salary: i.salary,
          deductions: i.deductions,
          bonus: i.bonus,
          netPay: i.netPay,
          notes: i.notes,
        })),
      },
    },
    include: { items: { include: { employee: true } }, processedBy: true },
  })

  return NextResponse.json({ run })
}, 'accounting')
