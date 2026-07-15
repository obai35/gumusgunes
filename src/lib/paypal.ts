import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

interface PayPalConfig {
  clientId: string
  secretKey: string
  sandbox: boolean
}

async function getPayPalConfig(): Promise<PayPalConfig> {
  try {
    const method = await db.paymentMethod.findUnique({ where: { code: 'paypal' } })
    if (method?.config) {
      const config = JSON.parse(decrypt(method.config))
      if (config.clientId && config.secretKey) {
        return {
          clientId: config.clientId,
          secretKey: config.secretKey,
          sandbox: config.sandbox === true,
        }
      }
    }
  } catch {}

  return {
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    secretKey: process.env.PAYPAL_CLIENT_SECRET || '',
    sandbox: process.env.PAYPAL_SANDBOX === 'true',
  }
}

async function getAccessToken() {
  const config = await getPayPalConfig()
  const api = config.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  const auth = Buffer.from(`${config.clientId}:${config.secretKey}`).toString('base64')
  const res = await fetch(`${api}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(amount: number, currency: string) {
  const config = await getPayPalConfig()
  const api = config.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  const token = await getAccessToken()
  const res = await fetch(`${api}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency, value: amount.toFixed(2) } }],
    }),
  })
  return res.json()
}

export async function capturePayPalOrder(orderId: string) {
  const config = await getPayPalConfig()
  const api = config.sandbox ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
  const token = await getAccessToken()
  const res = await fetch(`${api}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  return res.json()
}
