import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { storeDb } from '@/lib/store-scoped'
import { withAdmin } from '@/lib/admin-permissions'

function getAgeBucket(days: number): string {
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export const GET = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const now = new Date()
    const sp = req.nextUrl.searchParams
    const asOfParam = sp.get('asOf') || now.toISOString().slice(0, 10)
    const asOf = new Date(asOfParam)
    asOf.setHours(23, 59, 59, 999)

    const arOrders = await sdb.order.findMany({
      where: {
        paymentStatus: 'paid',
        reconciledAt: null,
        createdAt: { lte: asOf },
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        orderNumber: true,
        receiptNumber: true,
        fullName: true,
        totalAmount: true,
        createdAt: true,
        paymentVerifiedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const arBuckets: Record<string, { count: number; total: number; orders: any[] }> = {
      '0-30': { count: 0, total: 0, orders: [] },
      '31-60': { count: 0, total: 0, orders: [] },
      '61-90': { count: 0, total: 0, orders: [] },
      '90+': { count: 0, total: 0, orders: [] },
    }

    for (const order of arOrders) {
      const refDate = order.paymentVerifiedAt || order.createdAt
      const days = Math.floor((asOf.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
      const bucket = getAgeBucket(days)
      if (arBuckets[bucket]) {
        arBuckets[bucket].count++
        arBuckets[bucket].total += order.totalAmount
        if (arBuckets[bucket].orders.length < 10) {
          arBuckets[bucket].orders.push({
            id: order.id,
            orderNumber: order.orderNumber,
            receiptNumber: order.receiptNumber,
            customer: order.fullName,
            amount: order.totalAmount,
            date: order.createdAt,
            days,
          })
        }
      }
    }

    const totalAR = arOrders.reduce((s, o) => s + o.totalAmount, 0)

    const apAccount = await sdb.account.findFirst({ where: { code: '2000' } })

    let apBuckets: Record<string, { count: number; total: number; items: any[] }> | null = null
    let totalAP = 0

    if (apAccount) {
      const apLines = await sdb.journalLine.findMany({
        where: {
          accountId: apAccount.id,
          credit: { gt: 0 },
          entry: { date: { lte: asOf } },
        },
        include: {
          entry: { select: { date: true, description: true, reference: true } },
        },
        orderBy: { entry: { date: 'asc' } },
      })

      const apEntries: any[] = []
      for (const line of apLines) {
        const offsetDebit = await sdb.journalLine.findFirst({
          where: {
            accountId: apAccount.id,
            debit: { gt: 0 },
            entryId: line.entryId,
          },
        })
        if (!offsetDebit) {
          apEntries.push(line)
        }
      }

      apBuckets = {
        '0-30': { count: 0, total: 0, items: [] },
        '31-60': { count: 0, total: 0, items: [] },
        '61-90': { count: 0, total: 0, items: [] },
        '90+': { count: 0, total: 0, items: [] },
      }

      for (const line of apEntries) {
        const days = Math.floor((asOf.getTime() - line.entry.date.getTime()) / (1000 * 60 * 60 * 24))
        const bucket = getAgeBucket(days)
        if (apBuckets[bucket]) {
          apBuckets[bucket].count++
          apBuckets[bucket].total += line.credit
          if (apBuckets[bucket].items.length < 10) {
            apBuckets[bucket].items.push({
              description: line.entry.description,
              reference: line.entry.reference,
              amount: line.credit,
              date: line.entry.date,
              days,
            })
          }
        }
      }

      totalAP = apEntries.reduce((s, l) => s + l.credit, 0)
    }

    return NextResponse.json({
      asOfDate: asOf.toISOString(),
      accountsReceivable: {
        buckets: arBuckets,
        total: totalAR,
      },
      accountsPayable: {
        buckets: apBuckets,
        total: totalAP,
      },
    })
  } catch (e) {
    console.error('Aging GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch aging' }, { status: 500 })
  }
}, 'accounting')
