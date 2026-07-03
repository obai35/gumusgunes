import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { z } from 'zod'

const StripeIntentSchema = z.object({
  orderId: z.string().uuid(),
}).strict()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = StripeIntentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { orderId } = parsed.data
    const { amount, currency, idempotencyKey } = body
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'egp',
      automatic_payment_methods: { enabled: true },
      metadata: { idempotencyKey },
    }, { idempotencyKey })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('[payment-create-intent]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
