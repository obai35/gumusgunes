import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })
    if (existing && existing.paymentStatus !== 'paid') {
      await prisma.order.update({
        where: { id: existing.id },
        data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
      })
    }
  }

  return NextResponse.json({ received: true })
}
