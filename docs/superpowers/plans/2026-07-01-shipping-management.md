# Shipping Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded flat-rate shipping (E£15 / E£250) with a full shipping management system: courier companies, governorate-based pricing, free shipping rules, shipment tracking, and shipping promo coupons.

**Architecture:** 6 new Prisma models + 11 API endpoints + 1 admin page with 4 tabs + enhanced discount system + dynamic checkout integration. Admin-only in v1 (rates managed via admin panel, consumed by storefront checkout).

**Tech Stack:** Next.js App Router, Prisma, TypeScript, Zustand

---

## File Structure Plan

### New files
- `prisma/migrations/` — auto-generated
- `src/lib/shipping.ts` — shared shipping calculator utility
- `src/app/admin/shipping/page.tsx` — admin page with 4 tabs
- `src/components/admin/shipping/MethodsTab.tsx`
- `src/components/admin/shipping/RatesTab.tsx`
- `src/components/admin/shipping/RulesTab.tsx`
- `src/components/admin/shipping/RuleFormModal.tsx`
- `src/components/admin/shipping/ShipmentsTab.tsx`
- `src/components/admin/shipping/ShipmentCreateModal.tsx`
- `src/app/api/admin/shipping/methods/route.ts`
- `src/app/api/admin/shipping/methods/[id]/route.ts`
- `src/app/api/admin/shipping/rates/route.ts`
- `src/app/api/admin/shipping/rules/route.ts`
- `src/app/api/admin/shipping/rules/[id]/route.ts`
- `src/app/api/admin/shipping/shipments/route.ts`
- `src/app/api/admin/shipping/shipments/create/route.ts`
- `src/app/api/shipping/governorates/route.ts`
- `src/app/api/shipping/methods/route.ts`

### Modified files
- `prisma/schema.prisma` — add 5 models, modify Order + Discount
- `src/app/api/admin/discounts/create/route.ts` — accept governorateId + SHIPPING type
- `src/app/admin/discounts/new/page.tsx` — add SHIPPING type UI + governorate dropdown
- `src/app/api/orders/route.ts` — use dynamic shipping calculator
- `src/components/store/CheckoutContent.tsx` — show shipping method selection, dynamic cost

---

### Task 1: Add Prisma models

**Files:**
- Modify: `prisma/schema.prisma`

**Steps:**

- [ ] **Add Governorate, ShippingMethod, ShippingRate, ShippingRule, Shipment models and modify Order + Discount**

```prisma
// Add after the existing models (before the Admin model around line 189)
model Governorate {
  id     String @id @default(cuid())
  name   String @unique
  nameAr String
}

model ShippingMethod {
  id            String        @id @default(cuid())
  name          String
  estimatedDays String
  isActive      Boolean       @default(true)
  createdAt     DateTime      @default(now())
  rates         ShippingRate[]
  shipments     Shipment[]
  rules         ShippingRule[]
}

model ShippingRate {
  id            String         @id @default(cuid())
  methodId      String
  method        ShippingMethod @relation(fields: [methodId], references: [id], onDelete: Cascade)
  governorateId String
  governorate   Governorate    @relation(fields: [governorateId], references: [id])
  price         Float

  @@unique([methodId, governorateId])
}

model ShippingRule {
  id            String         @id @default(cuid())
  name          String
  methodId      String?
  method        ShippingMethod? @relation(fields: [methodId], references: [id], onDelete: SetNull)
  minAmount     Float?
  governorateId String?
  governorate   Governorate?   @relation(fields: [governorateId], references: [id])
  discountType  String         // 'free' | 'percentage' | 'fixed'
  discountValue Float?
  isActive      Boolean        @default(true)
  startDate     DateTime?
  endDate       DateTime?
  createdAt     DateTime       @default(now())
}

model Shipment {
  id                  String         @id @default(cuid())
  orderId             String         @unique
  order               Order          @relation(fields: [orderId], references: [id])
  methodId            String
  method              ShippingMethod @relation(fields: [methodId], references: [id])
  trackingNumber      String
  status              String         @default("shipped") // shipped | delivered | failed
  shippedAt           DateTime?
  estimatedDeliveryAt DateTime?
  deliveredAt         DateTime?
  addressSnapshot     String         // JSON
  notes               String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
}
```

- [ ] **Add `governorateId` to Discount and `shippingMethodId` to Order**

Find the existing Discount model and add:
```prisma
model Discount {
  // ... existing fields ...
  governorateId String?
  governorate   Governorate? @relation(fields: [governorateId], references: [id])
  // ... existing relations ...
}
```

Find the existing Order model and add:
```prisma
model Order {
  // ... existing fields ...
  shippingMethodId String?
  shippingMethod   ShippingMethod? @relation(fields: [shippingMethodId], references: [id])
  // ... existing relations ...
}
```

- [ ] **Run migration**

```bash
npx prisma migrate dev --name add-shipping-models
```

---

### Task 2: Seed governorates

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Add governorate seeding to the existing seed file**

