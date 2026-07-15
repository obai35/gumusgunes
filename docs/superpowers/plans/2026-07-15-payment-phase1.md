# Phase 1: Admin-Configurable Payment System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all payment providers (Stripe, PayPal) fully configurable from the admin panel instead of env vars, and fix all API bugs preventing payments from working.

**Architecture:** Server-side payment libs (`lib/stripe.ts`, `lib/paypal.ts`) currently read API keys from `process.env`. Change them to read from the `paymentMethod` DB table where config is stored encrypted (already set by the admin payment UI). API routes (`create-intent`, `create-order`, `capture-order`) have Zod schemas requiring `orderId` (UUID) that the storefront never sends — remove that requirement since the local order doesn't exist yet. The `StripePayment.tsx` component calls `onSuccess()` without passing the payment intent ID, and `CheckoutContent.tsx`'s `handleStripeSuccess` ignores the parameter — fix both.

**Tech Stack:** Next.js, Stripe, PayPal, Zod, Prisma (DB)

---

### Task 1: Fix `lib/stripe.ts` — read secret key from DB config

**Files:**
- Modify: `src/lib/stripe.ts`

- [ ] **Change `getStripe()` to async and read from DB config**

The current file reads `STRIPE_SECRET_KEY` from env var as a singleton. Change it to:
1. Try reading the `card` payment method config from the DB
2. Fall back to env var if DB config is missing
3. Cache the Stripe instance per secret key

```ts
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
          apiVersion: '2025-02-24-acacia',
        })
        return stripe
      }
    }
  } catch {}

  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('Stripe secret key is not configured. Set it in Admin > Payments > Card, or set STRIPE_SECRET_KEY env var.')
  stripe = new Stripe(key, { apiVersion: '2025-02-24-acacia' })
  return stripe
}
```

### Task 2: Fix `lib/paypal.ts` — read credentials from DB config

**Files:**
- Modify: `src/lib/paypal.ts`

- [ ] **Rewrite `getAccessToken()` and exported functions to read from DB config**

The current file reads `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SANDBOX` from env vars at module scope. Change to async DB lookup.

```ts
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
```

### Task 3: Fix `create-intent` route — wrong Zod schema

**Files:**
- Modify: `src/app/api/payments/stripe/create-intent/route.ts`

- [ ] **Remove `orderId` requirement, accept `{ amount, currency }`**

`StripePayment.tsx` calls this with `{ amount, currency }` — no `orderId` because the order doesn't exist yet.

```ts
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { z } from 'zod'

const StripeIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
}).strict()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = StripeIntentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { amount, currency } = parsed.data
    const { idempotencyKey } = body
    const stripe = await getStripe()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'egp',
      automatic_payment_methods: { enabled: true },
      metadata: { idempotencyKey },
    }, { idempotencyKey })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (error) {
    console.error('[payment-create-intent]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Task 4: Fix `create-order` route — wrong Zod schema

**Files:**
- Modify: `src/app/api/payments/paypal/create-order/route.ts`

- [ ] **Remove `orderId` requirement, accept `{ amount, currency }`**

`PayPalPayment.tsx` calls this with `{ amount, currency }` — no `orderId`.

```ts
import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'
import { z } from 'zod'

const PayPalCreateSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional(),
}).strict()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = PayPalCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { amount, currency } = parsed.data
    const order = await createPayPalOrder(amount, currency || 'EGP')
    return NextResponse.json({ id: order.id })
  } catch (error) {
    console.error('[payment-create-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Task 5: Fix `capture-order` route — wrong schema + variable swap

**Files:**
- Modify: `src/app/api/payments/paypal/capture-order/route.ts`

- [ ] **Fix Zod schema to expect `paypalOrderId`, pass it to `capturePayPalOrder`**

`PayPalPayment.tsx` calls this with `{ paypalOrderId: data.orderID }` but schema expects `orderId` (UUID) + `paypalOrderId`. The route also passes the wrong variable to `capturePayPalOrder`.

```ts
import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'
import { z } from 'zod'

const PayPalCaptureSchema = z.object({
  paypalOrderId: z.string().min(1),
}).strict()

export async function POST(req: Request) {
  try {
    const parsed = PayPalCaptureSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { paypalOrderId } = parsed.data
    const capture = await capturePayPalOrder(paypalOrderId)
    if (capture.status === 'COMPLETED') {
      return NextResponse.json({ status: 'COMPLETED' })
    }
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  } catch (error) {
    console.error('[payment-capture-order]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Task 6: Fix `PayPalPayment.tsx` — send `paypalOrderId` instead of `orderId`

**Files:**
- Modify: `src/components/store/PayPalPayment.tsx`

- [ ] **Change the capture-order request body to send `paypalOrderId`**

Line 42 currently sends `{ orderId: data.orderID }`. Change to match the new schema from Task 5.

Just change line 42:
```ts
body: JSON.stringify({ paypalOrderId: data.orderID }),
```

### Task 7: Fix `StripePayment.tsx` — pass payment intent ID to `onSuccess`

**Files:**
- Modify: `src/components/store/StripePayment.tsx`

- [ ] **Pass `paymentIntent.id` to the `onSuccess` callback**

Currently `onSuccess()` is called without arguments. Change to pass the PaymentIntent ID.

Change lines 33-43 from:
```ts
const { error: submitError } = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: window.location.origin + '/order/success' },
  redirect: 'if_required',
})
if (submitError) {
  setError(submitError.message || 'Payment failed')
  setProcessing(false)
} else {
  onSuccess()
}
```

To:
```ts
const { error: submitError, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: { return_url: window.location.origin + '/order/success' },
  redirect: 'if_required',
})
if (submitError) {
  setError(submitError.message || 'Payment failed')
  setProcessing(false)
} else {
  onSuccess(paymentIntent.id)
}
```

### Task 8: Fix `CheckoutContent.tsx` — accept payment intent ID in `handleStripeSuccess`

**Files:**
- Modify: `src/components/store/CheckoutContent.tsx`

- [ ] **Update `handleStripeSuccess` to use the passed payment intent ID**

Currently:
```ts
const handleStripeSuccess = useCallback(() => {
  submitOrder({ stripePaymentIntentId })
}, [submitOrder, stripePaymentIntentId])
```

Change to:
```ts
const handleStripeSuccess = useCallback((paymentIntentId: string) => {
  submitOrder({ stripePaymentIntentId: paymentIntentId })
}, [submitOrder])
```

