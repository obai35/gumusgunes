import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { autoAccountOrderPayment } from '@/lib/auto-accounting'
import { recordCOGS } from '@/lib/cogs'

const ALLOWED_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
const ALLOWED_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

async function handler(req: Request) {
  try {
    const { orderId, field, value } = await req.json()

    if (!orderId || !field || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['status', 'paymentStatus'].includes(field)) {
      return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
    }

    const allowedValues = field === 'status' ? ALLOWED_STATUSES : ALLOWED_PAYMENT_STATUSES
    if (!allowedValues.includes(value)) {
      return NextResponse.json({ error: `Invalid ${field} value` }, { status: 400 })
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    await db.order.update({ where: { id: orderId }, data: { [field]: value } })

    if (field === 'status' && value === 'delivered' && order.paymentStatus === 'paid') {
      autoAccountOrderPayment(orderId).catch(console.error)
    }

    if (field === 'status' && value === 'delivered') {
      recordCOGS(orderId).catch(console.error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[update-order-status]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const POST = withAdmin(handler, 'orders')