Add near the top of the seed function:
```typescript
const governorates = [
  { name: 'Cairo', nameAr: 'القاهرة' },
  { name: 'Alexandria', nameAr: 'الإسكندرية' },
  { name: 'Giza', nameAr: 'الجيزة' },
  { name: 'Qalyubia', nameAr: 'القليوبية' },
  { name: 'Port Said', nameAr: 'بورسعيد' },
  { name: 'Suez', nameAr: 'السويس' },
  { name: 'Damietta', nameAr: 'دمياط' },
  { name: 'Dakahlia', nameAr: 'الدقهلية' },
  { name: 'Sharqia', nameAr: 'الشرقية' },
  { name: 'Gharbia', nameAr: 'الغربية' },
  { name: 'Monufia', nameAr: 'المنوفية' },
  { name: 'Beheira', nameAr: 'البحيرة' },
  { name: 'Kafr El Sheikh', nameAr: 'كفر الشيخ' },
  { name: 'Minya', nameAr: 'المنيا' },
  { name: 'Asyut', nameAr: 'أسيوط' },
  { name: 'Sohag', nameAr: 'سوهاج' },
  { name: 'Qena', nameAr: 'قنا' },
  { name: 'Luxor', nameAr: 'الأقصر' },
  { name: 'Aswan', nameAr: 'أسوان' },
  { name: 'Red Sea', nameAr: 'البحر الأحمر' },
  { name: 'New Valley', nameAr: 'الوادي الجديد' },
  { name: 'Matrouh', nameAr: 'مطروح' },
  { name: 'North Sinai', nameAr: 'شمال سيناء' },
  { name: 'South Sinai', nameAr: 'جنوب سيناء' },
  { name: 'Beni Suef', nameAr: 'بني سويف' },
  { name: 'Fayoum', nameAr: 'الفيوم' },
  { name: 'Ismailia', nameAr: 'الإسماعيلية' },
]

for (const g of governorates) {
  await tx.governorate.upsert({
    where: { name: g.name },
    update: {},
    create: g,
  })
}
```

- [ ] **Run seed**

```bash
npx prisma db seed
```

- [ ] **Commit**

```bash
git add prisma/
git commit -m "feat: add shipping models and seed governorates"
```

---

### Task 3: Shared shipping calculator

**Files:**
- Create: `src/lib/shipping.ts`

- [ ] **Create the shipping calculator utility**

```typescript
import { db } from './db'

export type ShippingOption = {
  methodId: string
  methodName: string
  estimatedDays: string
  price: number
}

export async function getShippingOptions(governorateId: string): Promise<ShippingOption[]> {
  const rates = await db.shippingRate.findMany({
    where: {
      governorateId,
      method: { isActive: true },
    },
    include: { method: { select: { id: true, name: true, estimatedDays: true } } },
  })
  return rates.map(r => ({
    methodId: r.method.id,
    methodName: r.method.name,
    estimatedDays: r.method.estimatedDays,
    price: r.price,
  }))
}

export async function calculateShippingCost(params: {
  methodId: string
  governorateId: string
  subtotal: number
  couponCode?: string | null
}): Promise<{ baseCost: number; finalCost: number; discount: number; ruleName?: string }> {
  const rate = await db.shippingRate.findUnique({
    where: { methodId_governorateId: { methodId: params.methodId, governorateId: params.governorateId } },
  })
  if (!rate) throw new Error('Shipping not available for this method and location')

  const baseCost = rate.price
  let finalCost = baseCost

  // Check automatic shipping rules (no coupon required)
  const now = new Date()
  const matchingRules = await db.shippingRule.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ methodId: params.methodId }, { methodId: null }] },
        { OR: [{ minAmount: null }, { minAmount: { lte: params.subtotal } }] },
        { OR: [{ governorateId: params.governorateId }, { governorateId: null }] },
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  let bestDiscount = 0
  let bestRule: string | undefined
  for (const rule of matchingRules) {
    let discount = 0
    if (rule.discountType === 'free') {
      discount = baseCost
    } else if (rule.discountType === 'percentage' && rule.discountValue) {
      discount = baseCost * (rule.discountValue / 100)
    } else if (rule.discountType === 'fixed' && rule.discountValue) {
      discount = Math.min(rule.discountValue, baseCost)
    }
    if (discount > bestDiscount) {
      bestDiscount = discount
      bestRule = rule.name
    }
  }

  // Apply automatic rule discount
  finalCost = baseCost - bestDiscount

  // Check coupon (SHIPPING type) — overrides auto rules
  if (params.couponCode) {
    const coupon = await db.discount.findUnique({ where: { code: params.couponCode } })
    if (coupon && coupon.isActive && coupon.type === 'SHIPPING' && (!coupon.governorateId || coupon.governorateId === params.governorateId) && (!coupon.expiresAt || coupon.expiresAt >= now) && (!coupon.maxUses || coupon.usedCount < coupon.maxUses) && (!coupon.minOrder || params.subtotal >= coupon.minOrder)) {
      if (coupon.value === 0) {
        finalCost = 0
      } else {
        finalCost = baseCost - (baseCost * (coupon.value / 100))
      }
    }
  }

  return { baseCost, finalCost: Math.max(0, finalCost), discount: Math.max(0, baseCost - finalCost), ruleName: bestRule }
}
```

- [ ] **Commit**

```bash
git add src/lib/shipping.ts
git commit -m "feat: add shipping calculator utility"
```

---

### Task 4: Admin API — Shipping Methods CRUD

