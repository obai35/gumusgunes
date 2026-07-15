import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { z } from 'zod'

const PayPalCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
}).strict()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = PayPalCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { amount, currency } = parsed.data
    const order = await createPayPalOrder(amount, currency || 'EGP')
    return NextResponse.json({ id: order.id })
  } catch (error) {
    console.error('[payment-create-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
