# Payment Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize all payment method configuration in the admin panel with server-side payment verification.

**Architecture:** A new `PaymentMethod` model with encrypted JSON config. Admin page with Settings + Verification tabs. Frontend components fetch config from API instead of env vars. Order API verifies Stripe/PayPal server-side.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, AES-256-GCM encryption, Stripe SDK, PayPal REST API

---

## File Structure

### New files
- `prisma/migrations/` — auto-generated
- `src/lib/encryption.ts` — AES encrypt/decrypt
- `src/app/api/payment-methods/route.ts` — public list (active only)
- `src/app/api/admin/payment-methods/route.ts` — admin list all
- `src/app/api/admin/payment-methods/[id]/route.ts` — admin update
- `src/app/api/admin/payments/verifications/route.ts` — pending orders list
- `src/app/api/admin/payments/verify/route.ts` — approve payment
- `src/app/api/admin/payments/reject/route.ts` — reject payment
- `src/app/admin/payments/page.tsx` — admin page shell
- `src/components/admin/payments/SettingsTab.tsx` — settings tab
- `src/components/admin/payments/VerificationTab.tsx` — verification tab
- `src/components/admin/payments/MethodFormModal.tsx` — edit modal

### Modified files
- `prisma/schema.prisma` — add PaymentMethod model
- `prisma/seed.ts` — add payment method seeding
- `src/app/api/orders/route.ts` — add server-side Stripe/PayPal verification
- `src/components/store/CheckoutContent.tsx` — fetch methods from API
- `src/components/store/WalletPayment.tsx` — use method config
- `src/components/store/InstaPayQR.tsx` — use method config
- `src/components/store/StripePayment.tsx` — use dynamic key
- `src/components/store/PayPalPayment.tsx` — use dynamic client ID
- `src/components/admin/Sidebar.tsx` — add Payments link
- `src/lib/i18n/translations.ts` — remove hardcoded bank details

---

### Task 1: Add PaymentMethod model + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add PaymentMethod model to schema**

Add after the existing models, before the last `}`:

```prisma
model PaymentMethod {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  nameAr        String?
  description   String?
  descriptionAr String?
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)
  config        String   @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

- [ ] **Run migration**

```bash
cd C:\Users\obai\Desktop\website
npx prisma migrate dev --name add-payment-method
```

- [ ] **Commit**

```bash
git add prisma/
git commit -m "feat: add PaymentMethod model"
```

---

### Task 2: Encryption utility

**Files:**
- Create: `src/lib/encryption.ts`

- [ ] **Create the encryption utility**

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.ENCRYPTION_KEY || ''

function getKey(): Buffer {
  if (!KEY_HEX) throw new Error('ENCRYPTION_KEY env var is required')
  return Buffer.from(KEY_HEX, 'hex')
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag().toString('hex')
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  const key = getKey()
  const parts = encryptedText.split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted text format')
  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

- [ ] **Commit**

```bash
git add src/lib/encryption.ts
git commit -m "feat: add AES encryption utility"
```

---

### Task 3: Seed payment methods

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Add payment method seeding**

Add to the seed function (in the transaction block):

```typescript
const paymentMethods = [
  { code: 'card', name: 'Card (Stripe)', nameAr: 'بطاقة (Stripe)', sortOrder: 1, isActive: true, config: JSON.stringify({ publishableKey: '', secretKey: '', webhookSecret: '' }) },
  { code: 'paypal', name: 'PayPal', nameAr: 'PayPal', sortOrder: 2, isActive: true, config: JSON.stringify({ clientId: '', clientSecret: '', sandbox: true }) },
  { code: 'transfer', name: 'Bank Transfer', nameAr: 'تحويل بنكي', sortOrder: 3, isActive: true, config: JSON.stringify({ bankName: 'Garanti BBVA — Istanbul', bankNameAr: 'Garanti BBVA — إسطنبول', iban: 'TR12 0006 2001 2345 6789 0000 01', referenceInstructions: 'Use your order number as the payment reference.', referenceInstructionsAr: 'استخدم رقم طلبك كمرجع للدفع.' }) },
  { code: 'cod', name: 'Cash on Delivery', nameAr: 'الدفع عند الاستلام', sortOrder: 4, isActive: true, config: JSON.stringify({ handlingFee: 2 }) },
  { code: 'instapay', name: 'InstaPay QR', nameAr: 'InstaPay', sortOrder: 5, isActive: false, config: JSON.stringify({ phone: '', qrUrl: '' }) },
  { code: 'vodafone-cash', name: 'Vodafone Cash', nameAr: 'فودافون كاش', sortOrder: 6, isActive: false, config: JSON.stringify({ number: '' }) },
  { code: 'orange-cash', name: 'Orange Cash', nameAr: 'أورنج كاش', sortOrder: 7, isActive: false, config: JSON.stringify({ number: '' }) },
  { code: 'etisalat-wallet', name: 'Etisalat Wallet', nameAr: 'اتصالات Wallet', sortOrder: 8, isActive: false, config: JSON.stringify({ number: '' }) },
  { code: 'fawry', name: 'Fawry', nameAr: 'فوري', sortOrder: 9, isActive: false, config: JSON.stringify({ reference: '' }) },
]