**Files:**
- Create: `src/app/api/admin/shipping/methods/route.ts`
- Create: `src/app/api/admin/shipping/methods/[id]/route.ts`

- [ ] **Create methods list + create endpoint**

```typescript
// src/app/api/admin/shipping/methods/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const methods = await db.shippingMethod.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ methods })
}

export async function POST(req: Request) {
  const { name, estimatedDays } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const method = await db.shippingMethod.create({ data: { name, estimatedDays: estimatedDays || '' } })
  return NextResponse.json({ method })
}
```

- [ ] **Create methods update + delete endpoint**

```typescript
// src/app/api/admin/shipping/methods/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name, estimatedDays, isActive } = await req.json()
  const method = await db.shippingMethod.update({ where: { id }, data: { name, estimatedDays, isActive } })
  return NextResponse.json({ method })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.shippingMethod.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/shipping/
git commit -m "feat: add shipping methods CRUD API"
```

---

### Task 5: Admin API — Shipping Rates

**Files:**
- Create: `src/app/api/admin/shipping/rates/route.ts`

- [ ] **Create rates GET + bulk-save endpoint**

```typescript
// src/app/api/admin/shipping/rates/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const [rates, methods, governorates] = await Promise.all([
    db.shippingRate.findMany(),
    db.shippingMethod.findMany({ where: { isActive: true } }),
    db.governorate.findMany({ orderBy: { name: 'asc' } }),
  ])
  return NextResponse.json({ rates, methods, governorates })
}

export async function PUT(req: Request) {
  const { rates } = await req.json()
  // rates: Array<{ methodId: string; governorateId: string; price: number }>
  await db.$transaction(async (tx) => {
    for (const r of rates) {
      await tx.shippingRate.upsert({
        where: { methodId_governorateId: { methodId: r.methodId, governorateId: r.governorateId } },
        update: { price: r.price },
        create: { methodId: r.methodId, governorateId: r.governorateId, price: r.price },
      })
    }
  })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/shipping/rates/route.ts
git commit -m "feat: add shipping rates API"
```

---

### Task 6: Admin API — Shipping Rules

**Files:**
- Create: `src/app/api/admin/shipping/rules/route.ts`
- Create: `src/app/api/admin/shipping/rules/[id]/route.ts`

- [ ] **Create rules list + create endpoint**

```typescript
// src/app/api/admin/shipping/rules/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const rules = await db.shippingRule.findMany({
    include: { method: { select: { name: true } }, governorate: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ rules })
}

export async function POST(req: Request) {
  const body = await req.json()
  const rule = await db.shippingRule.create({
    data: {
      name: body.name,
      methodId: body.methodId || null,
      minAmount: body.minAmount ? parseFloat(body.minAmount) : null,
      governorateId: body.governorateId || null,
      discountType: body.discountType,
      discountValue: body.discountValue ? parseFloat(body.discountValue) : null,
      isActive: body.isActive !== false,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json({ rule })
}
```

- [ ] **Create rules update + delete endpoint**

```typescript
// src/app/api/admin/shipping/rules/[id]/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const rule = await db.shippingRule.update({
    where: { id },
    data: {
      name: body.name,
      methodId: body.methodId || null,
      minAmount: body.minAmount ? parseFloat(body.minAmount) : null,
      governorateId: body.governorateId || null,
      discountType: body.discountType,
      discountValue: body.discountValue ? parseFloat(body.discountValue) : null,
      isActive: body.isActive,
      startDate: body.startDate ? new Date(body.startDate) : null,
      endDate: body.endDate ? new Date(body.endDate) : null,
    },
  })
  return NextResponse.json({ rule })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.shippingRule.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/shipping/rules/
git commit -m "feat: add shipping rules CRUD API"
```

---

### Task 7: Admin API — Shipments

**Files:**
- Create: `src/app/api/admin/shipping/shipments/route.ts`
- Create: `src/app/api/admin/shipping/shipments/create/route.ts`

- [ ] **Create shipments list endpoint**

```typescript
// src/app/api/admin/shipping/shipments/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const filter = url.searchParams.get('filter') || 'pending' // pending | all

  const shipments = await db.shipment.findMany({
    include: {
      order: { select: { orderNumber: true, fullName: true, totalAmount: true, createdAt: true, address: true, city: true } },
      method: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    ...(filter === 'pending' ? {} : {}),
  })

  // Get orders confirmed but not yet shipped
  const pendingOrders = filter === 'pending'
    ? await db.order.findMany({
        where: {
          status: 'confirmed',
          paymentStatus: 'paid',
          shipment: null,
          shippingMethodId: { not: null },
        },
        include: { shippingMethod: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
        take: 50,
      })
    : []

  return NextResponse.json({ shipments, pendingOrders })
}
```

- [ ] **Create shipment creation endpoint**

