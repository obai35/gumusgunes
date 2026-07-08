import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/customer-auth'
import { getStripe } from '@/lib/stripe'
import { encrypt } from '@/lib/encryption'
import { addAlsoBought } from '@/lib/product-graph'
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
  paymentMethod: z.enum(['card', 'paypal', 'transfer', 'cod', 'instapay', 'vodafone-cash', 'orange-cash', 'etisalat-wallet', 'fawry']).default('card'),
  items: z.array(OrderItemSchema).min(1),
  subtotal: z.number(),
  shipping: z.number(),
  shippingMethodId: z.string().optional(),
  tax: z.number(),
  totalAmount: z.number(),
  idempotencyKey: z.string().optional(),
  stripePaymentIntentId: z.string().optional(),
  paypalOrderId: z.string().optional(),
  walletProvider: z.string().optional(),
  paymentReference: z.string().optional(),
})

const orderHandler = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = OrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid order data', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { items, idempotencyKey, stripePaymentIntentId, paypalOrderId, walletProvider, paymentReference, ...rest } = parsed.data

    const auth = req.headers.get('authorization')
    const authedUser = auth?.startsWith('Bearer ') ? verifyToken(auth.slice(7)) : null

    // Idempotency check — prevent duplicate order creation
    if (idempotencyKey) {
      const existingOrder = await db.order.findUnique({ where: { idempotencyKey } })
      if (existingOrder) {
        return NextResponse.json({ ok: true, order: existingOrder, duplicate: true })
      }
    }

    // Check if stripePaymentIntentId or paypalOrderId already used
    if (stripePaymentIntentId) {
      const existing = await db.order.findUnique({ where: { stripePaymentIntentId } })
      if (existing) {
        return NextResponse.json({ ok: true, order: existing, duplicate: true })
      }
    }
    if (paypalOrderId) {
      const existing = await db.order.findUnique({ where: { paypalOrderId } })
      if (existing) {
        return NextResponse.json({ ok: true, order: existing, duplicate: true })
      }
    }

    // Pending order detection — same items in an existing pending order
    const newProductIds = items.map((i: any) => i.productId).sort()
    const pendingOrders = await db.order.findMany({
      where: { email: rest.email.toLowerCase(), status: { in: ['pending', 'processing'] } },
      select: { id: true, items: { select: { productId: true } } },
    })
    for (const pending of pendingOrders) {
      const pendingProductIds = pending.items.map(i => i.productId).sort()
      if (JSON.stringify(pendingProductIds) === JSON.stringify(newProductIds)) {
        return NextResponse.json({
          ok: false,
          warning: 'You already have a pending order with the same items',
          existingOrder: pending,
          duplicateItems: true,
        })
      }
    }

    // Verify products exist and recompute prices to prevent tampering
    const productIds = items.map((i: any) => i.productId)
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
      if (p.stock < item.quantity) {
        return NextResponse.json(
          { ok: false, error: `Insufficient stock for "${p.name}" (available: ${p.stock})` },
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

    let shipping = 0
    let shippingMethodId = body.shippingMethodId || null
    if (body.shippingMethodId) {
      const { calculateShippingCost } = await import('@/lib/shipping')
      const governorate = await db.governorate.findFirst({
        where: { name: { contains: body.city, mode: 'insensitive' } },
      })
      if (governorate) {
        const result = await calculateShippingCost({
          methodId: body.shippingMethodId,
          governorateId: governorate.id,
          subtotal,
          couponCode: body.discountCode,
        })
        shipping = result.finalCost
      }
    } else {
      shipping = subtotal >= 250 ? 0 : 15
    }
    const tax = Math.round(subtotal * 0.18 * 100) / 100
    const totalAmount = Math.round((subtotal + shipping + tax) * 100) / 100

    const orderNumber =
      'O-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0')

    let paymentStatus: string =
      rest.paymentMethod === 'card' || rest.paymentMethod === 'paypal'
        ? 'paid'
        : rest.paymentMethod === 'cod'
          ? 'pending'
          : 'awaiting_verification'

    // Server-side payment verification
    if (rest.paymentMethod === 'card' && rest.stripePaymentIntentId) {
      try {
        const stripe = getStripe()
        const paymentIntent = await stripe.paymentIntents.retrieve(rest.stripePaymentIntentId)
        if (paymentIntent.status !== 'succeeded') {
          paymentStatus = 'pending'
        }
      } catch {
        paymentStatus = 'pending'
      }
    }

    if (rest.paymentMethod === 'paypal' && rest.paypalOrderId) {
      try {
        const { capturePayPalOrder } = await import('@/lib/paypal')
        const result = await capturePayPalOrder(rest.paypalOrderId)
        if (result.status !== 'COMPLETED') {
          paymentStatus = 'pending'
        }
      } catch {
        paymentStatus = 'pending'
      }
    }

    const order = await db.order.create({
      data: {
        orderNumber,
        userId: authedUser?.userId || null,
        email: rest.email.toLowerCase(),
        fullName: rest.fullName,
        phone: rest.phone || null,
        address: rest.address,
        city: rest.city,
        postalCode: rest.postalCode,
        country: rest.country,
        notes: rest.notes || null,
        paymentMethod: rest.paymentMethod,
        idempotencyKey: idempotencyKey || null,
        stripePaymentIntentId: stripePaymentIntentId || null,
        paypalOrderId: paypalOrderId || null,
        walletProvider: walletProvider || null,
        paymentReference: paymentReference ? encrypt(paymentReference) : null,
        subtotal,
        shipping,
        shippingMethodId,
        tax,
        totalAmount,
        status: rest.paymentMethod === 'cod' ? 'confirmed' : 'pending',
        paymentStatus,
        items: { create: orderItemsData },
      },
      select: {
        id: true, orderNumber: true, userId: true, email: true, fullName: true, phone: true,
        address: true, city: true, postalCode: true, country: true, totalAmount: true,
        subtotal: true, shipping: true, tax: true, status: true, paymentMethod: true,
        paymentStatus: true, discountId: true, discountAmount: true, shippingMethodId: true,
        notes: true, idempotencyKey: true, stripePaymentIntentId: true, paypalOrderId: true,
        walletProvider: true, paymentReference: true, createdAt: true,
        items: {
          select: { id: true, quantity: true, price: true, discount: true, productId: true, product: { select: { id: true, name: true, price: true, imageUrl: true, stock: true } } },
        },
      },
    })

    const boughtIds = order.items.map((i: any) => i.productId)
    if (boughtIds.length >= 2) {
      addAlsoBought(boughtIds).catch(console.error)
    }

    return NextResponse.json({ ok: true, order })
  } catch (err) {
    console.error('POST /api/orders error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to create order' }, { status: 500 })
  }
}

export const POST = withRateLimit(orderHandler, { limit: 10, window: '60s' })
