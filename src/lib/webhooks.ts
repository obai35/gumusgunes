type WebhookEvent = 'order.created' | 'order.updated' | 'order.cancelled' | 'product.created' | 'product.updated' | 'customer.created'

const WEBHOOK_URLS = (process.env.WEBHOOK_URLS || '').split(',').filter(Boolean)

export async function sendWebhook(event: WebhookEvent, payload: any) {
  if (WEBHOOK_URLS.length === 0) return

  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload })

  for (const url of WEBHOOK_URLS) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Event': event },
      body,
    }).catch(() => {})
  }
}
