import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event
  try {
    event = (await getStripe()).webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const existing = await db.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })
    if (existing && existing.paymentStatus !== 'paid') {
      await db.order.update({
        where: { id: existing.id },
        data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
      })
    }
  }

  return NextResponse.json({ received: true })
}