for (const pm of paymentMethods) {
  await tx.paymentMethod.upsert({
    where: { code: pm.code },
    update: {},
    create: pm,
  })
}
```

- [ ] **Run seed**

```bash
npx prisma db seed
```

- [ ] **Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed payment methods"
```

---

### Task 4: Public API — payment methods

**Files:**
- Create: `src/app/api/payment-methods/route.ts`

- [ ] **Create public payment-methods endpoint**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function GET() {
  const methods = await db.paymentMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  const result = methods.map(m => ({
    ...m,
    config: m.config ? JSON.parse(decrypt(m.config)) : {},
  }))
  return NextResponse.json({ methods: result })
}
```

- [ ] **Commit**

```bash
git add src/app/api/payment-methods/
git commit -m "feat: add public payment methods API"
```

---

### Task 5: Admin API — Payment Methods CRUD

**Files:**
- Create: `src/app/api/admin/payment-methods/route.ts`
- Create: `src/app/api/admin/payment-methods/[id]/route.ts`

- [ ] **Create admin list endpoint**

```typescript
// src/app/api/admin/payment-methods/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { decrypt } from '@/lib/encryption'

export async function GET() {
  const methods = await db.paymentMethod.findMany({ orderBy: { sortOrder: 'asc' } })
  const result = methods.map(m => ({
    ...m,
    config: m.config ? JSON.parse(decrypt(m.config)) : {},
  }))
  return NextResponse.json({ methods: result })
}
```

- [ ] **Create admin update endpoint**

```typescript
// src/app/api/admin/payment-methods/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.nameAr !== undefined) data.nameAr = body.nameAr
  if (body.description !== undefined) data.description = body.description
  if (body.descriptionAr !== undefined) data.descriptionAr = body.descriptionAr
  if (body.isActive !== undefined) data.isActive = body.isActive
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder
  if (body.config !== undefined) data.config = encrypt(JSON.stringify(body.config))

  const method = await db.paymentMethod.update({ where: { id }, data })
  return NextResponse.json({ method: { ...method, config: body.config || {} } })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/payment-methods/
git commit -m "feat: add admin payment methods CRUD API"
```

---

### Task 6: Admin API — Payment Verification

**Files:**
- Create: `src/app/api/admin/payments/verifications/route.ts`
- Create: `src/app/api/admin/payments/verify/route.ts`
- Create: `src/app/api/admin/payments/reject/route.ts`

- [ ] **Create verifications list endpoint**

```typescript
// src/app/api/admin/payments/verifications/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [pending, stats] = await Promise.all([
    db.order.findMany({
      where: { paymentStatus: 'awaiting_verification' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true, orderNumber: true, fullName: true, totalAmount: true,
        paymentMethod: true, paymentReference: true, walletProvider: true,
        createdAt: true, notes: true,
      },
    }),
    db.order.aggregate({
      where: { paymentStatus: 'awaiting_verification' },
      _count: true,
    }),
  ])

  return NextResponse.json({ orders: pending, total: stats._count })
}
```

- [ ] **Create verify endpoint**

```typescript
// src/app/api/admin/payments/verify/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const { orderId } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await db.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: 'paid',
      status: 'processing',
      paymentVerifiedAt: new Date(),
    },
  })
  return NextResponse.json({ ok: true, order })
}
```

- [ ] **Create reject endpoint**

```typescript
// src/app/api/admin/payments/reject/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const { orderId, reason } = await req.json()
  if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

  const order = await db.order.findUnique({ where: { id: orderId }, select: { notes: true } })
  const existingNotes = order?.notes || ''
  const newNotes = reason ? `${existingNotes}\n[Rejected] ${reason}`.trim() : (existingNotes || '') + '\n[Rejected]'

  const updated = await db.order.update({
    where: { id: orderId },
    data: { paymentStatus: 'rejected', notes: newNotes },
  })
  return NextResponse.json({ ok: true, order: updated })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/payments/
