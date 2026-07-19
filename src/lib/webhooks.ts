import crypto from 'crypto'

type WebhookEvent = 'order.created' | 'order.updated' | 'order.cancelled' | 'product.created' | 'product.updated' | 'customer.created'

const WEBHOOK_URLS = (process.env.WEBHOOK_URLS || '').split(',').filter(Boolean)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''

export async function sendWebhook(event: WebhookEvent, payload: any) {
  if (WEBHOOK_URLS.length === 0) return

  const timestamp = new Date().toISOString()
  const body = JSON.stringify({ event, timestamp, data: payload })
  const signature = WEBHOOK_SECRET
    ? crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')
    : ''

  for (const url of WEBHOOK_URLS) {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
      },
      body,
    }).catch(() => {})
  }
}
