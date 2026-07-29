import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import { createReconciliationJournalEntry } from '@/lib/accounting'
import { storeDb } from '@/lib/store-scoped'

export const POST = withAdmin(async (req: Request, { admin }: { params: any; admin: AdminInfo }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    }

    const order = await sdb.order.findUnique({ where: { id: orderId } })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Order is not paid' }, { status: 400 })
    }

    const existingEntry = await sdb.journalEntry.findFirst({
      where: { orderId, type: 'reconciliation' },
    })
    if (existingEntry) {
      return NextResponse.json({ ok: true, alreadyReconciled: true })
    }

    const entry = await createReconciliationJournalEntry({
      id: order.id,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
    })

    await sdb.order.update({
      where: { id: orderId },
      data: { reconciledAt: new Date() },
    })

    return NextResponse.json({ ok: true, entry })
  } catch (e) {
    console.error('Reconciliation error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')

export const GET = withAdmin(async (req: Request, { admin }) => {
  try {
    const sdb = storeDb(admin.storeId)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const where: Record<string, unknown> = { paymentStatus: 'paid' }
    if (status === 'reconciled') {
      where.reconciledAt = { not: null }
    } else if (status === 'unreconciled') {
      where.reconciledAt = null
    }

    const orders = await sdb.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
        reconciledAt: true,
        createdAt: true,
        email: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ orders, count: orders.length })
  } catch (e) {
    console.error('Reconciliation list error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
