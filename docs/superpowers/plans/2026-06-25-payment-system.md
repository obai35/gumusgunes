# Payment System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Stripe + PayPal real-time payments, add Egyptian wallets (Vodafone Cash, Orange Cash, Etisalat Wallet, Fawry) and InstaPay QR with admin verification, anti-duplication, pending order detection, and performance optimizations.

**Architecture:** Stripe Elements (embedded card form) + PayPal SDK buttons for real-time processing. Manual methods (wallets, InstaPay, Bank Transfer) show payment details and require admin verification. Idempotency key on orders prevents duplicates. Lazy loading via next/dynamic.

**Tech Stack:** Stripe SDK, @stripe/stripe-js, PayPal JS SDK, Prisma, Next.js App Router

---

### Task 1: Schema migration — add payment fields to Order

**Files:**
- Modify: `prisma/schema.prisma`
- Run: `npx prisma migrate dev --name add-payment-fields`

- [ ] **Step 1: Add fields to Order model**

```prisma
model Order {
  // ... existing fields (keep everything)
  stripePaymentIntentId String?   @unique
  paypalOrderId         String?   @unique
  idempotencyKey        String?   @unique
  walletProvider        String?
  paymentProofUrl       String?
  paymentReference      String?
  paymentVerifiedAt     DateTime?
}
```

- [ ] **Step 2: Run migration**

Run: `npx prisma migrate dev --name add-payment-fields`

- [ ] **Step 3: Regenerate client**

Run: `npx prisma generate`

---

### Task 2: Install Stripe dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Stripe packages**

```bash
npm install stripe @stripe/stripe-js
```

---

### Task 3: Create server-side library files

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/stripe-client.ts`
- Create: `src/lib/paypal.ts`

- [ ] **Step 1: Create server-side Stripe init**

```ts
// src/lib/stripe.ts
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24-acacia',
})

export default stripe
```

- [ ] **Step 2: Create client-side Stripe init**

```ts
// src/lib/stripe-client.ts
import { loadStripe } from '@stripe/stripe-js'

let stripePromise: Promise<any> | null = null

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}
```

- [ ] **Step 3: Create PayPal server helpers**

```ts
// src/lib/paypal.ts
const PAYPAL_API = process.env.PAYPAL_SANDBOX === 'true'
  ? 'https://api-m.sandbox.paypal.com'
  : 'https://api-m.paypal.com'

async function getAccessToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')
  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  })
  const data = await res.json()
  return data.access_token
}

export async function createPayPalOrder(amount: number, currency: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
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
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  return res.json()
}

export async function verifyPayPalWebhook(headers: Headers, body: string) {
  const token = await getAccessToken()
  const res = await fetch(`${PAYPAL_API}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.get('PAYPAL-AUTH-ALGO'),
      cert_url: headers.get('PAYPAL-CERT-URL'),
      transmission_id: headers.get('PAYPAL-TRANSMISSION-ID'),
      transmission_sig: headers.get('PAYPAL-TRANSMISSION-SIG'),
      transmission_time: headers.get('PAYPAL-TRANSMISSION-TIME'),
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: JSON.parse(body),
    }),
  })
  return res.json()
}
```

---

### Task 4: Create Stripe API routes

**Files:**
- Create: `src/app/api/payments/stripe/create-intent/route.ts`
- Create: `src/app/api/payments/stripe/webhook/route.ts`

- [ ] **Step 1: Create PaymentIntent route**

```ts
// src/app/api/payments/stripe/create-intent/route.ts
import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'

export async function POST(req: Request) {
  try {
    const { amount, currency, idempotencyKey } = await req.json()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency?.toLowerCase() || 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { idempotencyKey },
    }, { idempotencyKey })
    return NextResponse.json({ clientSecret: paymentIntent.client_secret })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create webhook route**

```ts
// src/app/api/payments/stripe/webhook/route.ts
import { NextResponse } from 'next/server'
import stripe from '@/lib/stripe'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object
    const existing = await prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    })
    if (existing && existing.paymentStatus !== 'paid') {
      await prisma.order.update({
        where: { id: existing.id },
        data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
      })
    }
  }

  return NextResponse.json({ received: true })
}
```

---

### Task 5: Create PayPal API routes

**Files:**
- Create: `src/app/api/payments/paypal/create-order/route.ts`
- Create: `src/app/api/payments/paypal/capture-order/route.ts`

- [ ] **Step 1: Create PayPal order route**

```ts
// src/app/api/payments/paypal/create-order/route.ts
import { NextResponse } from 'next/server'
import { createPayPalOrder } from '@/lib/paypal'

