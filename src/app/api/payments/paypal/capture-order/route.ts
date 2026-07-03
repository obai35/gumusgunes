import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { z } from 'zod'

const PayPalCaptureSchema = z.object({
  orderId: z.string().uuid(),
  paypalOrderId: z.string().min(1),
}).strict()

export async function POST(req: Request) {
  try {
    const parsed = PayPalCaptureSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { orderId, paypalOrderId } = parsed.data
    const capture = await capturePayPalOrder(orderId)
    if (capture.status === 'COMPLETED') {
      return NextResponse.json({ status: 'COMPLETED' })
    }
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  } catch (error) {
    console.error('[payment-capture-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