```typescript
// src/app/api/admin/shipping/shipments/create/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  const { orderId, methodId, trackingNumber, shippedAt, estimatedDeliveryAt, notes } = await req.json()
  if (!orderId || !methodId || !trackingNumber) {
    return NextResponse.json({ error: 'orderId, methodId, and trackingNumber are required' }, { status: 400 })
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { id: true, address: true, city: true, postalCode: true, country: true, fullName: true, phone: true },
  })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  const existing = await db.shipment.findUnique({ where: { orderId } })
  if (existing) return NextResponse.json({ error: 'Shipment already exists for this order' }, { status: 400 })

  const shipment = await db.$transaction(async (tx) => {
    const s = await tx.shipment.create({
      data: {
        orderId,
        methodId,
        trackingNumber,
        status: 'shipped',
        shippedAt: shippedAt ? new Date(shippedAt) : new Date(),
        estimatedDeliveryAt: estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : null,
        addressSnapshot: JSON.stringify(order),
        notes: notes || null,
      },
    })
    await tx.order.update({ where: { id: orderId }, data: { status: 'shipped' } })
    return s
  })

  return NextResponse.json({ shipment })
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/shipping/shipments/
git commit -m "feat: add shipments API"
```

---

### Task 8: Public API — Governorates + Methods

**Files:**
- Create: `src/app/api/shipping/governorates/route.ts`
- Create: `src/app/api/shipping/methods/route.ts`

- [ ] **Create public governorates endpoint**

```typescript
// src/app/api/shipping/governorates/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const governorates = await db.governorate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ governorates })
}
```

- [ ] **Create public methods endpoint**

```typescript
// src/app/api/shipping/methods/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const governorateId = url.searchParams.get('governorateId')
  if (!governorateId) return NextResponse.json({ error: 'governorateId is required' }, { status: 400 })

  const rates = await db.shippingRate.findMany({
    where: { governorateId, method: { isActive: true } },
    include: { method: { select: { id: true, name: true, estimatedDays: true } } },
    orderBy: { price: 'asc' },
  })
  const methods = rates.map(r => ({
    id: r.method.id,
    name: r.method.name,
    estimatedDays: r.method.estimatedDays,
    price: r.price,
  }))
  return NextResponse.json({ methods })
}
```

- [ ] **Commit**

```bash
git add src/app/api/shipping/
git commit -m "feat: add public shipping endpoints"
```

---

### Task 9: Admin Shipping Page — Shell + Methods Tab

**Files:**
- Create: `src/app/admin/shipping/page.tsx`
- Create: `src/components/admin/shipping/MethodsTab.tsx`

- [ ] **Create the admin shipping page shell with tab navigation**

```typescript
// src/app/admin/shipping/page.tsx
'use client'

import { useState } from 'react'
import MethodsTab from '@/components/admin/shipping/MethodsTab'
import RatesTab from '@/components/admin/shipping/RatesTab'
import RulesTab from '@/components/admin/shipping/RulesTab'
import ShipmentsTab from '@/components/admin/shipping/ShipmentsTab'

const TABS = [
  { id: 'methods', label: 'Shipping Methods' },
  { id: 'rates', label: 'Shipping Rates' },
  { id: 'rules', label: 'Free Shipping Rules' },
  { id: 'shipments', label: 'Shipments' },
]

export default function AdminShippingPage() {
  const [activeTab, setActiveTab] = useState('methods')

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Shipping Management</h1>
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
      {activeTab === 'methods' && <MethodsTab />}
      {activeTab === 'rates' && <RatesTab />}
      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'shipments' && <ShipmentsTab />}
    </div>
  )
}
```

- [ ] **Create MethodsTab component**