export async function POST(req: Request) {
  try {
    const { amount, currency } = await req.json()
    const order = await createPayPalOrder(amount, currency || 'USD')
    return NextResponse.json({ id: order.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create PayPal capture route**

```ts
// src/app/api/payments/paypal/capture-order/route.ts
import { NextResponse } from 'next/server'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json()
    const capture = await capturePayPalOrder(orderId)
    if (capture.status === 'COMPLETED') {
      return NextResponse.json({ status: 'COMPLETED' })
    }
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

---

### Task 6: Update order creation API with idempotency + pending order detection

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Step 1: Read the current orders route**

Read `src/app/api/orders/route.ts` to understand the current implementation.

- [ ] **Step 2: Add idempotency check and pending order detection**

Before creating the order, add:
```ts
// Check idempotency
if (idempotencyKey) {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey } })
  if (existing) return NextResponse.json({ order: existing, duplicate: true })
}

// Check for pending duplicate items
const pendingOrders = await prisma.order.findMany({
  where: { email, status: { in: ['pending', 'processing'] }, id: { not: undefined } },
  include: { items: true },
})
for (const pending of pendingOrders) {
  const pendingProductIds = pending.items.map(i => i.productId).sort()
  const newProductIds = body.items.map((i: any) => i.productId).sort()
  if (JSON.stringify(pendingProductIds) === JSON.stringify(newProductIds)) {
    return NextResponse.json({
      warning: 'You already have a pending order with the same items',
      existingOrder: pending,
      duplicateItems: true,
    })
  }
}
```

---

### Task 7: Create admin verification API routes

**Files:**
- Create: `src/app/api/admin/orders/verify-payment/route.ts`
- Create: `src/app/api/admin/orders/reject-payment/route.ts`
- Create: `src/app/api/upload/payment-proof/route.ts`

- [ ] **Step 1: Verify payment route**

```ts
// src/app/api/admin/orders/verify-payment/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { orderId } = await req.json()
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'paid', status: 'processing', paymentVerifiedAt: new Date() },
  })
  return NextResponse.json({ order })
}
```

- [ ] **Step 2: Reject payment route**

```ts
// src/app/api/admin/orders/reject-payment/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { orderId, reason } = await req.json()
  const order = await prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'pending', notes: reason || 'Payment rejected' },
  })
  return NextResponse.json({ order })
}
```

- [ ] **Step 3: Payment proof upload route**

```ts
// src/app/api/upload/payment-proof/route.ts
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const orderId = formData.get('orderId') as string
  if (!file || !orderId) return NextResponse.json({ error: 'Missing file or orderId' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const dir = path.join(process.cwd(), 'public/uploads/payments')
  await mkdir(dir, { recursive: true })
  const filename = `${orderId}-${Date.now()}.${file.name.split('.').pop()}`
  await writeFile(path.join(dir, filename), buffer)

  return NextResponse.json({ url: `/uploads/payments/${filename}` })
}
```

---

### Task 8: Create StripePayment component

**Files:**
- Create: `src/components/store/StripePayment.tsx`

- [ ] **Step 1: Create Stripe card form component**

```tsx
'use client'

import { useState } from 'react'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/stripe-js'
import { getStripe } from '@/lib/stripe-client'

function StripeForm({ amount, currency, onSuccess, clientSecret }: any) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setProcessing(true)
    const { error: submitError } = await stripe.confirmPayment({
      elements, clientSecret,
      confirmParams: { return_url: window.location.origin + '/order/success' },
      redirect: 'if_required',
    })
    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button type="submit" disabled={!stripe || processing} className="w-full mt-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  )
}

