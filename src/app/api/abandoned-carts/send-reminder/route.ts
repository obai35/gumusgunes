import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sendEmail } from '@/lib/email'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { cartId } = await req.json()
    const cart = await db.abandonedCart.findUnique({ where: { id: cartId } })
    if (!cart) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const items = JSON.parse(cart.items) as { name: string; quantity: number; price: number }[]
    const itemsHtml = items.map(i => '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + i.name + '</td><td style="padding:8px;border-bottom:1px solid #eee">x' + i.quantity + '</td><td style="padding:8px;border-bottom:1px solid #eee">$' + i.price.toFixed(2) + '</td></tr>').join('')
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'
    const sent = await sendEmail({
      to: cart.email, subject: 'You left something in your cart!',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#1e3a5f;">Hey' + (cart.name ? ' ' + cart.name : '') + '!</h1><p>Your items are waiting!</p><table style="width:100%;border-collapse:collapse;margin:16px 0;">' + itemsHtml + '</table><p style="font-size:1.2em;font-weight:bold;color:#1e3a5f;">Total: $' + cart.total.toFixed(2) + '</p><a href="' + storeUrl + '/cart" style="display:inline-block;padding:12px 32px;background:#c9a84c;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:bold;">Return to Cart</a></div>',
      text: 'You left items in your cart worth $' + cart.total.toFixed(2) + '. Return: ' + storeUrl + '/cart',
    })
    if (sent) { await db.abandonedCart.update({ where: { id: cartId }, data: { reminderSentAt: new Date(), remindedCount: { increment: 1 } } }); return NextResponse.json({ ok: true }) }
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
