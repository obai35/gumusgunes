import Stripe from 'stripe'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

let stripe: Stripe | null = null

export async function getStripe(): Promise<Stripe> {
  if (stripe) return stripe

  try {
    const method = await db.paymentMethod.findUnique({ where: { code: 'card' } })
    if (method?.config) {
      const config = JSON.parse(decrypt(method.config))
      if (config.secretKey) {
        stripe = new Stripe(config.secretKey, {
          apiVersion: '2026-06-24.dahlia',
        })
        return stripe
      }
    }
  } catch {}

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe secret key is not configured. Set it in Admin > Payments > Card, or set STRIPE_SECRET_KEY env var.')
  stripe = new Stripe(key, { apiVersion: '2026-06-24.dahlia' })
  return stripe
}
