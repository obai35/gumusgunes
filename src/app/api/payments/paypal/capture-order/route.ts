import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    const capture = await capturePayPalOrder(orderId)
    if (capture.status === 'COMPLETED') {
      return NextResponse.json({ status: 'COMPLETED' })
    }
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
