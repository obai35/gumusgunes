import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { amount, currency, idempotencyKey } = await req.json()
    const paymentIntent = await getStripe().paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'egp',
      automatic_payment_methods: { enabled: true },
      metadata: { idempotencyKey },
    }, { idempotencyKey })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
