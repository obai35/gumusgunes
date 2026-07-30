import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function verifyPayPalWebhook(
  headers: Headers,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false

  const apiUrl = process.env.PAYPAL_SANDBOX === 'true'
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'

  const authHeader = headers.get('authorization')
  if (!authHeader) return false

  const verificationRequest = {
    webhook_id: webhookId,
    event_body: body,
    auth_algo: headers.get('paypal-auth-algo'),
    cert_url: headers.get('paypal-cert-url'),
    transmission_id: headers.get('paypal-transmission-id'),
    transmission_sig: headers.get('paypal-transmission-sig'),
    transmission_time: headers.get('paypal-transmission-time'),
  }

  try {
    const res = await fetch(`${apiUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(verificationRequest),
    })
    const result = await res.json()
    return result.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const verified = await verifyPayPalWebhook(req.headers, rawBody)
    if (!verified) {
      console.warn('[PayPal webhook] Signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(rawBody)
    const eventType = event.event_type

    switch (eventType) {
      case 'CHECKOUT.ORDER.APPROVED':
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const orderId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.order_id
        if (orderId) {
          await db.order.updateMany({
            where: { paypalOrderId: orderId },
            data: { paymentStatus: 'paid', status: 'processing' },
          })
        }
        break
      }
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        const resourceId = event.resource?.id
        if (resourceId) {
          await db.order.updateMany({
            where: { paypalOrderId: resourceId },
            data: { paymentStatus: 'failed' },
          })
        }
        break
      }
      default:
        console.log('[PayPal webhook] Unhandled event type:', eventType)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PayPal webhook] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
