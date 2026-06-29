import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json()
    const order = await createPayPalOrder(amount, currency || 'USD')
    return NextResponse.json({ id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