git commit -m "feat: add payment verification API (list, approve, reject)"
```

---

### Task 7: Admin Settings Tab UI

**Files:**
- Create: `src/components/admin/payments/SettingsTab.tsx`
- Create: `src/components/admin/payments/MethodFormModal.tsx`

- [ ] **Create SettingsTab component**

```typescript
// src/components/admin/payments/SettingsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import MethodFormModal from './MethodFormModal'

type PaymentMethod = {
  id: string; code: string; name: string; nameAr: string | null
  description: string | null; descriptionAr: string | null
  isActive: boolean; sortOrder: number; config: Record<string, any>
}

const METHOD_LABELS: Record<string, string> = {
  card: 'Card (Stripe)', paypal: 'PayPal', transfer: 'Bank Transfer',
  cod: 'Cash on Delivery', instapay: 'InstaPay QR',
  'vodafone-cash': 'Vodafone Cash', 'orange-cash': 'Orange Cash',
  'etisalat-wallet': 'Etisalat Wallet', fawry: 'Fawry',
}

export default function SettingsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)

  useEffect(() => { fetchMethods() }, [])

  async function fetchMethods() {
    const res = await fetch('/api/admin/payment-methods')
    if (res.ok) { const d = await res.json(); setMethods(d.methods) }
    setLoading(false)
  }

  async function handleSave(data: Partial<PaymentMethod> & { config: Record<string, any> }) {
    const res = await fetch(`/api/admin/payment-methods/${editing!.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setEditing(null); fetchMethods() }
  }

  async function toggleActive(m: PaymentMethod) {
    await fetch(`/api/admin/payment-methods/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !m.isActive }),
    })
    fetchMethods()
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">Configure which payment methods are available and their settings.</p>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Order</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Method</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Code</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Active</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="px-4 py-3 text-muted-foreground text-xs">{m.sortOrder}</td>
                <td className="px-4 py-3 font-medium text-navy">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.code}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(m)} className={`px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(m)} className="text-xs text-gold hover:underline">Configure</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <MethodFormModal method={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  )
}
```

- [ ] **Create MethodFormModal component**

```typescript
// src/components/admin/payments/MethodFormModal.tsx
'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

type PaymentMethod = {
  id: string; code: string; name: string; nameAr: string | null
  description: string | null; descriptionAr: string | null
  isActive: boolean; sortOrder: number; config: Record<string, any>
}

type Props = {
  method: PaymentMethod
  onSave: (data: Partial<PaymentMethod> & { config: Record<string, any> }) => void
  onClose: () => void
}

const CONFIG_FIELDS: Record<string, { key: string; label: string; type: string }[]> = {
  card: [
    { key: 'publishableKey', label: 'Publishable Key', type: 'text' },
    { key: 'secretKey', label: 'Secret Key', type: 'password' },
    { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
  ],
  paypal: [
    { key: 'clientId', label: 'Client ID', type: 'text' },
    { key: 'clientSecret', label: 'Client Secret', type: 'password' },
    { key: 'sandbox', label: 'Sandbox Mode', type: 'checkbox' },
  ],
  transfer: [
    { key: 'bankName', label: 'Bank Name (English)', type: 'text' },
    { key: 'bankNameAr', label: 'Bank Name (Arabic)', type: 'text' },
    { key: 'iban', label: 'IBAN', type: 'text' },
    { key: 'referenceInstructions', label: 'Reference Instructions (English)', type: 'textarea' },
    { key: 'referenceInstructionsAr', label: 'Reference Instructions (Arabic)', type: 'textarea' },
  ],
  cod: [
    { key: 'handlingFee', label: 'Handling Fee (EGP)', type: 'number' },
  ],
  instapay: [
    { key: 'phone', label: 'Phone Number', type: 'text' },
    { key: 'qrUrl', label: 'QR Image URL', type: 'text' },
  ],
  'vodafone-cash': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  'orange-cash': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  'etisalat-wallet': [
    { key: 'number', label: 'Wallet Number', type: 'text' },
  ],
  fawry: [
    { key: 'reference', label: 'Fawry Reference', type: 'text' },
  ],
}

export default function MethodFormModal({ method, onSave, onClose }: Props) {
  const [name, setName] = useState(method.name)
  const [nameAr, setNameAr] = useState(method.nameAr || '')
  const [sortOrder, setSortOrder] = useState(method.sortOrder)
  const [config, setConfig] = useState<Record<string, any>>(method.config || {})

  const fields = CONFIG_FIELDS[method.code] || []

  function setConfigValue(key: string, value: any) {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ name, nameAr: nameAr || null, sortOrder, config })
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-navy">Configure: {method.name}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Name (English)</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Name (Arabic)</label>
              <input value={nameAr} onChange={e => setNameAr(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Sort Order</label>
            <input value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          {fields.length > 0 && <hr className="border-border" />}
          {fields.map(f => (
            <div key={f.key}>
              <label className="text-xs text-muted-foreground">{f.label}</label>
              {f.type === 'textarea' ? (
                <textarea value={config[f.key] || ''} onChange={e => setConfigValue(f.key, e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20" />
              ) : f.type === 'checkbox' ? (
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!config[f.key]} onChange={e => setConfigValue(f.key, e.target.checked)} className="accent-gold" />
                  {config[f.key] ? 'Enabled' : 'Disabled'}
                </label>
              ) : (
                <input value={config[f.key] || ''} onChange={e => setConfigValue(f.key, e.target.value)} type={f.type} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              )}
            </div>
          ))}
          <button type="submit" className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Save</button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/admin/payments/
git commit -m "feat: add payment settings tab with config modal"
```

---

### Task 8: Admin Verification Tab UI

**Files:**
- Create: `src/components/admin/payments/VerificationTab.tsx`

- [ ] **Create VerificationTab component**

```typescript
// src/components/admin/payments/VerificationTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CheckCircle, XCircle } from 'lucide-react'

type Order = {
  id: string; orderNumber: string; fullName: string; totalAmount: number
  paymentMethod: string; paymentReference: string | null; walletProvider: string | null
  createdAt: string; notes: string | null
}

export default function VerificationTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const res = await fetch('/api/admin/payments/verifications')
    if (res.ok) { const d = await res.json(); setOrders(d.orders); setTotal(d.total) }
    setLoading(false)
  }

  async function handleVerify(orderId: string) {
    const res = await fetch('/api/admin/payments/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }) })
    if (res.ok) { toast.success('Payment verified'); fetchOrders() }
    else toast.error('Failed to verify')
  }

  async function handleReject(orderId: string) {
    const res = await fetch('/api/admin/payments/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, reason: rejectReason }) })
    if (res.ok) { toast.success('Payment rejected'); setRejectId(null); setRejectReason(''); fetchOrders() }
    else toast.error('Failed to reject')
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm text-muted-foreground">{total} orders awaiting verification</p>
      </div>
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">No pending verifications.</p>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-start justify-between">
                <div className="text-sm space-y-1">
                  <p className="font-medium text-navy">{o.orderNumber}</p>
                  <p className="text-muted-foreground">{o.fullName}</p>
                  <p className="text-navy font-semibold">E£{o.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.paymentMethod}
                    {o.walletProvider && ` — ${o.walletProvider}`}
                    {o.paymentReference && ` — Ref: ${o.paymentReference}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleVerify(o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button onClick={() => setRejectId(rejectId === o.id ? null : o.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100">
                    <XCircle className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
              {rejectId === o.id && (
                <div className="mt-3 flex gap-2">
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection..." className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm" />
                  <button onClick={() => handleReject(o.id)} disabled={!rejectReason.trim()} className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium disabled:opacity-50">Confirm</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/admin/payments/VerificationTab.tsx
git commit -m "feat: add payment verification tab"
```

---

### Task 9: Admin Payments page shell + sidebar link

**Files:**
- Create: `src/app/admin/payments/page.tsx`
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Create admin payments page shell**

```typescript
// src/app/admin/payments/page.tsx
'use client'

import { useState } from 'react'
import SettingsTab from '@/components/admin/payments/SettingsTab'
import VerificationTab from '@/components/admin/payments/VerificationTab'

const TABS = [
  { id: 'settings', label: 'Settings' },
  { id: 'verification', label: 'Verification' },
]

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('settings')

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Payment Management</h1>
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-navy border-b-2 border-navy'
                : 'text-muted-foreground hover:text-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab === 'settings' && <SettingsTab />}
      {activeTab === 'verification' && <VerificationTab />}
    </div>
  )
}
```

- [ ] **Add Payments link to sidebar**

Read `src/components/admin/Sidebar.tsx`, find the import line and add `CreditCard` (or `Banknote`) to lucide-react imports, then add the link entry after the existing links (before the closing bracket of the array):

```typescript
import { ... CreditCard, ... } from 'lucide-react'
// Add to links array:
{ href: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'payments' },
```

- [ ] **Commit**

```bash
git add src/app/admin/payments/ src/components/admin/Sidebar.tsx
git commit -m "feat: add admin payments page and sidebar link"
```

---

### Task 10: CheckoutContent — fetch methods from API

**Files:**
- Modify: `src/components/store/CheckoutContent.tsx`

- [ ] **Update CheckoutContent to fetch payment methods from API**

Read the file first. Then:

1. Add a new state variable near the top:
```typescript
const [paymentMethods, setPaymentMethods] = useState<any[]>([])
```

2. Add a useEffect to fetch methods on mount (near the existing governorates useEffect):
```typescript
useEffect(() => {
  fetch('/api/payment-methods').then(r => r.json()).then(d => setPaymentMethods(d.methods || [])).catch(() => {})
}, [])
```

3. Find the payment method selection UI block. Replace the hardcoded method rendering with a dynamic one that filters `paymentMethods` and renders them in order. The key logic: find the `PAYMENT_METHODS` or equivalent section and replace with:

```typescript
const realtimeMethods = paymentMethods.filter(m => m.code === 'card' || m.code === 'paypal')
const manualMethods = paymentMethods.filter(m => m.code === 'transfer' || m.code === 'cod')
const walletMethods = paymentMethods.filter(m => !['card', 'paypal', 'transfer', 'cod'].includes(m.code))
```

Then render each group from the filtered arrays instead of the hardcoded lists.

- [ ] **Commit**

```bash
git add src/components/store/CheckoutContent.tsx
git commit -m "feat: fetch payment methods from API in checkout"
```

---

### Task 11: WalletPayment + InstaPayQR — use method config

**Files:**
- Modify: `src/components/store/WalletPayment.tsx`
- Modify: `src/components/store/InstaPayQR.tsx`

- [ ] **Update WalletPayment to use method prop**

Read the file, then replace hardcoded env var lookups:

```typescript
// WalletPayment.tsx
type Props = {
  method: { code: string; name: string; config: { number?: string } }
  onReference: (ref: string) => void
}

export default function WalletPayment({ method, onReference }: Props) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">Send payment to:</p>
        <p className="font-mono font-bold text-navy text-lg">{method.config.number || 'Not configured'}</p>
        <p className="text-xs text-muted-foreground mt-1">{method.name}</p>
      </div>
      <input
        onChange={e => onReference(e.target.value)}
        placeholder="Enter transaction reference"
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />
    </div>
  )
}
```

- [ ] **Update InstaPayQR to use method prop**

```typescript
// InstaPayQR.tsx
type Props = {
  method: { code: string; name: string; config: { phone?: string; qrUrl?: string } }
  onReference: (ref: string) => void
}

export default function InstaPayQR({ method, onReference }: Props) {
  return (
    <div className="space-y-3">
      {method.config.qrUrl && (
        <img src={method.config.qrUrl} alt="InstaPay QR" className="w-48 h-48 mx-auto" />
      )}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <p className="text-muted-foreground">Phone: <span className="font-mono font-bold text-navy">{method.config.phone || 'Not configured'}</span></p>
      </div>
      <input
        onChange={e => onReference(e.target.value)}
        placeholder="Enter transaction reference"
        className="w-full px-3 py-2 border border-border rounded-lg text-sm"
      />
    </div>
  )
}
```

- [ ] **Also update CheckoutContent to pass method prop to wallet/instapay components**

Find where `WalletPayment` and `InstaPayQR` are rendered, and pass `method={...}`:
```tsx
<WalletPayment method={...} onReference={...} />
<InstaPayQR method={...} onReference={...} />
```

- [ ] **Commit**

```bash
git add src/components/store/WalletPayment.tsx src/components/store/InstaPayQR.tsx
git commit -m "feat: wallet/instapay components use method config"
```

---

### Task 12: StripePayment — use dynamic publishable key

**Files:**
- Modify: `src/components/store/StripePayment.tsx`

- [ ] **Update StripePayment to accept publishableKey prop**

Read the file, then modify:

1. Remove the import from `@/lib/stripe-client` (or keep it but pass key as prop)
2. Accept `publishableKey` in props
3. Use it when calling `loadStripe`

```typescript
// StripePayment.tsx (relevant changes)
type Props = {
  amount: number
  currency: string
  onSuccess: (paymentIntentId: string) => void
  publishableKey: string
}
```

Replace `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)` with `loadStripe(publishableKey)`.

- [ ] **Update CheckoutContent to pass publishableKey**

Find where StripePayment is rendered and pass `publishableKey={...}` from the card method's config.

- [ ] **Commit**

```bash
git add src/components/store/StripePayment.tsx
git commit -m "feat: StripePayment uses dynamic publishable key"
```

---

### Task 13: PayPalPayment — use dynamic client ID

**Files:**
- Modify: `src/components/store/PayPalPayment.tsx`

- [ ] **Update PayPalPayment to accept clientId prop**

Read the file, then modify:

1. Accept `clientId` and `sandbox` in props
2. Use them when building the SDK URL

```typescript
// PayPalPayment.tsx (relevant changes)
type Props = {
  amount: number
  currency: string
  onSuccess: (orderId: string) => void
  clientId: string
  sandbox?: boolean
}
```

Replace `process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID` with `clientId` in the SDK URL.

- [ ] **Update CheckoutContent to pass clientId**

Find where PayPalPayment is rendered and pass `clientId={...}` and `sandbox={...}` from the paypal method's config.

- [ ] **Commit**

```bash
git add src/components/store/PayPalPayment.tsx
git commit -m "feat: PayPalPayment uses dynamic client ID"
```

---

### Task 14: Order API — server-side Stripe/PayPal verification

**Files:**
- Modify: `src/app/api/orders/route.ts`

- [ ] **Add Stripe and PayPal server-side verification**

Read the file. Find where payment status is set (around lines 171-172).

Add verification for card (Stripe):
```typescript
import { getStripe } from '@/lib/stripe'
```

Then after the Zod validation, before creating the order, add:

```typescript
// Server-side payment verification
if (rest.paymentMethod === 'card' && rest.stripePaymentIntentId) {
  try {
    const stripe = getStripe()
    const paymentIntent = await stripe.paymentIntents.retrieve(rest.stripePaymentIntentId)
    if (paymentIntent.status !== 'succeeded') {
      // Payment not confirmed — set as pending, webhook will confirm
      rest.paymentStatus = 'pending'
    }
  } catch {
    rest.paymentStatus = 'pending'
  }
}

if (rest.paymentMethod === 'paypal' && rest.paypalOrderId) {
  try {
    const { capturePayPalOrder } = await import('@/lib/paypal')
    const result = await capturePayPalOrder(rest.paypalOrderId)
    if (result.status !== 'COMPLETED') {
      rest.paymentStatus = 'pending'
    }
  } catch {
    rest.paymentStatus = 'pending'
  }
}
```

Note: This means `paymentStatus` should not be set in the order create `data` block based solely on method type — it should use the verified value from above.

- [ ] **Commit**

```bash
git add src/app/api/orders/route.ts
git commit -m "feat: add server-side Stripe and PayPal payment verification"
```

---

### Task 15: Remove hardcoded bank details from translations

**Files:**
- Modify: `src/lib/i18n/translations.ts`

- [ ] **Remove bank transfer hardcoded details**

Find `bankName`, `bankIban`, `bankReference` in both English and Arabic sections of `translations.ts`. Remove them (or replace with empty strings since the checkout will now read from the payment method config).

- [ ] **Commit**

```bash
git add src/lib/i18n/translations.ts
git commit -m "refactor: remove hardcoded bank details from translations"
```

---

### Task 16: Build verification

- [ ] **Run the build**

```bash
cd C:\Users\obai\Desktop\website
npx next build --webpack 2>&1
```

Expected: Compiled successfully.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete payment management system"
git push
```
