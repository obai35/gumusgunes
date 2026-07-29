import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req, { params, admin }) => {
  const sdb = storeDb(admin.storeId)
  const now = new Date()
  const bills = await sdb.bill.findMany({ where: { status: { notIn: ['paid', 'cancelled'] } }, orderBy: { dueAt: 'asc' } })
  const buckets = { current: { label: 'Current', total: 0, count: 0, bills: [] as any[] },
    overdue_30: { label: '1-30 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_60: { label: '31-60 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_90: { label: '61-90 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_90plus: { label: '90+ Days', total: 0, count: 0, bills: [] as any[] } }

  for (const bill of bills) {
    if (!bill.dueAt) { buckets.current.bills.push(bill); buckets.current.total += bill.total; buckets.current.count++; continue }
    const daysOverdue = Math.floor((now.getTime() - bill.dueAt.getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 0) { buckets.current.bills.push(bill); buckets.current.total += bill.total; buckets.current.count++ }
    else if (daysOverdue <= 30) { buckets.overdue_30.bills.push(bill); buckets.overdue_30.total += bill.total; buckets.overdue_30.count++ }
    else if (daysOverdue <= 60) { buckets.overdue_60.bills.push(bill); buckets.overdue_60.total += bill.total; buckets.overdue_60.count++ }
    else if (daysOverdue <= 90) { buckets.overdue_90.bills.push(bill); buckets.overdue_90.total += bill.total; buckets.overdue_90.count++ }
    else { buckets.overdue_90plus.bills.push(bill); buckets.overdue_90plus.total += bill.total; buckets.overdue_90plus.count++ }
  }

  return NextResponse.json({ buckets, totalOutstanding: bills.reduce((s, b) => s + b.total, 0) })
}, 'accounting')
