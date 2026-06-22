import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/orders/lookup?orderNumber=GG-12345678-001&email=user@example.com
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orderNumber = searchParams.get('orderNumber')?.trim()
    const email = searchParams.get('email')?.trim().toLowerCase()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { ok: false, error: 'Order number and email are required.' },
        { status: 400 }
      )
    }

    const order = await db.order.findFirst({
      where: {
        orderNumber,
        email,
      },
      include: {
        items: {
          include: { product: { include: { category: true } } },
          orderBy: { id: 'asc' },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { ok: false, error: 'No order found with those details. Please check and try again.' },
        { status: 404 }
      )
    }

    // Compute a simulated timeline based on order age
    const createdAt = new Date(order.createdAt)
    const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
    let currentStatus = order.status
    const timeline = [
      {
        label: 'Order Placed',
        description: 'We received your order.',
        completed: true,
        date: createdAt.toISOString(),
      },
      {
        label: 'Crafting',
        description: 'Our artisans are preparing your piece.',
        completed: ageHours >= 2,
        date: ageHours >= 2 ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000).toISOString() : null,
      },
      {
        label: 'Quality Check',
        description: 'Hand-finished and inspected.',
        completed: ageHours >= 24,
        date: ageHours >= 24 ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
      },
      {
        label: 'Shipped',
        description: 'On its way to you.',
        completed: ageHours >= 48,
        date: ageHours >= 48 ? new Date(createdAt.getTime() + 48 * 60 * 60 * 1000).toISOString() : null,
      },
      {
        label: 'Delivered',
        description: 'Enjoy your piece.',
        completed: order.status === 'delivered',
        date: order.status === 'delivered' ? new Date(createdAt.getTime() + 96 * 60 * 60 * 1000).toISOString() : null,
      },
    ]

    return NextResponse.json({
      ok: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        fullName: order.fullName,
        email: order.email,
        address: order.address,
        city: order.city,
        country: order.country,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        createdAt: order.createdAt,
        items: order.items.map((it) => ({
          id: it.id,
          quantity: it.quantity,
          price: it.price,
          product: {
            id: it.product.id,
            name: it.product.name,
            imageUrl: it.product.imageUrl,
            slug: it.product.slug,
            category: it.product.category?.name,
          },
        })),
      },
      timeline,
    })
  } catch (err) {
    console.error('GET /api/orders/lookup error:', err)
    return NextResponse.json({ ok: false, error: 'Lookup failed' }, { status: 500 })
  }
}
