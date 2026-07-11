const WHATSAPP_API = 'https://graph.facebook.com/v22.0'

function getConfig() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) throw new Error('WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID required')
  return { token, phoneNumberId }
}

export async function sendWhatsAppMessage(to: string, text: string) {
  const { token, phoneNumberId } = getConfig()
  const res = await fetch(`${WHATSAPP_API}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`WhatsApp API error: ${res.status} ${err}`)
  }
  return res.json()
}

export function verifyWebhook(mode: string | null, token: string | null, challenge: string | null) {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    return { status: 200, body: challenge }
  }
  return { status: 403, body: 'Forbidden' }
}

export function parseWebhookBody(body: any): { from: string; text: string; name: string } | null {
  const entry = body?.entry?.[0]
  const change = entry?.changes?.[0]
  const value = change?.value
  const message = value?.messages?.[0]
  if (!message || message.type !== 'text') return null
  return {
    from: message.from,
    text: message.text.body,
    name: value.contacts?.[0]?.profile?.name || 'Customer',
  }
}