```typescript
// src/components/admin/shipping/MethodsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

type Method = { id: string; name: string; estimatedDays: string; isActive: boolean; createdAt: string }

export default function MethodsTab() {
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [days, setDays] = useState('')
  const [editing, setEditing] = useState<Method | null>(null)

  useEffect(() => { fetchMethods() }, [])

  async function fetchMethods() {
    const res = await fetch('/api/admin/shipping/methods')
    if (res.ok) { const d = await res.json(); setMethods(d.methods) }
    setLoading(false)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (editing) {
      await fetch(`/api/admin/shipping/methods/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, estimatedDays: days }) })
    } else {
      await fetch('/api/admin/shipping/methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, estimatedDays: days }) })
    }
    toast.success(editing ? 'Method updated' : 'Method created')
    setShowForm(false); setEditing(null); setName(''); setDays('')
    fetchMethods()
  }

  async function toggleActive(m: Method) {
    await fetch(`/api/admin/shipping/methods/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, isActive: !m.isActive }) })
    fetchMethods()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/shipping/methods/${id}`, { method: 'DELETE' })
    toast.success('Method deleted')
    fetchMethods()
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{methods.length} shipping methods</p>
        <button onClick={() => { setEditing(null); setName(''); setDays(''); setShowForm(!showForm) }} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          {showForm ? 'Cancel' : 'Add Method'}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Company name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={days} onChange={e => setDays(e.target.value)} placeholder="Estimated delivery (e.g. '1-3 business days')" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <button onClick={handleSave} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{editing ? 'Update' : 'Create'}</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Est. Delivery</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Active</th><th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th></tr></thead>
          <tbody>
            {methods.map(m => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-navy">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.estimatedDays}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(m)} className={`px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.isActive ? 'Active' : 'Inactive'}</button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(m); setName(m.name); setDays(m.estimatedDays); setShowForm(true) }} className="text-xs text-gold hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/shipping/ src/components/admin/shipping/MethodsTab.tsx
git commit -m "feat: add admin shipping page shell and methods tab"
```

---

### Task 10: Admin Shipping — Rates Tab

**Files:**
- Create: `src/components/admin/shipping/RatesTab.tsx`

- [ ] **Create rates matrix tab**

```typescript
// src/components/admin/shipping/RatesTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

type Governorate = { id: string; name: string }
type Method = { id: string; name: string }
type Rate = { methodId: string; governorateId: string; price: number }

export default function RatesTab() {
  const [governorates, setGovernorates] = useState<Governorate[]>([])
  const [methods, setMethods] = useState<Method[]>([])
  const [rates, setRates] = useState<Record<string, Record<string, string>>>({}) // [methodId][governorateId]
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch('/api/admin/shipping/rates')
    if (res.ok) {
      const d = await res.json()
      setGovernorates(d.governorates)
      setMethods(d.methods)
      const map: Record<string, Record<string, string>> = {}
      for (const m of d.methods) map[m.id] = {}
      for (const r of d.rates) {
        if (!map[r.methodId]) map[r.methodId] = {}
        map[r.methodId][r.governorateId] = r.price.toString()
      }
      setRates(map)
    }
    setLoading(false)
  }

  function setRate(methodId: string, governorateId: string, value: string) {
    setRates(prev => ({
      ...prev,
      [methodId]: { ...prev[methodId], [governorateId]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const payload: { methodId: string; governorateId: string; price: number }[] = []
    for (const [methodId, govs] of Object.entries(rates)) {
      for (const [governorateId, price] of Object.entries(govs)) {
        const p = parseFloat(price)
        if (!isNaN(p) && p >= 0) payload.push({ methodId, governorateId, price: p })
      }
    }
    const res = await fetch('/api/admin/shipping/rates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates: payload }) })
    if (res.ok) toast.success('Rates saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Set shipping price per governorate per method. Empty = not available.</p>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save All Rates'}</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium sticky left-0 bg-gray-50/50">Governorate</th>
              {methods.map(m => <th key={m.id} className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[100px]">{m.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {governorates.map(g => (
              <tr key={g.id} className="border-b border-border/50">
                <td className="px-3 py-2 font-medium text-navy sticky left-0 bg-white">{g.name}</td>
                {methods.map(m => (
                  <td key={m.id} className="px-2 py-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      value={rates[m.id]?.[g.id] ?? ''}
                      onChange={e => setRate(m.id, g.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/admin/shipping/RatesTab.tsx
git commit -m "feat: add shipping rates matrix tab"
```

---

### Task 11: Admin Shipping — Rules Tab

**Files:**
- Create: `src/components/admin/shipping/RulesTab.tsx`
- Create: `src/components/admin/shipping/RuleFormModal.tsx`

- [ ] **Create RuleFormModal component**

```typescript
// src/components/admin/shipping/RuleFormModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Rule = {
  id?: string; name: string; methodId: string; minAmount: string; governorateId: string
  discountType: string; discountValue: string; isActive: boolean
  startDate: string; endDate: string
}

type Props = {
  rule?: Rule | null
  onSave: (data: Rule) => void
  onClose: () => void
}

export default function RuleFormModal({ rule, onSave, onClose }: Props) {
  const [form, setForm] = useState<Rule>(rule || {
    name: '', methodId: '', minAmount: '', governorateId: '', discountType: 'free', discountValue: '', isActive: true, startDate: '', endDate: '',
  })
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([])
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/shipping/methods').then(r => r.json()).then(d => setMethods(d.methods || [])).catch(() => {})
    fetch('/api/admin/shipping/rates').then(r => r.json()).then(d => setGovernorates(d.governorates || [])).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-navy">{rule ? 'Edit Rule' : 'New Rule'}</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <div className="space-y-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rule name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <select value={form.methodId} onChange={e => setForm({...form, methodId: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">All methods</option>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input value={form.minAmount} onChange={e => setForm({...form, minAmount: e.target.value})} type="number" placeholder="Min order amount (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <select value={form.governorateId} onChange={e => setForm({...form, governorateId: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">All governorates</option>{governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
          <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="free">Free Shipping</option><option value="percentage">Percentage off Shipping</option><option value="fixed">Fixed amount off Shipping</option></select>
          {form.discountType !== 'free' && <input value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} type="number" placeholder={form.discountType === 'percentage' ? 'e.g. 50 for 50% off' : 'e.g. 20 for E£20 off'} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Start date (optional)</label><input value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-muted-foreground">End date (optional)</label><input value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          </div>
          <button onClick={() => onSave(form)} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Save Rule</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create RulesTab component**

```typescript
// src/components/admin/shipping/RulesTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import RuleFormModal from './RuleFormModal'

export default function RulesTab() {
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => { fetchRules() }, [])

  async function fetchRules() {
    const res = await fetch('/api/admin/shipping/rules')
    if (res.ok) { const d = await res.json(); setRules(d.rules) }
    setLoading(false)
  }

  async function handleSave(data: any) {
    const url = editing ? `/api/admin/shipping/rules/${editing.id}` : '/api/admin/shipping/rules'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success(editing ? 'Rule updated' : 'Rule created'); setShowModal(false); setEditing(null); fetchRules() }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
  }

  async function toggleActive(rule: any) {
    await fetch(`/api/admin/shipping/rules/${rule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rule, isActive: !rule.isActive }) })
    fetchRules()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/shipping/rules/${id}`, { method: 'DELETE' })
    toast.success('Rule deleted'); fetchRules()
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{rules.length} rules</p>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium">Add Rule</button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">Name</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Method</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Min Amount</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Governorate</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Discount</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Dates</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Active</th><th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th></tr></thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.method?.name || 'All'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.minAmount ? `E£${r.minAmount}` : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.governorate?.name || 'All'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.discountType === 'free' ? 'Free' : r.discountType === 'percentage' ? `${r.discountValue}% off` : `E£${r.discountValue} off`}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.startDate || r.endDate ? `${r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'} to ${r.endDate ? new Date(r.endDate).toLocaleDateString() : '—'}` : 'Always'}</td>
                <td className="px-4 py-3"><button onClick={() => toggleActive(r)} className={`px-2 py-0.5 rounded text-xs font-medium ${r.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.isActive ? 'Active' : 'Inactive'}</button></td>
                <td className="px-4 py-3 text-right"><button onClick={() => { setEditing(r); setShowModal(true) }} className="text-xs text-gold hover:underline mr-3">Edit</button><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && <RuleFormModal rule={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/admin/shipping/RulesTab.tsx src/components/admin/shipping/RuleFormModal.tsx
git commit -m "feat: add shipping rules tab with form modal"
```

---

### Task 12: Admin Shipping — Shipments Tab

**Files:**
- Create: `src/components/admin/shipping/ShipmentsTab.tsx`
- Create: `src/components/admin/shipping/ShipmentCreateModal.tsx`

- [ ] **Create ShipmentCreateModal component**

```typescript
// src/components/admin/shipping/ShipmentCreateModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Props = {
  order: { id: string; orderNumber: string; fullName: string; address: string; city: string; totalAmount: number }
  onSave: (data: any) => void
  onClose: () => void
}

export default function ShipmentCreateModal({ order, onSave, onClose }: Props) {
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([])
  const [methodId, setMethodId] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippedAt, setShippedAt] = useState(new Date().toISOString().slice(0, 10))
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('/api/admin/shipping/methods').then(r => r.json()).then(d => { const m = d.methods || []; setMethods(m); if (m.length > 0) setMethodId(m[0].id) }).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-navy">Create Shipment</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
          <p><span className="text-muted-foreground">Order:</span> <span className="font-medium text-navy">{order.orderNumber}</span></p>
          <p><span className="text-muted-foreground">Customer:</span> <span className="font-medium text-navy">{order.fullName}</span></p>
          <p><span className="text-muted-foreground">Address:</span> <span className="text-navy">{order.address}, {order.city}</span></p>
        </div>
        <div className="space-y-3">
          <select value={methodId} onChange={e => setMethodId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">Select method</option>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} placeholder="Tracking number *" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Shipped date</label><input value={shippedAt} onChange={e => setShippedAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-muted-foreground">Est. delivery date</label><input value={estimatedDeliveryAt} onChange={e => setEstimatedDeliveryAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none h-20" />
          <button onClick={() => onSave({ orderId: order.id, methodId, trackingNumber, shippedAt, estimatedDeliveryAt, notes })} disabled={!methodId || !trackingNumber} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">Create Shipment</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create ShipmentsTab component**

```typescript
// src/components/admin/shipping/ShipmentsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import ShipmentCreateModal from './ShipmentCreateModal'

export default function ShipmentsTab() {
  const [data, setData] = useState<{ shipments: any[]; pendingOrders: any[] }>({ shipments: [], pendingOrders: [] })
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [filter, setFilter] = useState('pending')

  useEffect(() => { fetchData() }, [filter])

  async function fetchData() {
    const res = await fetch(`/api/admin/shipping/shipments?filter=${filter}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }

  async function handleCreateShipment(body: any) {
    const res = await fetch('/api/admin/shipping/shipments/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) { toast.success('Shipment created'); setSelectedOrder(null); fetchData() }
    else { const e = await res.json(); toast.error(e.error || 'Failed') }
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('pending')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'pending' ? 'bg-navy text-silver' : 'bg-gray-100 text-muted-foreground'}`}>Pending Shipment</button>
        <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-navy text-silver' : 'bg-gray-100 text-muted-foreground'}`}>All Shipments</button>
      </div>

      {filter === 'pending' && data.pendingOrders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-navy mb-3">Orders Awaiting Shipment</h3>
          <div className="space-y-2">
            {data.pendingOrders.map(o => (
              <div key={o.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium text-navy">{o.orderNumber}</p>
                  <p className="text-muted-foreground">{o.fullName} — {o.city} — E£{o.totalAmount.toFixed(2)}</p>
                </div>
                <button onClick={() => setSelectedOrder(o)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium">Create Shipment</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {filter === 'all' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">Order</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Customer</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Method</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Tracking</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">Shipped</th></tr></thead>
            <tbody>
              {data.shipments.map(s => (
                <tr key={s.id} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium text-navy">{s.order.orderNumber}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.order.fullName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.method?.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-navy">{s.trackingNumber}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${s.status === 'delivered' ? 'bg-green-50 text-green-700' : s.status === 'shipped' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{s.shippedAt ? new Date(s.shippedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && <ShipmentCreateModal order={selectedOrder} onSave={handleCreateShipment} onClose={() => setSelectedOrder(null)} />}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/admin/shipping/ShipmentsTab.tsx src/components/admin/shipping/ShipmentCreateModal.tsx
git commit -m "feat: add shipments tab with create modal"
```

---

### Task 13: Enhanced Discount Creation (Admin)

**Files:**
- Modify: `src/app/admin/discounts/new/page.tsx`
- Modify: `src/app/api/admin/discounts/create/route.ts`

- [ ] **Update discount create API to accept governorateId and SHIPPING type**

```typescript
// src/app/api/admin/discounts/create/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { code, type, value, maxUses, expiresAt, appliesTo, targetValue, minOrder, governorateId } = await req.json()
    const discount = await db.discount.create({
      data: {
        code: code.toUpperCase().replace(/\s+/g, '_'),
        type,
        value: parseFloat(value),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        appliesTo: type === 'SHIPPING' ? 'all' : (appliesTo || 'all'),
        targetValue: type === 'SHIPPING' ? null : (targetValue || null),
        minOrder: minOrder ? parseFloat(minOrder) : null,
        governorateId: governorateId || null,
      },
    })
    return NextResponse.json({ discount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Update the discount creation page to add SHIPPING type + governorate selector**

```typescript
// src/app/admin/discounts/new/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'SHIPPING', label: 'Shipping Promo' },
]

export default function NewDiscountPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [appliesTo, setAppliesTo] = useState('all')
  const [targetValue, setTargetValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [governorateId, setGovernorateId] = useState('')
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/shipping/governorates').then(r => r.json()).then(d => setGovernorates(d.governorates || [])).catch(() => {})
    fetch('/api/categories?flat=true').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/discounts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code, type, value, maxUses, expiresAt: expiresAt || null,
        appliesTo: type === 'SHIPPING' ? null : appliesTo,
        targetValue: type === 'SHIPPING' ? null : targetValue,
        minOrder, governorateId: governorateId || null,
      }),
    })
    if (res.ok) { toast.success('Discount created'); router.push('/admin/discounts') }
    else { const err = await res.json(); toast.error(err.error || 'Failed') }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">New Discount</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">Code</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="SUMMER20" required className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>

        <div><label className="text-sm font-medium text-navy block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            {DISCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {type === 'SHIPPING' ? (
          <div>
            <label className="text-sm font-medium text-navy block mb-1">Shipping Discount Value</label>
            <select value={value} onChange={e => setValue(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="0">Free Shipping</option>
              <option value="50">50% off Shipping</option>
              <option value="25">25% off Shipping</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">For free shipping, select "0". For percentage off shipping, select the percentage.</p>
          </div>
        ) : (
          <div><label className="text-sm font-medium text-navy block mb-1">Value</label><input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01" placeholder={type === 'PERCENTAGE' ? '20' : '50'} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        )}

        {type === 'SHIPPING' && (
          <div><label className="text-sm font-medium text-navy block mb-1">Restrict to Governorate (optional)</label>
            <select value={governorateId} onChange={e => setGovernorateId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">All governorates</option>
              {governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">If set, coupon only works for delivery addresses in this governorate.</p>
          </div>
        )}

        {type !== 'SHIPPING' && (
          <>
            <div><label className="text-sm font-medium text-navy block mb-1">Applies To</label>
              <select value={appliesTo} onChange={e => setAppliesTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="all">All Products</option>
                <option value="category">Specific Category</option>
                <option value="tag">Specific Tag</option>
              </select>
            </div>
            {appliesTo === 'category' && (
              <div><label className="text-sm font-medium text-navy block mb-1">Category</label>
                <select value={targetValue} onChange={e => setTargetValue(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            {appliesTo === 'tag' && (
              <div><label className="text-sm font-medium text-navy block mb-1">Tag Keyword</label><input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g. summer" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-navy block mb-1">Min Order (optional)</label><input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" placeholder="0 = no minimum" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          <div><label className="text-sm font-medium text-navy block mb-1">Max Uses (optional)</label><input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" placeholder="0 = unlimited" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        </div>

        <div><label className="text-sm font-medium text-navy block mb-1">Expires At (optional)</label><input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>

        <button type="submit" className="w-full px-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Create Discount</button>
      </form>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/discounts/new/page.tsx src/app/api/admin/discounts/create/route.ts
git commit -m "feat: add SHIPPING discount type with governorate targeting"
```

---

### Task 14: Checkout Integration — Dynamic Shipping

**Files:**
- Modify: `src/components/store/CheckoutContent.tsx`
- Modify: `src/app/api/orders/route.ts`

This task is the most complex — it replaces the hardcoded E£15/E£250 flat rate with the dynamic shipping system.

- [ ] **Update CheckoutContent to fetch and display shipping options**

The key changes in CheckoutContent.tsx:
1. When the user enters a delivery address → detect governorate from city field
2. Fetch available shipping methods from `/api/shipping/methods?governorateId=X`
3. Show a shipping method selector in the checkout form
4. Pass selected method to the order creation API
5. Display computed shipping cost dynamically

Changes to the existing component (add a shipping method selector after the address fields, before the summary):

```typescript
// Add near the top with other fetches:
const [shippingMethods, setShippingMethods] = useState<any[]>([])
const [selectedMethodId, setSelectedMethodId] = useState('')
const [shippingCost, setShippingCost] = useState(0)
const [governorates, setGovernorates] = useState<any[]>([])
const [matchedGovernorate, setMatchedGovernorate] = useState('')

// Fetch governorates on mount
useEffect(() => {
  fetch('/api/shipping/governorates').then(r => r.json()).then(d => setGovernorates(d.governorates || [])).catch(() => {})
}, [])

// When city changes, try to match a governorate
useEffect(() => {
  if (!form.city) { setShippingMethods([]); setSelectedMethodId(''); return }
  const match = governorates.find(g => form.city.toLowerCase().includes(g.name.toLowerCase()))
  if (match) {
    setMatchedGovernorate(match.id)
    fetch(`/api/shipping/methods?governorateId=${match.id}`).then(r => r.json()).then(d => {
      setShippingMethods(d.methods || [])
      if (d.methods?.length > 0) setSelectedMethodId(d.methods[0].id)
    }).catch(() => {})
  } else {
    setShippingMethods([])
    setMatchedGovernorate('')
  }
}, [form.city, governorates])

// Calculate shipping cost
const shipping = (() => {
  if (total >= FREE_SHIPPING_THRESHOLD && !selectedMethodId) return 0
  const method = shippingMethods.find(m => m.id === selectedMethodId)
  return method?.price ?? (total >= 250 ? 0 : 15) // fallback to old logic
})()

// Update the total calculation to use the dynamic shipping
const grandTotal = total + shipping + tax + (form.giftWrap ? 5 : 0)
```

And add a shipping method selector in the form UI:
```tsx
{shippingMethods.length > 0 && (
  <div>
    <label className="text-sm font-medium text-navy block mb-2">Shipping Method</label>
    <div className="space-y-2">
      {shippingMethods.map(m => (
        <label key={m.id} className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer ${selectedMethodId === m.id ? 'border-gold bg-gold/5' : 'border-border'}`}>
          <div className="flex items-center gap-3">
            <input type="radio" name="shipping" checked={selectedMethodId === m.id} onChange={() => setSelectedMethodId(m.id)} className="accent-gold" />
            <div>
              <p className="text-sm font-medium text-navy">{m.name}</p>
              <p className="text-xs text-muted-foreground">{m.estimatedDays}</p>
            </div>
          </div>
          <span className="text-sm font-bold text-navy">{m.price === 0 ? 'Free' : `E£${m.price.toFixed(2)}`}</span>
        </label>
      ))}
    </div>
  </div>
)}
```

Also pass the selected method ID in the order submission:
```typescript
// In the submitOrder body, add:
shippingMethodId: selectedMethodId
```

- [ ] **Update the orders API to use dynamic shipping calculator**

Modify `src/app/api/orders/route.ts` — replace the hardcoded shipping calculation:

```typescript
// Before: const shipping = subtotal >= 250 ? 0 : 15

// Replace with:
let shipping = 0
let shippingMethodId = body.shippingMethodId || null
if (body.shippingMethodId) {
  // Use the dynamic calculator
  const { calculateShippingCost } = await import('@/lib/shipping')
  // Need to determine governorate from the address city
  const governorate = await db.governorate.findFirst({
    where: { name: { contains: body.city } },
  })
  if (governorate) {
    const result = await calculateShippingCost({
      methodId: body.shippingMethodId,
      governorateId: governorate.id,
      subtotal,
      couponCode: body.discountCode,
    })
    shipping = result.finalCost
  }
} else {
  // Fallback
  shipping = subtotal >= 250 ? 0 : 15
}
```

Also ensure the order is created with the shippingMethodId:
```typescript
// In the order create, add:
shippingMethodId: shippingMethodId,
```

- [ ] **Commit**

```bash
git add src/components/store/CheckoutContent.tsx src/app/api/orders/route.ts
git commit -m "feat: integrate dynamic shipping in checkout"
```

---

### Task 15: Build verification

- [ ] **Run the build**

```bash
npx prisma generate
npx next build --webpack
```

Expected: All pages compile successfully, no TypeScript errors.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete shipping management system"
```

---

## Self-Review Checklist

- [ ] **Spec coverage:** Every requirement from the spec has at least one task implementing it:
  - Governorate model + seed → Task 1, Task 2
  - ShippingMethod model + CRUD → Task 1, Task 4
  - ShippingRate model + matrix grid → Task 1, Task 5, Task 10
  - ShippingRule model + CRUD → Task 1, Task 6, Task 11
  - Shipment model + creation → Task 1, Task 7, Task 12
  - Discount SHIPPING type + governorateId → Task 1, Task 13
  - Admin shipping page with 4 tabs → Task 9, 10, 11, 12
  - Discount creation page enhancement → Task 13
  - Public governorates + methods APIs → Task 8
  - Checkout integration → Task 14
  - Shipping calculator → Task 3
- [ ] **No placeholders:** All code blocks contain complete implementations.
- [ ] **Type consistency:** Method names, type signatures match across tasks.