export default function StripePayment({ amount, currency, onSuccess }: any) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)

  useState(() => {
    fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency }),
    }).then(r => r.json()).then(data => {
      setClientSecret(data.clientSecret)
      setLoading(false)
    })
  })

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />

  return (
    <Elements stripe={getStripe()} clientSecret={clientSecret} options={{ locale: 'en' }}>
      <StripeForm amount={amount} currency={currency} onSuccess={onSuccess} clientSecret={clientSecret} />
    </Elements>
  )
}
```

---

### Task 9: Create PayPalPayment component

**Files:**
- Create: `src/components/store/PayPalPayment.tsx`

- [ ] **Step 1: Create PayPal button component**

```tsx
'use client'

import { useEffect, useRef } from 'react'

declare global { interface Window { paypal?: any } }

export default function PayPalPayment({ amount, currency, onSuccess }: any) {
  const btnRef = useRef<HTMLDivElement>(null)
  const rendered = useRef(false)

  useEffect(() => {
    if (rendered.current || !btnRef.current) return
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=${currency || 'USD'}`
    script.onload = () => {
      if (!window.paypal || rendered.current) return
      rendered.current = true
      window.paypal.Buttons({
        createOrder: async () => {
          const res = await fetch('/api/payments/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, currency }),
          })
          const data = await res.json()
          return data.id
        },
        onApprove: async (data: any) => {
          const res = await fetch('/api/payments/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: data.orderID }),
          })
          const result = await res.json()
          if (result.status === 'COMPLETED') onSuccess(data.orderID)
        },
      }).render(btnRef.current)
    }
    document.body.appendChild(script)
    return () => { rendered.current = true }
  }, [])

  return <div ref={btnRef} />
}
```

---

### Task 10: Create InstaPayQR component

**Files:**
- Create: `src/components/store/InstaPayQR.tsx`

- [ ] **Step 1: Create InstaPay QR component**

```tsx
'use client'

import { useState } from 'react'

export default function InstaPayQR({ onReference }: { onReference: (ref: string) => void }) {
  const [ref, setRef] = useState('')

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-border p-4 text-center">
        <img src={process.env.NEXT_PUBLIC_INSTAPAY_QR_URL || '/images/instapay-qr.png'} alt="InstaPay QR" className="mx-auto w-48 h-48 object-contain" />
        <p className="text-sm text-muted-foreground mt-2">Scan with your banking app</p>
        <p className="text-sm font-medium text-navy mt-1">Phone: {process.env.NEXT_PUBLIC_INSTAPAY_PHONE}</p>
      </div>
      <div>
        <label className="text-sm font-medium text-navy">Transaction Reference</label>
        <input type="text" required value={ref} onChange={e => { setRef(e.target.value); onReference(e.target.value) }} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="Enter reference number after payment" />
      </div>
    </div>
  )
}
```

---

### Task 11: Create WalletPayment component

**Files:**
- Create: `src/components/store/WalletPayment.tsx`

- [ ] **Step 1: Create wallet payment component**

```tsx
'use client'

import { useState } from 'react'

const WALLETS: Record<string, { label: string; number: string }> = {
  'vodafone-cash': { label: 'Vodafone Cash', number: process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER || '0100xxxxxxx' },
  'orange-cash': { label: 'Orange Cash', number: process.env.NEXT_PUBLIC_ORANGE_CASH_NUMBER || '0100xxxxxxx' },
  'etisalat-wallet': { label: 'Etisalat Wallet', number: process.env.NEXT_PUBLIC_ETISALAT_WALLET_NUMBER || '0100xxxxxxx' },
  'fawry': { label: 'Fawry', number: process.env.NEXT_PUBLIC_FAWRY_REFERENCE || 'xxxxx' },
}

export default function WalletPayment({ provider, onReference }: any) {
  const wallet = WALLETS[provider]
  const [ref, setRef] = useState('')

  if (!wallet) return null

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <p className="text-sm font-medium text-navy">Send payment to:</p>
        <p className="text-lg font-bold text-navy mt-1">{wallet.label}</p>
        <p className="text-sm text-muted-foreground mt-1">Number: <span className="font-mono font-medium text-navy">{wallet.number}</span></p>
      </div>
      <div>
        <label className="text-sm font-medium text-navy">Transaction Reference</label>
        <input type="text" required value={ref} onChange={e => { setRef(e.target.value); onReference(e.target.value) }} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="Enter reference after sending" />
      </div>
    </div>
  )
}
```

---

### Task 12: Update CheckoutDialog with new payment methods

**Files:**
- Read: `src/components/store/CheckoutDialog.tsx`
- Modify: `src/components/store/CheckoutDialog.tsx`

- [ ] **Step 1: Read existing CheckoutDialog**

Read the file to understand the current payment step rendering.

- [ ] **Step 2: Update payment method selection**

Add new payment options to the existing list:
```tsx
// In the payment method step, add these options grouped:
const egyptWallets = [
  { value: 'vodafone-cash', label: 'Vodafone Cash', icon: '📱' },
  { value: 'orange-cash', label: 'Orange Cash', icon: '📱' },
  { value: 'etisalat-wallet', label: 'Etisalat Wallet', icon: '📱' },
  { value: 'fawry', label: 'Fawry', icon: '🏦' },
  { value: 'instapay', label: 'InstaPay QR', icon: '📷' },
]
```

Render the appropriate payment component based on selection:
```tsx
{paymentMethod === 'card' && <StripePayment amount={total} currency={currency} onSuccess={handlePaymentSuccess} />}
{paymentMethod === 'paypal' && <PayPalPayment amount={total} currency={currency} onSuccess={handlePaymentSuccess} />}
{paymentMethod === 'instapay' && <InstaPayQR onReference={(r) => setPayRef(r)} />}
{paymentMethod?.startsWith('vodafone') || etc && <WalletPayment provider={paymentMethod} onReference={(r) => setPayRef(r)} />}
```

Add `idempotencyKey` generation at the top of the dialog:
```tsx
const [idempotencyKey] = useState(() => crypto.randomUUID())
```

Pass `idempotencyKey` in the order creation payload.

Add pending order detection handling — if API returns `{ duplicateItems: true, existingOrder }`, show confirmation dialog.

---

### Task 13: Add lazy loading and performance optimizations

**Files:**
- Modify: `src/app/layout.tsx` (add preconnect hints)
- Modify: `src/components/store/CartDrawer.tsx` (lazy load)
- Modify: `src/components/store/CheckoutDialog.tsx` (lazy load payment components)

- [ ] **Step 1: Add preconnect hints in layout**

```tsx
// In src/app/layout.tsx <head>
<link rel="preconnect" href="https://js.stripe.com" />
<link rel="preconnect" href="https://www.paypal.com" />
<link rel="preconnect" href="https://accounts.google.com" />
```

- [ ] **Step 2: Lazy load payment components in CheckoutDialog**

Replace direct imports with:
```tsx
const StripePayment = dynamic(() => import('@/components/store/StripePayment'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-100 rounded-lg" />,
  ssr: false,
})
const PayPalPayment = dynamic(() => import('@/components/store/PayPalPayment'), {
  loading: () => <div className="animate-pulse h-10 bg-gray-100 rounded-lg" />,
  ssr: false,
})
```

---

### Task 14: Add admin verification UI

**Files:**
- Modify: `src/app/admin/orders/page.tsx`
- Modify: `src/app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Add verification filter to admin orders**

Add a filter tab for `paymentStatus = "awaiting_verification"` orders with Approve/Reject buttons.

- [ ] **Step 2: Add proof viewing on order detail**

Show `paymentProofUrl` as an image if present. Show `paymentReference` text. Add Approve/Reject buttons that call the API routes.

---

### Task 15: Update env and next.config

**Files:**
- Modify: `.env`
- Modify: `next.config.ts` (or .js)

- [ ] **Step 1: Add env vars**

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_SANDBOX=true
PAYPAL_WEBHOOK_ID=...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
NEXT_PUBLIC_INSTAPAY_QR_URL=/images/instapay-qr.png
NEXT_PUBLIC_INSTAPAY_PHONE=0100xxxxxxx
NEXT_PUBLIC_VODAFONE_CASH_NUMBER=0100xxxxxxx
NEXT_PUBLIC_ORANGE_CASH_NUMBER=0100xxxxxxx
NEXT_PUBLIC_ETISALAT_WALLET_NUMBER=0100xxxxxxx
NEXT_PUBLIC_FAWRY_REFERENCE=xxxxx
```

- [ ] **Step 2: Configure next.config for images**

```ts
// next.config.ts
images: {
  remotePatterns: [{ protocol: 'https', hostname: '**' }],
}
```
