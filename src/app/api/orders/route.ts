import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  price: z.number(),
})

const OrderSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  phone: z.string().optional().or(z.literal('')),
  address: z.string().min(5).max(300),
  city: z.string().min(1).max(120),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(120),
  notes: z.string().max(1000).optional().or(z.literal('')),
  paymentMethod: z.enum(['card', 'transfer', 'cod']).default('card'),
  items: z.array(OrderItemSchema).min(1),
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  totalAmount: z.number(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = OrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid order data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items, ...rest } = parsed.data

    // Verify products exist and recompute prices to prevent tampering
    const productIds = items.map((i) => i.productId)
    const dbProducts = await db.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })
    const map = new Map(dbProducts.map((p) => [p.id, p]))

    let subtotal = 0
    const orderItemsData = []
    for (const item of items) {
      const p = map.get(item.productId)
      if (!p) {
        return NextResponse.json(
          { ok: false, error: `Product ${item.productId} not available` },
          { status: 400 }
        )
      }
      const lineTotal = p.price * item.quantity
      subtotal += lineTotal
      orderItemsData.push({
        productId: p.id,
        quantity: item.quantity,
        price: p.price,
      })
    }

    const shipping = subtotal >= 250 ? 0 : 15
    const tax = Math.round(subtotal * 0.18 * 100) / 100 // 18% VAT (Turkey)
    const totalAmount = Math.round((subtotal + shipping + tax) * 100) / 100

    const orderNumber =
      'GG-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')

    const order = await db.order.create({
      data: {
        orderNumber,
        email: rest.email.toLowerCase(),
        fullName: rest.fullName,
        phone: rest.phone || null,
        address: rest.address,
        city: rest.city,
        postalCode: rest.postalCode,
        country: rest.country,
        notes: rest.notes || null,
        paymentMethod: rest.paymentMethod,
        subtotal,
        shipping,
        tax,
        totalAmount,
        status: 'processing',
        items: { create: orderItemsData },
      },
      include: { items: { include: { product: true } } },
    })

    return NextResponse.json({ ok: true, order })
  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to create order' }, { status: 500 })
  }
}
