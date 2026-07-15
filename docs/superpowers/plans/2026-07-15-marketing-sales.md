# Marketing & Sales Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add comprehensive marketing and sales features to the admin panel: abandoned cart recovery, enhanced coupon management, email campaigns, push campaigns, SEO management, referral program, gift cards, and flash sales.

**Architecture:** New /admin/marketing/ route grouping all marketing features. New Prisma models for AbandonedCart, EmailCampaign, CustomerPushToken, PushCampaign, Referral, ReferralConfig, GiftCard, SaleCampaign. Existing Discount system extended with GET list/edit API. Existing SiteSetting model reused for SEO settings.

**Tech Stack:** Next.js 14, React 18, Prisma, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, sonner, framer-motion

---

### Task 1: Add new Prisma models for marketing features

**Files:**
- Modify: prisma/schema.prisma

- [ ] **Add AbandonedCart, EmailCampaign, CustomerPushToken, PushCampaign, Referral, ReferralConfig, GiftCard, SaleCampaign models**

Insert after the OtpVerification model (line 736):

`prisma
// ── Marketing & Sales ──

model AbandonedCart {
  id        String   @id @default(cuid())
  userId    String?
  email     String
  name      String?
  items     String   // JSON array
  total     Float
  reminderSentAt DateTime?
  remindedCount Int      @default(0)
  convertedOrderId String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([email])
  @@index([createdAt])
}

model EmailCampaign {
  id          String    @id @default(cuid())
  name        String
  subject     String
  content     String
  segment     String    @default("all")
  segmentIds  String?
  status      String    @default("draft")
  sentCount   Int       @default(0)
  totalCount  Int       @default(0)
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([status])
}

model CustomerPushToken {
  id        String   @id @default(cuid())
  token     String   @unique
  platform  String   @default("android")
  userId    String?
  email     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
}

model PushCampaign {
  id          String    @id @default(cuid())
  name        String
  title       String
  body        String
  data        String?
  segment     String    @default("all")
  status      String    @default("draft")
  sentCount   Int       @default(0)
  totalCount  Int       @default(0)
  scheduledAt DateTime?
  sentAt      DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([status])
}

model Referral {
  id            String    @id @default(cuid())
  referrerId    String
  referredEmail String?
  referredId    String?
  code          String
  rewardType    String    @default("discount")
  rewardValue   Float     @default(0)
  status        String    @default("pending")
  createdAt     DateTime  @default(now())
  rewardedAt    DateTime?
  expiresAt     DateTime?
  @@index([referrerId])
  @@index([code])
}

model ReferralConfig {
  id            String @id @default(cuid())
  rewardType    String @default("discount")
  rewardValue   Float  @default(10)
  minOrder      Float  @default(0)
  maxPerUser    Int    @default(10)
  discountDays  Int    @default(30)
  isActive      Boolean @default(true)
  updatedAt     DateTime @updatedAt
}

model GiftCard {
  id          String    @id @default(cuid())
  code        String    @unique
  initialBalance Float  @default(0)
  balance     Float     @default(0)
  recipientEmail String?
  recipientName String?
  senderName  String?
  message     String?
  isActive    Boolean   @default(true)
  expiresAt   DateTime?
  issuedAt    DateTime  @default(now())
  redeemedAt  DateTime?
  orderId     String?
}

model SaleCampaign {
  id          String    @id @default(cuid())
  name        String
  slug        String    @unique
  description String?
  discountType  String  @default("PERCENTAGE")
  discountValue Float
  appliesTo   String    @default("all")
  targetValue String?
  minOrder    Float?
  startDate   DateTime
  endDate     DateTime
  isActive    Boolean   @default(true)
  bannerImage String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  @@index([isActive, startDate, endDate])
}
`

Run: 
px prisma generate

---

### Task 2: Add marketing permissions and sidebar entry

**Files:**
- Modify: src/lib/admin-permissions.ts
- Modify: src/components/admin/Sidebar.tsx

- [ ] **Add marketing to ALL_PERMISSIONS**

In src/lib/admin-permissions.ts:9, change to:

`	s
export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed', 'customer_service', 'social',
  'marketing',
] as const
`

- [ ] **Add Marketing sidebar link**

In src/components/admin/Sidebar.tsx, add Megaphone to imports and add after the newsletter link:

`	sx
import { ..., Megaphone } from 'lucide-react'

// In links array after newsletter:
{ href: '/admin/marketing', label: 'Marketing', icon: Megaphone, permission: 'marketing' },
`

---

### Task 3: Create marketing dashboard page

**Files:**
- Create: src/app/admin/marketing/layout.tsx
- Create: src/app/admin/marketing/page.tsx

- [ ] **Create layout**

src/app/admin/marketing/layout.tsx:

`	sx
import { ReactNode } from 'react'
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
`

- [ ] **Create marketing dashboard**

src/app/admin/marketing/page.tsx:

`	sx
'use client'
import Link from 'next/link'
import { ShoppingCart, Tag, Mail, Bell, Search, Gift, Percent, Zap } from 'lucide-react'

const sections = [
  { href: '/admin/marketing/abandoned-carts', label: 'Abandoned Carts', desc: 'Recover lost sales', icon: ShoppingCart },
  { href: '/admin/marketing/coupons', label: 'Coupons', desc: 'Manage discount codes', icon: Tag },
  { href: '/admin/marketing/email-campaigns', label: 'Email Campaigns', desc: 'Send newsletters & promotions', icon: Mail },
  { href: '/admin/marketing/push-campaigns', label: 'Push Campaigns', desc: 'Send push notifications', icon: Bell },
  { href: '/admin/marketing/seo', label: 'SEO', desc: 'Meta titles, sitemaps & robots.txt', icon: Search },
  { href: '/admin/marketing/referrals', label: 'Referral Program', desc: 'Manage referrals & rewards', icon: Gift },
  { href: '/admin/marketing/gift-cards', label: 'Gift Cards', desc: 'Issue & track gift cards', icon: Percent },
  { href: '/admin/marketing/flash-sales', label: 'Flash Sales', desc: 'Time-limited promotions', icon: Zap },
]

export default function MarketingDashboard() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Marketing & Sales</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage promotions, campaigns, and customer engagement</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map(item => (
          <Link key={item.href} href={item.href}
            className="p-5 rounded-xl bg-white border border-border hover:shadow-md hover:border-gold/30 transition-all group">
            <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold/20">
              <item.icon className="h-5 w-5 text-gold" />
            </div>
            <h3 className="font-semibold text-navy group-hover:text-gold">{item.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
`

---

### Task 4: Add Discount GET list and PUT edit API routes

**Files:**
- Create: src/app/api/admin/discounts/route.ts
- Create: src/app/api/admin/discounts/[id]/route.ts

- [ ] **GET list route**

src/app/api/admin/discounts/route.ts:

`	s
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const discounts = await db.discount.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ discounts })
}, 'discounts')
`

- [ ] **GET/PUT/DELETE single discount**

src/app/api/admin/discounts/[id]/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req, { params }) => {
  const discount = await db.discount.findUnique({ where: { id: params.id } })
  if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ discount })
}, 'discounts')

export const PUT = withAdmin(async (req, { params }) => {
  const discount = await db.discount.findUnique({ where: { id: params.id } })
  if (!discount) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { code, type, value, maxUses, expiresAt, appliesTo, targetValue, minOrder, isActive, governorateId } = await req.json()
  const data: any = {}
  if (code !== undefined) data.code = code.toUpperCase().replace(/\s+/g, '_')
  if (type !== undefined) data.type = type
  if (value !== undefined) data.value = parseFloat(value)
  if (maxUses !== undefined) data.maxUses = maxUses ? parseInt(maxUses) : null
  if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null
  if (appliesTo !== undefined) data.appliesTo = appliesTo
  if (targetValue !== undefined) data.targetValue = targetValue || null
  if (minOrder !== undefined) data.minOrder = minOrder ? parseFloat(minOrder) : null
  if (isActive !== undefined) data.isActive = isActive
  if (governorateId !== undefined) data.governorateId = governorateId || null
  const updated = await db.discount.update({ where: { id: params.id }, data })
  return NextResponse.json({ discount: updated })
}, 'discounts')

export const DELETE = withAdmin(async (_req, { params }) => {
  await db.discount.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'discounts')
`

---

### Task 5: Create coupons management page

**Files:**
- Create: src/app/admin/marketing/coupons/page.tsx
- Create: src/app/admin/marketing/coupons/[id]/page.tsx

- [ ] **Coupons list page**

src/app/admin/marketing/coupons/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Percent, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

export default function CouponsPage() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  function fetchDiscounts() {
    setLoading(true)
    fetch('/api/admin/discounts').then(r => r.json()).then(data => setDiscounts(Array.isArray(data.discounts) ? data.discounts : [])).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }
  useEffect(() => { fetchDiscounts() }, [])
  async function handleDelete() {
    if (!deleteId) return
    try { const res = await fetch('/api/admin/discounts/' + deleteId, { method: 'DELETE' }); if (res.ok) { setDiscounts(prev => prev.filter(d => d.id !== deleteId)); toast.success('Deleted') } else toast.error('Failed') } catch { toast.error('Failed') }
    finally { setDeleteId(null) }
  }
  const columns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-0.5 rounded text-xs">{row.original.code}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="flex items-center gap-1 text-muted-foreground text-xs">{row.original.type === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}{row.original.type}</span> },
    { accessorKey: 'value', header: 'Value', cell: ({ row }) => <span className="font-medium text-navy">{row.original.type === 'PERCENTAGE' ? row.original.value + '%' : '$' + row.original.value.toFixed(2)}</span> },
    { accessorKey: 'usedCount', header: 'Usage', cell: ({ row }) => <span className="text-muted-foreground">{row.original.usedCount}{row.original.maxUses ? ' / ' + row.original.maxUses : ''}</span> },
    { accessorKey: 'expiresAt', header: 'Expires', cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}</span> },
    { accessorKey: 'isActive', header: 'Active', cell: ({ row }) => <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{row.original.isActive ? 'Active' : 'Inactive'}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={'/admin/marketing/coupons/' + row.original.id} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /></Link>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    )},
  ]
  return (
    <div>
      <PageHeader title="Coupons" backHref="/admin/marketing" actions={<Link href="/admin/discounts/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create Coupon</Link>} />
      <DataTable columns={columns} data={discounts} loading={loading} keyExtractor={d => d.id} emptyTitle="No coupons yet" emptyDescription="Create your first discount coupon" emptyAction={{ label: 'Create Coupon', onClick: () => window.location.href = '/admin/discounts/new' }} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete" description="This cannot be undone." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
`

- [ ] **Coupon edit page**

src/app/admin/marketing/coupons/[id]/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditCouponPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [appliesTo, setAppliesTo] = useState('all')
  const [targetValue, setTargetValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetch('/api/admin/discounts/' + params.id).then(r => r.json()).then(data => {
      const d = data.discount; setCode(d.code); setType(d.type); setValue(String(d.value))
      setMaxUses(d.maxUses ? String(d.maxUses) : ''); setExpiresAt(d.expiresAt ? d.expiresAt.split('T')[0] : '')
      setAppliesTo(d.appliesTo || 'all'); setTargetValue(d.targetValue || ''); setMinOrder(d.minOrder ? String(d.minOrder) : ''); setIsActive(d.isActive)
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/admin/discounts/' + params.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, type, value, maxUses, expiresAt: expiresAt || null, appliesTo, targetValue, minOrder, isActive }) })
    if (res.ok) { toast.success('Updated'); router.push('/admin/marketing/coupons') } else { const err = await res.json(); toast.error(err.error || 'Failed') }
    setSaving(false)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-16" /></div>
  return (
    <div className="max-w-lg">
      <PageHeader title="Edit Coupon" backHref="/admin/marketing/coupons" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-navy">Active</label>
          <button type="button" onClick={() => setIsActive(!isActive)} className={'h-5 w-9 rounded-full transition-colors ' + (isActive ? 'bg-green-500' : 'bg-gray-300')}>
            <div className={'h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ' + (isActive ? 'translate-x-4' : 'translate-x-0.5')} />
          </button>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Code</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed Amount</option><option value="SHIPPING">Shipping Promo</option>
          </select>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Value</label><input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Applies To</label>
          <select value={appliesTo} onChange={e => setAppliesTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">All Products</option><option value="category">Specific Category</option><option value="tag">Specific Tag</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-navy block mb-1">Min Order</label><input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          <div><label className="text-sm font-medium text-navy block mb-1">Max Uses</label><input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Expires At</label><input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  )
}
`

---

### Task 6: Abandoned Cart Recovery — API routes

**Files:**
- Create: src/app/api/cart/track/route.ts
- Create: src/app/api/abandoned-carts/route.ts
- Create: src/app/api/abandoned-carts/send-reminder/route.ts

- [ ] **Cart tracking endpoint**

src/app/api/cart/track/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, name, userId, items, total } = await req.json()
    if (!email || !items || !total) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const existing = await db.abandonedCart.findFirst({ where: { email, convertedOrderId: null }, orderBy: { createdAt: 'desc' } })
    if (existing) {
      await db.abandonedCart.update({ where: { id: existing.id }, data: { items: JSON.stringify(items), total: parseFloat(total), name: name || null, updatedAt: new Date() } })
    } else {
      await db.abandonedCart.create({ data: { email, name: name || null, userId: userId || null, items: JSON.stringify(items), total: parseFloat(total) } })
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
`

- [ ] **Abandoned carts list API**

src/app/api/abandoned-carts/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 50; const skip = (page - 1) * take
  const where: any = { convertedOrderId: null }
  if (search) where.OR = [{ email: { contains: search, mode: 'insensitive' } }, { name: { contains: search, mode: 'insensitive' } }]
  const [carts, total] = await Promise.all([db.abandonedCart.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), db.abandonedCart.count({ where })])
  return NextResponse.json({ carts, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')
`

- [ ] **Send reminder API**

src/app/api/abandoned-carts/send-reminder/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sendEmail } from '@/lib/email'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { cartId } = await req.json()
    const cart = await db.abandonedCart.findUnique({ where: { id: cartId } })
    if (!cart) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const items = JSON.parse(cart.items) as { name: string; quantity: number; price: number }[]
    const itemsHtml = items.map(i => '<tr><td style="padding:8px;border-bottom:1px solid #eee">' + i.name + '</td><td style="padding:8px;border-bottom:1px solid #eee">x' + i.quantity + '</td><td style="padding:8px;border-bottom:1px solid #eee">$' + i.price.toFixed(2) + '</td></tr>').join('')
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || 'http://localhost:3000'
    const sent = await sendEmail({
      to: cart.email, subject: 'You left something in your cart!',
      html: '<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;"><h1 style="color:#1e3a5f;">Hey' + (cart.name ? ' ' + cart.name : '') + '!</h1><p>Your items are waiting!</p><table style="width:100%;border-collapse:collapse;margin:16px 0;">' + itemsHtml + '</table><p style="font-size:1.2em;font-weight:bold;color:#1e3a5f;">Total: $' + cart.total.toFixed(2) + '</p><a href="' + storeUrl + '/cart" style="display:inline-block;padding:12px 32px;background:#c9a84c;color:#0a1628;text-decoration:none;border-radius:8px;font-weight:bold;">Return to Cart</a></div>',
      text: 'You left items in your cart worth $' + cart.total.toFixed(2) + '. Return: ' + storeUrl + '/cart',
    })
    if (sent) { await db.abandonedCart.update({ where: { id: cartId }, data: { reminderSentAt: new Date(), remindedCount: { increment: 1 } } }); return NextResponse.json({ ok: true }) }
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

---

### Task 7: Abandoned Cart Recovery — Admin page

**Files:**
- Create: src/app/admin/marketing/abandoned-carts/page.tsx

- [ ] **Create abandoned carts page**

src/app/admin/marketing/abandoned-carts/page.tsx:

`	sx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Mail, Clock, ShoppingCart, RefreshCw } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { SearchInput } from '@/components/admin/SearchInput'
import { StatsCard } from '@/components/admin/StatsCard'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type Cart = { id: string; email: string; name: string | null; items: string; total: number; remindedCount: number; reminderSentAt: string | null; createdAt: string }

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]); const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')

  function fetchCarts() {
    setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search)
    fetch('/api/abandoned-carts?' + p).then(r => r.json()).then(d => { setCarts(d.carts || []); setTotal(d.total); setTotalPages(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchCarts() }, [page])

  async function sendReminder(cartId: string) {
    setSendingId(cartId)
    try { const res = await fetch('/api/abandoned-carts/send-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId }) }); if (res.ok) { toast.success('Sent'); setCarts(prev => prev.map(c => c.id === cartId ? { ...c, remindedCount: c.remindedCount + 1, reminderSentAt: new Date().toISOString() } : c)) } else toast.error('Failed') } catch { toast.error('Failed') }
    finally { setSendingId(null) }
  }

  function timeSince(date: string) { const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000); if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; return Math.floor(h / 24) + 'd ago' }

  const itemCount = useMemo(() => carts.reduce((s, c) => { try { return s + JSON.parse(c.items).length } catch { return s } }, 0), [carts])

  const columns: ColumnDef<Cart>[] = [
    { accessorKey: 'email', header: 'Customer', cell: ({ row }) => <div><span className="font-medium text-navy">{row.original.email}</span>{row.original.name && <p className="text-xs text-muted-foreground">{row.original.name}</p>}</div> },
    { accessorKey: 'items', header: 'Items', cell: ({ row }) => { try { const items = JSON.parse(row.original.items) as { name: string; quantity: number }[]; return <span className="text-sm">{items.map(i => i.name + ' x' + i.quantity).join(', ')}</span> } catch { return <span className="text-muted-foreground">—</span> } } },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium text-navy"></span> },
    { accessorKey: 'createdAt', header: 'Abandoned', cell: ({ row }) => <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeSince(row.original.createdAt)}</span> },
    { accessorKey: 'remindedCount', header: 'Reminders', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.remindedCount}x{row.original.reminderSentAt ? ' (last ' + timeSince(row.original.reminderSentAt) + ')' : ''}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="text-right">
        <button onClick={() => sendReminder(row.original.id)} disabled={sendingId === row.original.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 disabled:opacity-50">
          {sendingId === row.original.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />} Send Reminder
        </button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Abandoned Carts" backHref="/admin/marketing" subtitle={total + ' abandoned carts'} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard icon={ShoppingCart} label="Abandoned" value={String(total)} />
        <StatsCard icon={Mail} label="Reminders Sent" value={String(carts.reduce((s, c) => s + c.remindedCount, 0))} />
        <StatsCard icon={Clock} label="Total Items" value={String(itemCount)} />
      </div>
      <div className="mb-5"><SearchInput value={search} onChange={setSearch} placeholder="Search by email or name..." className="max-w-sm" /></div>
      <DataTable columns={columns} data={carts} loading={loading} keyExtractor={c => c.id} emptyTitle="No abandoned carts" emptyDescription="Carts will appear when customers add items but don't checkout." />
      <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
    </div>
  )
}
`

---

### Task 8: Email Campaigns — API routes

**Files:**
- Create: src/app/api/admin/email-campaigns/route.ts
- Create: src/app/api/admin/email-campaigns/[id]/route.ts
- Create: src/app/api/admin/email-campaigns/send/route.ts

- [ ] **Email campaigns CRUD API**

src/app/api/admin/email-campaigns/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const take = 50; const skip = (page - 1) * take
  const [campaigns, total] = await Promise.all([db.emailCampaign.findMany({ orderBy: { createdAt: 'desc' }, take, skip }), db.emailCampaign.count()])
  return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { name, subject, content, segment, segmentIds, scheduledAt } = await req.json()
    if (!name || !subject || !content) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const campaign = await db.emailCampaign.create({ data: { name, subject, content, segment: segment || 'all', segmentIds: segmentIds ? JSON.stringify(segmentIds) : null, scheduledAt: scheduledAt ? new Date(scheduledAt) : null } })
    return NextResponse.json({ campaign })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

src/app/api/admin/email-campaigns/[id]/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params }) => {
  const campaign = await db.emailCampaign.findUnique({ where: { id: params.id } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ campaign })
}, 'marketing')

export const PUT = withAdmin(async (req, { params }) => {
  try {
    const updates = await req.json()
    const data: any = {}
    if (updates.name !== undefined) data.name = updates.name; if (updates.subject !== undefined) data.subject = updates.subject
    if (updates.content !== undefined) data.content = updates.content; if (updates.segment !== undefined) data.segment = updates.segment
    if (updates.segmentIds !== undefined) data.segmentIds = updates.segmentIds ? JSON.stringify(updates.segmentIds) : null
    if (updates.scheduledAt !== undefined) data.scheduledAt = updates.scheduledAt ? new Date(updates.scheduledAt) : null
    if (updates.status !== undefined) data.status = updates.status
    const campaign = await db.emailCampaign.update({ where: { id: params.id }, data })
    return NextResponse.json({ campaign })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')

export const DELETE = withAdmin(async (_req, { params }) => {
  await db.emailCampaign.delete({ where: { id: params.id } }); return NextResponse.json({ success: true })
}, 'marketing')
`

src/app/api/admin/email-campaigns/send/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sendEmail } from '@/lib/email'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { campaignId, testEmail } = await req.json()
    const campaign = await db.emailCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let recipients: string[] = []
    if (testEmail) { recipients = [testEmail] } else {
      if (campaign.segment === 'all') { const subs = await db.newsletter.findMany({ select: { email: true } }); recipients = subs.map(s => s.email) }
      else if (campaign.segment === 'active') { const d30 = new Date(Date.now() - 30*24*60*60*1000); const users = await db.user.findMany({ where: { orders: { some: { createdAt: { gte: d30 } } } }, select: { email: true } }); recipients = users.map(u => u.email) }
      else if (campaign.segment === 'inactive') { const d30 = new Date(Date.now() - 30*24*60*60*1000); const active = await db.order.findMany({ where: { createdAt: { gte: d30 } }, select: { email: true }, distinct: ['email'] }); const set = new Set(active.map(o => o.email)); const users = await db.user.findMany({ select: { email: true } }); recipients = users.map(u => u.email).filter(e => !set.has(e)) }
      else if (campaign.segment === 'specific' && campaign.segmentIds) { const ids = JSON.parse(campaign.segmentIds); const users = await db.user.findMany({ where: { id: { in: ids } }, select: { email: true } }); recipients = users.map(u => u.email) }
    }
    if (recipients.length === 0) return NextResponse.json({ error: 'No recipients' }, { status: 400 })
    if (testEmail) { const sent = await sendEmail({ to: testEmail, subject: campaign.subject, html: campaign.content }); if (!sent) return NextResponse.json({ error: 'Failed' }, { status: 500 }); return NextResponse.json({ ok: true }) }
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'sending', totalCount: recipients.length } })
    let sentCount = 0
    for (let i = 0; i < recipients.length; i += 50) {
      const batch = recipients.slice(i, i + 50)
      const results = await Promise.allSettled(batch.map(email => sendEmail({ to: email, subject: campaign.subject, html: campaign.content })))
      sentCount += results.filter(r => r.status === 'fulfilled' && r.value).length
    }
    await db.emailCampaign.update({ where: { id: campaignId }, data: { status: 'sent', sentCount, sentAt: new Date() } })
    return NextResponse.json({ ok: true, sentCount, total: recipients.length })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

---

### Task 9: Email Campaigns — Admin pages

**Files:**
- Create: src/app/admin/marketing/email-campaigns/page.tsx
- Create: src/app/admin/marketing/email-campaigns/new/page.tsx
- Create: src/app/admin/marketing/email-campaigns/[id]/page.tsx

- [ ] **Email campaigns list**

src/app/admin/marketing/email-campaigns/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

type C = { id: string; name: string; subject: string; segment: string; status: string; sentCount: number; totalCount: number; createdAt: string }

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<C[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(0); const [deleteId, setDeleteId] = useState<string | null>(null)

  function fetch() { setLoading(true); fetch('/api/admin/email-campaigns?page=' + page).then(r => r.json()).then(d => { setCampaigns(d.campaigns || []); setTotal(d.total); setTotalPages(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [page])

  async function handleDelete() { if (!deleteId) return; try { await fetch('/api/admin/email-campaigns/' + deleteId, { method: 'DELETE' }); setCampaigns(prev => prev.filter(c => c.id !== deleteId)); toast.success('Deleted') } catch { toast.error('Failed') }; setDeleteId(null) }

  const sb = (s: string) => { const m: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', sending: 'bg-yellow-100 text-yellow-700', sent: 'bg-green-100 text-green-700' }; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (m[s] || '')}>{s}</span> }

  const columns: ColumnDef<C>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span> },
    { accessorKey: 'subject', header: 'Subject', cell: ({ row }) => <span className="text-muted-foreground">{row.original.subject}</span> },
    { accessorKey: 'segment', header: 'Segment', cell: ({ row }) => <span className="text-xs text-muted-foreground capitalize">{row.original.segment}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => sb(row.original.status) },
    { accessorKey: 'sentCount', header: 'Sent', cell: ({ row }) => <span className="text-muted-foreground">{row.original.sentCount}{row.original.totalCount ? ' / ' + row.original.totalCount : ''}</span> },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={'/admin/marketing/email-campaigns/' + row.original.id} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" /></Link>
        {row.original.status === 'draft' && <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Email Campaigns" backHref="/admin/marketing" actions={<Link href="/admin/marketing/email-campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> New Campaign</Link>} />
      <DataTable columns={columns} data={campaigns} loading={loading} keyExtractor={c => c.id} emptyTitle="No campaigns" emptyDescription="Create your first email campaign" emptyAction={{ label: 'New Campaign', onClick: () => window.location.href = '/admin/marketing/email-campaigns/new' }} />
      <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete" description="Are you sure?" confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
`

- [ ] **New email campaign page**

src/app/admin/marketing/email-campaigns/new/page.tsx:

`	sx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Send, Save } from 'lucide-react'

export default function NewEmailCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState(''); const [subject, setSubject] = useState(''); const [content, setContent] = useState('')
  const [segment, setSegment] = useState('all'); const [saving, setSaving] = useState(false)

  async function handleSave(sendNow: boolean) {
    if (!name || !subject || !content) { toast.error('All fields required'); return }
    setSaving(true)
    const res = await fetch('/api/admin/email-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content, segment }) })
    const data = await res.json()
    if (res.ok) {
      if (sendNow) { const r2 = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id }) }); if (r2.ok) toast.success('Sent!'); else toast.error('Created but send failed') } else toast.success('Draft saved')
      router.push('/admin/marketing/email-campaigns')
    } else toast.error(data.error || 'Failed')
    setSaving(false)
  }

  async function handleSendTest() {
    const testEmail = prompt('Enter test email:')
    if (!testEmail || !name || !subject || !content) { toast.error('Complete form first'); return }
    setSaving(true)
    const res = await fetch('/api/admin/email-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content, segment }) })
    const data = await res.json()
    if (res.ok) { const r2 = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id, testEmail }) }); if (r2.ok) toast.success('Test sent!'); else toast.error('Test failed') }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Email Campaign" backHref="/admin/marketing/email-campaigns" />
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">Campaign Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Summer Sale" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Don't miss our sale!" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Segment</label>
          <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">All Subscribers</option><option value="active">Active (30d)</option><option value="inactive">Inactive (30d)</option><option value="specific">Specific Customers</option>
          </select>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">HTML Content</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={15} placeholder="<h1>Your HTML here...</h1>" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Send className="h-4 w-4" /> Send</button>
          <button onClick={handleSendTest} disabled={saving} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Test</button>
        </div>
      </div>
    </div>
  )
}
`

- [ ] **Email campaign detail page**

src/app/admin/marketing/email-campaigns/[id]/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Send, Pencil } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function CampaignDetailPage() {
  const params = useParams(); const router = useRouter()
  const [campaign, setCampaign] = useState<any>(null); const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false)
  const [name, setName] = useState(''); const [subject, setSubject] = useState(''); const [content, setContent] = useState('')

  useEffect(() => { fetch('/api/admin/email-campaigns/' + params.id).then(r => r.json()).then(d => { setCampaign(d.campaign); setName(d.campaign.name); setSubject(d.campaign.subject); setContent(d.campaign.content) }).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }, [params.id])

  async function handleUpdate() {
    setSaving(true); const res = await fetch('/api/admin/email-campaigns/' + params.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, subject, content }) }); if (res.ok) { toast.success('Updated'); setCampaign(p => ({ ...p, name, subject, content })); setEditing(false) } else toast.error('Failed'); setSaving(false)
  }

  async function handleSend() {
    setSaving(true); const res = await fetch('/api/admin/email-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: params.id }) }); if (res.ok) { toast.success('Sending!'); router.push('/admin/marketing/email-campaigns') } else { const d = await res.json(); toast.error(d.error || 'Failed') }; setSaving(false)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-64" /></div>
  if (!campaign) return <div className="p-6 text-muted-foreground">Not found</div>

  const sb = (s: string) => { const m: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', scheduled: 'bg-blue-100 text-blue-700', sending: 'bg-yellow-100 text-yellow-700', sent: 'bg-green-100 text-green-700' }; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (m[s] || '')}>{s}</span> }

  return (
    <div className="max-w-3xl">
      <PageHeader title={campaign.name} backHref="/admin/marketing/email-campaigns" />
      <div className="space-y-4">
        <div className="flex items-center gap-3"><span className="text-sm font-medium text-navy">Status:</span>{sb(campaign.status)}{campaign.sentCount > 0 && <span className="text-xs text-muted-foreground">{campaign.sentCount}/{campaign.totalCount} sent</span>}</div>
        {editing ? (
          <div className="space-y-4">
            <div><label className="text-sm font-medium text-navy block mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-navy block mb-1">Subject</label><input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-sm font-medium text-navy block mb-1">Content</label><textarea value={content} onChange={e => setContent(e.target.value)} rows={15} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
            <div className="flex gap-3"><button onClick={handleUpdate} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm disabled:opacity-50">Save</button><button onClick={() => setEditing(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button></div>
          </div>
        ) : (
          <><div><span className="text-sm font-medium text-navy block mb-1">Subject:</span><span className="text-sm text-muted-foreground">{campaign.subject}</span></div>
          <div><span className="text-sm font-medium text-navy block mb-1">Segment:</span><span className="text-sm text-muted-foreground capitalize">{campaign.segment}</span></div>
          <div><span className="text-sm font-medium text-navy block mb-1">Content:</span><div className="border border-border rounded-lg p-4 mt-1 bg-white max-h-96 overflow-y-auto" dangerouslySetInnerHTML={{ __html: campaign.content }} /></div>
          {campaign.status === 'draft' && <div className="flex gap-3 pt-2"><button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy"><Pencil className="h-4 w-4" /> Edit</button><button onClick={handleSend} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Send className="h-4 w-4" /> Send Now</button></div>}</>
        )}
      </div>
    </div>
  )
}
`

---

### Task 10: Push Campaigns — API routes

**Files:**
- Create: src/app/api/admin/push-campaigns/route.ts
- Create: src/app/api/admin/push-campaigns/[id]/route.ts
- Create: src/app/api/admin/push-campaigns/send/route.ts

- [ ] **Push campaigns CRUD API**

src/app/api/admin/push-campaigns/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1')); const take = 50; const skip = (page - 1) * take
  const [campaigns, total] = await Promise.all([db.pushCampaign.findMany({ orderBy: { createdAt: 'desc' }, take, skip }), db.pushCampaign.count()])
  return NextResponse.json({ campaigns, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')

export const POST = withAdmin(async (req: NextRequest) => {
  try { const { name, title, body, data, segment, scheduledAt } = await req.json(); if (!name || !title || !body) return NextResponse.json({ error: 'Required' }, { status: 400 }); const c = await db.pushCampaign.create({ data: { name, title, body, data: data ? JSON.stringify(data) : null, segment: segment || 'all', scheduledAt: scheduledAt ? new Date(scheduledAt) : null } }); return NextResponse.json({ campaign: c }) }
  catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

src/app/api/admin/push-campaigns/[id]/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (_req, { params }) => { const c = await db.pushCampaign.findUnique({ where: { id: params.id } }); if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 }); return NextResponse.json({ campaign: c }) }, 'marketing')
export const PUT = withAdmin(async (req, { params }) => { try { const u = await req.json(); const d: any = {}; if (u.name !== undefined) d.name = u.name; if (u.title !== undefined) d.title = u.title; if (u.body !== undefined) d.body = u.body; if (u.data !== undefined) d.data = u.data ? JSON.stringify(u.data) : null; if (u.segment !== undefined) d.segment = u.segment; if (u.status !== undefined) d.status = u.status; const c = await db.pushCampaign.update({ where: { id: params.id }, data: d }); return NextResponse.json({ campaign: c }) } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) } }, 'marketing')
export const DELETE = withAdmin(async (_req, { params }) => { await db.pushCampaign.delete({ where: { id: params.id } }); return NextResponse.json({ success: true }) }, 'marketing')
`

src/app/api/admin/push-campaigns/send/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { campaignId } = await req.json()
    const campaign = await db.pushCampaign.findUnique({ where: { id: campaignId } })
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    let tokens: { token: string; platform: string }[] = []
    if (campaign.segment === 'all' || campaign.segment === 'customers') { const ct = await db.customerPushToken.findMany({ select: { token: true, platform: true } }); tokens.push(...ct) }
    if (campaign.segment === 'all' || campaign.segment === 'admins') { const at = await db.pushToken.findMany({ select: { token: true, platform: true } }); tokens.push(...at) }
    if (tokens.length === 0) return NextResponse.json({ error: 'No tokens' }, { status: 400 })
    const unique = Array.from(new Map(tokens.map(t => [t.token, t])).values())
    await db.pushCampaign.update({ where: { id: campaignId }, data: { status: 'sending', totalCount: unique.length } })
    const payload = campaign.data ? JSON.parse(campaign.data) : {}
    let sent = 0
    for (let i = 0; i < unique.length; i += 100) {
      const batch = unique.slice(i, i + 100)
      const results = await Promise.allSettled(batch.map(t => fetch('https://exp.host/--/api/v2/push/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: t.token, title: campaign.title, body: campaign.body, data: payload, sound: 'default', priority: 'high' }) }).then(r => r.ok)))
      sent += results.filter(r => r.status === 'fulfilled' && r.value).length
    }
    await db.pushCampaign.update({ where: { id: campaignId }, data: { status: 'sent', sentCount: sent, sentAt: new Date() } })
    return NextResponse.json({ ok: true, sentCount: sent, total: unique.length })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

---

### Task 11: Push Campaigns — Admin pages

**Files:**
- Create: src/app/admin/marketing/push-campaigns/page.tsx
- Create: src/app/admin/marketing/push-campaigns/new/page.tsx
- Create: src/app/admin/marketing/push-campaigns/[id]/page.tsx

- [ ] **Push campaigns list**

src/app/admin/marketing/push-campaigns/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

type PC = { id: string; name: string; title: string; segment: string; status: string; sentCount: number; createdAt: string }

export default function PushCampaignsPage() {
  const [campaigns, setCampaigns] = useState<PC[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [deleteId, setDeleteId] = useState<string | null>(null)

  function fetch() { setLoading(true); fetch('/api/admin/push-campaigns?page=' + page).then(r => r.json()).then(d => { setCampaigns(d.campaigns || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }
  useEffect(() => { fetch() }, [page])
  async function handleDelete() { if (!deleteId) return; try { await fetch('/api/admin/push-campaigns/' + deleteId, { method: 'DELETE' }); setCampaigns(p => p.filter(c => c.id !== deleteId)); toast.success('Deleted') } catch { toast.error('Failed') }; setDeleteId(null) }

  const columns: ColumnDef<PC>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span> },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="text-muted-foreground">{row.original.title}</span> },
    { accessorKey: 'segment', header: 'Segment', cell: ({ row }) => <span className="text-xs text-muted-foreground capitalize">{row.original.segment}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', sent: 'bg-green-100 text-green-700' }; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s[row.original.status] || 'bg-yellow-100 text-yellow-700')}>{row.original.status}</span> } },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={'/admin/marketing/push-campaigns/' + row.original.id} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" /></Link>
        {row.original.status === 'draft' && <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Push Campaigns" backHref="/admin/marketing" actions={<Link href="/admin/marketing/push-campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> New</Link>} />
      <DataTable columns={columns} data={campaigns} loading={loading} keyExtractor={c => c.id} emptyTitle="No push campaigns" emptyDescription="Create your first push campaign" emptyAction={{ label: 'New', onClick: () => window.location.href = '/admin/marketing/push-campaigns/new' }} />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete" description="Sure?" confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
`

- [ ] **New push campaign page**

src/app/admin/marketing/push-campaigns/new/page.tsx:

`	sx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Bell, Save } from 'lucide-react'

export default function NewPushCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState(''); const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [segment, setSegment] = useState('all'); const [saving, setSaving] = useState(false)

  async function handleSave(sendNow: boolean) {
    if (!name || !title || !body) { toast.error('All fields required'); return }
    setSaving(true); const res = await fetch('/api/admin/push-campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, title, body, segment }) })
    const data = await res.json()
    if (res.ok) {
      if (sendNow) { const r2 = await fetch('/api/admin/push-campaigns/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId: data.campaign.id }) }); if (r2.ok) toast.success('Sent!'); else toast.error('Created but send failed') } else toast.success('Draft saved')
      router.push('/admin/marketing/push-campaigns')
    } else toast.error(data.error || 'Failed')
    setSaving(false)
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="New Push Campaign" backHref="/admin/marketing/push-campaigns" />
      <div className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Flash Sale" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Notification Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="50% Off!" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Body</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Limited time offer" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Send To</label>
          <select value={segment} onChange={e => setSegment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">All (Customers + Admins)</option><option value="customers">Customers Only</option><option value="admins">Admins Only</option>
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gold text-navy-deep rounded-lg text-sm font-medium disabled:opacity-50"><Bell className="h-4 w-4" /> Send Now</button>
        </div>
      </div>
    </div>
  )
}
`

- [ ] **Push campaign detail**

src/app/admin/marketing/push-campaigns/[id]/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function PushCampaignDetailPage() {
  const params = useParams(); const [campaign, setCampaign] = useState<any>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/admin/push-campaigns/' + params.id).then(r => r.json()).then(d => setCampaign(d.campaign)).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }, [params.id])
  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-32" /></div>
  if (!campaign) return <div className="p-6 text-muted-foreground">Not found</div>
  return (
    <div className="max-w-lg">
      <PageHeader title={campaign.name} backHref="/admin/marketing/push-campaigns" />
      <div className="space-y-4">
        <div><span className="text-sm font-medium text-navy">Title:</span><p className="text-sm text-muted-foreground">{campaign.title}</p></div>
        <div><span className="text-sm font-medium text-navy">Body:</span><p className="text-sm text-muted-foreground">{campaign.body}</p></div>
        <div><span className="text-sm font-medium text-navy">Segment:</span><p className="text-sm text-muted-foreground capitalize">{campaign.segment}</p></div>
        <div><span className="text-sm font-medium text-navy">Status:</span><span className={'ml-2 px-2 py-0.5 rounded text-xs font-medium ' + (campaign.status === 'draft' ? 'bg-gray-100 text-gray-600' : campaign.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{campaign.status}</span></div>
        {campaign.sentCount > 0 && <div><span className="text-sm font-medium text-navy">Sent:</span><span className="text-sm text-muted-foreground ml-2">{campaign.sentCount}/{campaign.totalCount}</span></div>}
      </div>
    </div>
  )
}
`

---

### Task 12: SEO Management — API + Admin page

**Files:**
- Create: src/app/api/admin/seo/route.ts
- Create: src/app/admin/marketing/seo/page.tsx

- [ ] **SEO settings API**

src/app/api/admin/seo/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { sanitize } from '@/lib/sanitize'

const SEO_KEYS = ['seoTitleTemplate','seoDescription','seoOgImage','seoKeywords','seoHomeTitle','seoHomeDescription','seoProductsTitle','seoProductsDescription','seoCategoriesTitle','seoCategoriesDescription','sitemapEnabled','sitemapPriority','sitemapChangefreq','robotsTxt']

const DEFAULTS: Record<string, string> = {
  seoTitleTemplate: '%s — Gümüş Güneş', seoDescription: 'Handcrafted premium accessories from Istanbul.',
  seoOgImage: '', seoKeywords: 'jewelry, silver, accessories',
  seoHomeTitle: 'Gümüş Güneş — Premium Accessories', seoHomeDescription: 'Discover handcrafted accessories.',
  seoProductsTitle: 'All Products — Gümüş Güneş', seoProductsDescription: 'Browse our collection.',
  seoCategoriesTitle: 'Categories — Gümüş Güneş', seoCategoriesDescription: 'Explore by category.',
  sitemapEnabled: 'true', sitemapPriority: '0.7', sitemapChangefreq: 'weekly',
  robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://gumusgunes.com/sitemap.xml',
}

export const GET = withAdmin(async () => {
  const settings = await db.siteSetting.findMany({ where: { key: { in: SEO_KEYS } } })
  const map = { ...DEFAULTS }; for (const s of settings) map[s.key] = s.value
  return NextResponse.json({ ok: true, settings: map })
}, 'marketing')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    for (const [key, value] of Object.entries(body) as [string, string][]) {
      if (!SEO_KEYS.includes(key) || typeof value !== 'string') continue
      await db.siteSetting.upsert({ where: { key }, update: { value: sanitize(value) }, create: { key, value: sanitize(value) } })
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

- [ ] **SEO management page**

src/app/admin/marketing/seo/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

type S = Record<string, string>
const FIELDS: { key: string; label: string; type?: string; group: string }[] = [
  { key: 'seoTitleTemplate', label: 'Title Template (%s = page title)', group: 'Global' },
  { key: 'seoDescription', label: 'Default Meta Description', group: 'Global' },
  { key: 'seoOgImage', label: 'Default OG Image URL', group: 'Global' },
  { key: 'seoKeywords', label: 'Default Keywords', group: 'Global' },
  { key: 'seoHomeTitle', label: 'Home Page Title', group: 'Per-Page' },
  { key: 'seoHomeDescription', label: 'Home Page Description', group: 'Per-Page' },
  { key: 'seoProductsTitle', label: 'Products Page Title', group: 'Per-Page' },
  { key: 'seoProductsDescription', label: 'Products Page Description', group: 'Per-Page' },
  { key: 'seoCategoriesTitle', label: 'Categories Page Title', group: 'Per-Page' },
  { key: 'seoCategoriesDescription', label: 'Categories Page Description', group: 'Per-Page' },
  { key: 'sitemapEnabled', label: 'Enable Sitemap', type: 'select', group: 'Sitemap & Robots' },
  { key: 'sitemapPriority', label: 'Sitemap Priority (0.0–1.0)', group: 'Sitemap & Robots' },
  { key: 'sitemapChangefreq', label: 'Change Frequency', group: 'Sitemap & Robots' },
  { key: 'robotsTxt', label: 'robots.txt', type: 'textarea', group: 'Sitemap & Robots' },
]

export default function SeoPage() {
  const [settings, setSettings] = useState<S>({}); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false)
  useEffect(() => { fetch('/api/admin/seo').then(r => r.json()).then(d => { if (d.ok) setSettings(d.settings) }).finally(() => setLoading(false)) }, [])

  async function handleSave() {
    setSaving(true); try { const r = await fetch('/api/admin/seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); if (r.ok) toast.success('Saved'); else toast.error('Failed') } catch { toast.error('Network error') }; setSaving(false)
  }

  const groups = [...new Set(FIELDS.map(f => f.group))]
  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-6 w-32" /><div className="grid gap-4"><Skeleton className="h-16" /></div></div>

  return (
    <div>
      <PageHeader title="SEO Management" backHref="/admin/marketing" actions={<button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? '...' : 'Save All'}</button>} />
      {groups.map(group => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold text-navy mb-3 border-b border-border pb-2">{group}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.filter(f => f.group === group).map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="text-sm font-medium text-navy block mb-1">{field.label}</label>
                {field.type === 'select' ? (
                  <select value={settings[field.key] || 'true'} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
                    <option value="true">Enabled</option><option value="false">Disabled</option>
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} rows={6} className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" />
                ) : (
                  <input type="text" value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
`

---

### Task 13: Referral Program — API routes

**Files:**
- Create: src/app/api/admin/referrals/route.ts
- Create: src/app/api/admin/referrals/config/route.ts

- [ ] **Referrals list API**

src/app/api/admin/referrals/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const search = req.nextUrl.searchParams.get('search') || ''
  const take = 50; const skip = (page - 1) * take
  const where: any = {}
  if (search) where.OR = [{ referredEmail: { contains: search, mode: 'insensitive' } }, { code: { contains: search, mode: 'insensitive' } }]
  const [referrals, total] = await Promise.all([db.referral.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }), db.referral.count({ where })])
  return NextResponse.json({ referrals, total, page, totalPages: Math.ceil(total / take) })
}, 'marketing')
`

- [ ] **Referral config API**

src/app/api/admin/referrals/config/route.ts:

`	s
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const config = await db.referralConfig.findFirst()
  return NextResponse.json({ config: config || { rewardType: 'discount', rewardValue: 10, minOrder: 0, maxPerUser: 10, discountDays: 30, isActive: true } })
}, 'marketing')

export const PUT = withAdmin(async (req: NextRequest) => {
  try {
    const { rewardType, rewardValue, minOrder, maxPerUser, discountDays, isActive } = await req.json()
    const existing = await db.referralConfig.findFirst()
    let config
    const d = { rewardType, rewardValue: parseFloat(rewardValue), minOrder: parseFloat(minOrder), maxPerUser: parseInt(maxPerUser), discountDays: parseInt(discountDays), isActive }
    if (existing) config = await db.referralConfig.update({ where: { id: existing.id }, data: d })
    else config = await db.referralConfig.create({ data: d })
    return NextResponse.json({ config })
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}, 'marketing')
`

---

### Task 14: Referral Program — Admin page

**Files:**
- Create: src/app/admin/marketing/referrals/page.tsx

- [ ] **Referrals admin page with config panel**

src/app/admin/marketing/referrals/page.tsx:

`	sx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Gift, Settings, Save, Search } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { StatsCard } from '@/components/admin/StatsCard'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type R = { id: string; code: string; referredEmail: string | null; rewardType: string; rewardValue: number; status: string; createdAt: string }

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<R[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [config, setConfig] = useState<any>(null); const [cl, setCl] = useState(true); const [showConfig, setShowConfig] = useState(false); const [saving, setSaving] = useState(false)

  function fetchReferrals() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/referrals?' + p).then(r => r.json()).then(d => { setReferrals(d.referrals || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }
  function fetchConfig() { setCl(true); fetch('/api/admin/referrals/config').then(r => r.json()).then(d => setConfig(d.config)).finally(() => setCl(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchReferrals() }, [page]); useEffect(() => { fetchConfig() }, [])

  async function handleSaveConfig() { setSaving(true); const r = await fetch('/api/admin/referrals/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) }); if (r.ok) toast.success('Saved'); else toast.error('Failed'); setSaving(false) }

  const columns: ColumnDef<R>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="font-mono text-xs font-bold text-navy bg-gray-100 px-2 py-0.5 rounded">{row.original.code}</span> },
    { accessorKey: 'referredEmail', header: 'Referred', cell: ({ row }) => <span className="text-muted-foreground">{row.original.referredEmail || '—'}</span> },
    { accessorKey: 'rewardType', header: 'Reward', cell: ({ row }) => <span className="text-xs capitalize">{row.original.rewardType} ()</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s = row.original.status; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s === 'rewarded' ? 'bg-green-100 text-green-700' : s === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>{s}</span> } },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
  ]

  return (
    <div>
      <PageHeader title="Referral Program" backHref="/admin/marketing" actions={<button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy"><Settings className="h-4 w-4" /> Settings</button>} />
      <div className="grid grid-cols-2 gap-4 mb-6"><StatsCard icon={Gift} label="Total" value={String(total)} /><StatsCard icon={Gift} label="Rewarded" value={String(referrals.filter(r => r.status === 'rewarded').length)} /></div>

      {showConfig && (
        <div className="bg-white rounded-xl border border-border p-5 mb-6">
          <h3 className="font-semibold text-navy mb-4">Configuration</h3>
          {cl ? <div className="text-sm text-muted-foreground">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Type</label><select value={config?.rewardType || 'discount'} onChange={e => setConfig({ ...config, rewardType: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="discount">Discount</option><option value="points">Points</option></select></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Reward Value</label><input type="number" value={config?.rewardValue || 10} onChange={e => setConfig({ ...config, rewardValue: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Min Order</label><input type="number" value={config?.minOrder || 0} onChange={e => setConfig({ ...config, minOrder: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Max/User</label><input type="number" value={config?.maxPerUser || 10} onChange={e => setConfig({ ...config, maxPerUser: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div><label className="text-xs font-medium text-muted-foreground block mb-1">Discount Days</label><input type="number" value={config?.discountDays || 30} onChange={e => setConfig({ ...config, discountDays: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
              <div className="flex items-end pb-2.5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={config?.isActive !== false} onChange={e => setConfig({ ...config, isActive: e.target.checked })} className="h-4 w-4" /><span className="text-sm text-navy">Active</span></label></div>
            </div>
          )}
          <button onClick={handleSaveConfig} disabled={saving} className="mt-4 flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? '...' : 'Save'}</button>
        </div>
      )}

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={referrals} loading={loading} keyExtractor={r => r.id} emptyTitle="No referrals" emptyDescription="Referrals appear when customers share links." />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
    </div>
  )
}
`

---

### Task 15: Add gift card API routes

**Files:**
- Create: src/app/api/admin/gift-cards/route.ts
- Create: src/app/api/admin/gift-cards/[id]/route.ts

- [ ] **Create GET + POST /api/admin/gift-cards**

`src/app/api/admin/gift-cards/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const search = searchParams.get('search') || ''
  const limit = 20

  const where: any = {}
  if (search) where.OR = [
    { code: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ]

  const [giftCards, total] = await Promise.all([
    prisma.giftCard.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.giftCard.count({ where }),
  ])

  return NextResponse.json({ giftCards, total, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { code, email, amount, expiresAt } = body

  const giftCard = await prisma.giftCard.create({
    data: {
      code: code || `GIFT-${Date.now().toString(36).toUpperCase()}`,
      email: email || null,
      amount: parseFloat(amount),
      remaining: parseFloat(amount),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json({ giftCard })
}
```

- [ ] **Create GET + PUT + DELETE /api/admin/gift-cards/[id]**

`src/app/api/admin/gift-cards/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const giftCard = await prisma.giftCard.findUnique({ where: { id: params.id } })
  if (!giftCard) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ giftCard })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const giftCard = await prisma.giftCard.update({
    where: { id: params.id },
    data: {
      ...(body.amount && { amount: parseFloat(body.amount) }),
      ...(body.remaining !== undefined && { remaining: parseFloat(body.remaining) }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.status && { status: body.status }),
      ...(body.expiresAt !== undefined && { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }),
    },
  })
  return NextResponse.json({ giftCard })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.giftCard.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

---

### Task 16: Build the gift cards admin page

**Files:**
- Create: src/app/admin/marketing/gift-cards/page.tsx

- [ ] **Create gift card management page**

`src/app/admin/marketing/gift-cards/page.tsx`:

```typescript
'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Trash2, Edit, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

type GiftCard = { id: string; code: string; email: string | null; amount: number; remaining: number; status: string; expiresAt: string | null; createdAt: string }

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false); const [editCard, setEditCard] = useState<GiftCard | null>(null); const [deleteId, setDeleteId] = useState<string | null>(null); const [saving, setSaving] = useState(false); const [copiedId, setCopiedId] = useState<string | null>(null)

  const [form, setForm] = useState({ code: '', email: '', amount: '50', expiresAt: '' })

  function fetchCards() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/gift-cards?' + p).then(r => r.json()).then(d => { setCards(d.giftCards || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchCards() }, [page])

  async function handleCreate(e: React.FormEvent) { e.preventDefault(); setSaving(true); const r = await fetch('/api/admin/gift-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { toast.success('Created'); setShowCreate(false); setForm({ code: '', email: '', amount: '50', expiresAt: '' }); fetchCards() } else { toast.error('Failed') }; setSaving(false) }

  async function handleEdit() { if (!editCard) return; setSaving(true); const r = await fetch('/api/admin/gift-cards/' + editCard.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCard) }); if (r.ok) { toast.success('Updated'); setEditCard(null); fetchCards() } else { toast.error('Failed') }; setSaving(false) }

  async function handleDelete() { if (!deleteId) return; const r = await fetch('/api/admin/gift-cards/' + deleteId, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); setDeleteId(null); fetchCards() } else { toast.error('Failed') } }

  const copyCode = useCallback((code: string, id: string) => { navigator.clipboard.writeText(code); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }, [])

  const columns: ColumnDef<GiftCard>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-navy bg-gray-100 px-2 py-0.5 rounded">{row.original.code}</span>
        <button onClick={() => copyCode(row.original.code, row.original.id)} className="text-muted-foreground hover:text-navy">
          {copiedId === row.original.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    )},
    { accessorKey: 'email', header: 'Email', cell: ({ row }) => <span className="text-sm">{row.original.email || '—'}</span> },
    { accessorKey: 'amount', header: 'Amount', cell: ({ row }) => <span className="text-sm font-medium">{row.original.amount.toFixed(2)}</span> },
    { accessorKey: 'remaining', header: 'Remaining', cell: ({ row }) => {
      const pct = (row.original.remaining / row.original.amount) * 100
      return <div className="flex items-center gap-2"><span className="text-sm">{row.original.remaining.toFixed(2)}</span><div className="w-16 h-1.5 bg-gray-200 rounded-full"><div className="h-full rounded-full bg-navy" style={{ width: pct + '%' }} /></div></div>
    }},
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
      const s = row.original.status
      return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s === 'active' ? 'bg-green-100 text-green-700' : s === 'redeemed' ? 'bg-blue-100 text-blue-700' : s === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{s}</span>
    }},
    { accessorKey: 'expiresAt', header: 'Expires', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}</span> },
    { id: 'actions', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditCard(row.original)} className="p-1.5 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  const modalBg = 'bg-white rounded-xl border border-border p-6 max-w-lg mx-auto'
  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm'
  const labelCls = 'text-xs font-medium text-muted-foreground block mb-1'

  return (
    <div>
      <PageHeader title="Gift Cards" backHref="/admin/marketing" actions={<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create</button>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-navy">{total}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{cards.filter(c => c.status === 'active').length}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Redeemed</p><p className="text-xl font-bold text-blue-600">{cards.filter(c => c.status === 'redeemed').length}</p></div>
      </div>

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or email..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={cards} loading={loading} keyExtractor={c => c.id} emptyTitle="No gift cards" emptyDescription="Create your first gift card to get started." />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className={modalBg} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-navy mb-4">New Gift Card</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className={labelCls}>Code (leave blank for auto)</label><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Auto-generated" className={inputCls} /></div>
              <div><label className={labelCls}>Recipient Email (optional)</label><input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="customer@example.com" className={inputCls} /></div>
              <div><label className={labelCls}>Amount</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} required className={inputCls} /></div>
              <div><label className={labelCls}>Expires At (optional)</label><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className={inputCls} /></div>
              <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {editCard && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditCard(null)}>
          <div className={modalBg} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-navy mb-4">Edit Gift Card</h3>
            <div className="space-y-4">
              <div><label className={labelCls}>Amount</label><input type="number" step="0.01" value={editCard.amount} onChange={e => setEditCard(p => ({ ...p, amount: parseFloat(e.target.value) }))} className={inputCls} /></div>
              <div><label className={labelCls}>Remaining</label><input type="number" step="0.01" value={editCard.remaining} onChange={e => setEditCard(p => ({ ...p, remaining: parseFloat(e.target.value) }))} className={inputCls} /></div>
              <div><label className={labelCls}>Status</label><select value={editCard.status} onChange={e => setEditCard(p => ({ ...p, status: e.target.value }))} className={inputCls}><option value="active">Active</option><option value="redeemed">Redeemed</option><option value="expired">Expired</option></select></div>
              <div className="flex gap-3 pt-2"><button onClick={handleEdit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button><button onClick={() => setEditCard(null)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} title="Delete Gift Card" description="Are you sure? This cannot be undone." />
    </div>
  )
}
```

---

### Task 17: Add flash sale (sale campaign) API routes and admin pages

**Files:**
- Create: src/app/api/admin/sales/route.ts
- Create: src/app/api/admin/sales/[id]/route.ts
- Create: src/app/admin/marketing/sales/page.tsx
- Create: src/app/admin/marketing/sales/[id]/page.tsx

- [ ] **Create GET + POST /api/admin/sales**

`src/app/api/admin/sales/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const search = searchParams.get('search') || ''
  const limit = 20

  const where: any = {}
  if (search) where.name = { contains: search, mode: 'insensitive' }

  const [sales, total] = await Promise.all([
    prisma.saleCampaign.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
    }),
    prisma.saleCampaign.count({ where }),
  ])

  return NextResponse.json({ sales, total, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { name, type, discountType, discountValue, minOrder, maxUses, startsAt, endsAt, products } = body

  const sale = await prisma.saleCampaign.create({
    data: {
      name, type: type || 'all', discountType: discountType || 'percentage',
      discountValue: parseFloat(discountValue),
      minOrder: minOrder ? parseFloat(minOrder) : 0,
      maxUses: maxUses ? parseInt(maxUses) : null,
      startsAt: new Date(startsAt), endsAt: new Date(endsAt),
      products: products || null,
    },
  })

  return NextResponse.json({ sale })
}
```

- [ ] **Create GET + PUT + DELETE /api/admin/sales/[id]**

`src/app/api/admin/sales/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const sale = await prisma.saleCampaign.findUnique({ where: { id: params.id } })
  if (!sale) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ sale })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const sale = await prisma.saleCampaign.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.type && { type: body.type }),
      ...(body.discountType && { discountType: body.discountType }),
      ...(body.discountValue && { discountValue: parseFloat(body.discountValue) }),
      ...(body.minOrder !== undefined && { minOrder: parseFloat(body.minOrder) }),
      ...(body.maxUses !== undefined && { maxUses: body.maxUses ? parseInt(body.maxUses) : null }),
      ...(body.startsAt && { startsAt: new Date(body.startsAt) }),
      ...(body.endsAt && { endsAt: new Date(body.endsAt) }),
      ...(body.products !== undefined && { products: body.products }),
      ...(body.isActive !== undefined && { isActive: body.isActive }),
    },
  })
  return NextResponse.json({ sale })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await prisma.saleCampaign.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Create flash sales list page**

`src/app/admin/marketing/sales/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Trash2, Edit, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Sale = { id: string; name: string; type: string; discountType: string; discountValue: number; minOrder: number; maxUses: number | null; usedCount: number; startsAt: string; endsAt: string; isActive: boolean; createdAt: string }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()

  function fetchSales() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/sales?' + p).then(r => r.json()).then(d => { setSales(d.sales || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchSales() }, [page])

  async function handleDelete() { if (!deleteId) return; const r = await fetch('/api/admin/sales/' + deleteId, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); setDeleteId(null); fetchSales() } else { toast.error('Failed') } }

  const now = new Date()
  const active = sales.filter(s => s.isActive && new Date(s.startsAt) <= now && new Date(s.endsAt) >= now).length
  const upcoming = sales.filter(s => s.isActive && new Date(s.startsAt) > now).length
  const ended = sales.filter(s => !s.isActive || new Date(s.endsAt) < now).length

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
      <Link href={'/admin/marketing/sales/' + row.original.id} className="text-sm font-medium text-navy hover:underline flex items-center gap-1.5">{row.original.name} <ExternalLink className="h-3 w-3" /></Link>
    )},
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="text-xs capitalize bg-gray-100 px-2 py-0.5 rounded">{row.original.type}</span> },
    { accessorKey: 'discountValue', header: 'Discount', cell: ({ row }) => <span className="text-sm font-medium">{row.original.discountType === 'percentage' ? row.original.discountValue + '%' : '$' + row.original.discountValue.toFixed(2)}</span> },
    { accessorKey: 'usedCount', header: 'Used', cell: ({ row }) => <span className="text-sm">{row.original.usedCount}{row.original.maxUses ? '/' + row.original.maxUses : ''}</span> },
    { accessorKey: 'startsAt', header: 'Starts', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.startsAt).toLocaleDateString()}</span> },
    { accessorKey: 'endsAt', header: 'Ends', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.endsAt).toLocaleDateString()}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => {
      const s = row.original; const n = new Date()
      let label = 'Inactive', cls = 'bg-gray-100 text-gray-600'
      if (s.isActive && new Date(s.startsAt) <= n && new Date(s.endsAt) >= n) { label = 'Active'; cls = 'bg-green-100 text-green-700' }
      else if (s.isActive && new Date(s.startsAt) > n) { label = 'Upcoming'; cls = 'bg-blue-100 text-blue-700' }
      else if (s.isActive && new Date(s.endsAt) < n) { label = 'Ended'; cls = 'bg-red-100 text-red-700' }
      return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + cls}>{label}</span>
    }},
    { id: 'actions', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin/marketing/sales/' + row.original.id)} className="p-1.5 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Flash Sales" backHref="/admin/marketing" actions={<Link href="/admin/marketing/sales/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create</Link>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Active Now</p><p className="text-xl font-bold text-green-600">{active}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Upcoming</p><p className="text-xl font-bold text-blue-600">{upcoming}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Ended</p><p className="text-xl font-bold text-muted-foreground">{ended}</p></div>
      </div>

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={sales} loading={loading} keyExtractor={s => s.id} emptyTitle="No flash sales" emptyDescription="Create your first flash sale campaign." />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
      <ConfirmDialog open={!!deleteId} onConfirm={handleDelete} onCancel={() => setDeleteId(null)} title="Delete Sale" description="Are you sure? This cannot be undone." />
    </div>
  )
}
```

- [ ] **Create flash sale edit/create page**

`src/app/admin/marketing/sales/[id]/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Save, Clock, Tag, Percent, DollarSign } from 'lucide-react'

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', type: 'all', discountType: 'percentage', discountValue: '10',
    minOrder: '0', maxUses: '', startsAt: '', endsAt: '', isActive: true, products: '',
  })

  useEffect(() => {
    if (isNew) return
    fetch('/api/admin/sales/' + params.id).then(r => r.json()).then(d => {
      if (d.sale) {
        const s = d.sale
        setForm({
          name: s.name, type: s.type, discountType: s.discountType,
          discountValue: String(s.discountValue), minOrder: String(s.minOrder),
          maxUses: s.maxUses ? String(s.maxUses) : '',
          startsAt: s.startsAt ? s.startsAt.slice(0, 16) : '',
          endsAt: s.endsAt ? s.endsAt.slice(0, 16) : '',
          isActive: s.isActive, products: s.products || '',
        })
      }
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [params.id, isNew])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = isNew ? '/api/admin/sales' : '/api/admin/sales/' + params.id
    const method = isNew ? 'POST' : 'PUT'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { toast.success(isNew ? 'Created' : 'Saved'); router.push('/admin/marketing/sales') }
    else { toast.error('Failed') }; setSaving(false)
  }

  if (loading) return <div className="text-sm text-muted-foreground p-8">Loading...</div>

  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm'
  const labelCls = 'text-xs font-medium text-muted-foreground block mb-1'

  return (
    <div className="max-w-2xl">
      <PageHeader title={isNew ? 'New Flash Sale' : 'Edit Flash Sale'} backHref="/admin/marketing/sales" />
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div><label className={labelCls}><Tag className="h-3.5 w-3.5 inline mr-1" />Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Summer Sale" className={inputCls} /></div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Type</label><select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}><option value="all">All Products</option><option value="specific">Specific Products</option></select></div>
          <div><label className={labelCls}>Discount Type</label><select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className={inputCls}><option value="percentage">Percentage</option><option value="fixed">Fixed</option></select></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>{form.discountType === 'percentage' ? <Percent className="h-3.5 w-3.5 inline mr-1" /> : <DollarSign className="h-3.5 w-3.5 inline mr-1" />}Value</label><input type="number" step="0.01" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}>Min Order</label><input type="number" step="0.01" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Max Uses (optional)</label><input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))} placeholder="Unlimited" className={inputCls} /></div>
          <div className="flex items-end pb-2.5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4" /><span className="text-sm text-navy">Active</span></label></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}><Clock className="h-3.5 w-3.5 inline mr-1" />Starts At</label><input type="datetime-local" value={form.startsAt} onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}><Clock className="h-3.5 w-3.5 inline mr-1" />Ends At</label><input type="datetime-local" value={form.endsAt} onChange={e => setForm(p => ({ ...p, endsAt: e.target.value }))} required className={inputCls} /></div>
        </div>

        {form.type === 'specific' && (
          <div><label className={labelCls}>Product IDs (JSON array)</label><textarea value={form.products} onChange={e => setForm(p => ({ ...p, products: e.target.value }))} rows={3} placeholder='["product-id-1", "product-id-2"]' className={inputCls + ' resize-none'} /></div>
        )}

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  )
}
```

---

### Task 18: Update FlashSaleBanner to fetch from API instead of sessionStorage

**Files:**
- Modify: src/components/store/FlashSaleBanner.tsx

- [ ] **Replace sessionStorage-based flash sale logic with server-side API fetch**

The current FlashSaleBanner uses hardcoded mock data stored in sessionStorage. Replace it with a fetch to `/api/admin/sales` to get active sales, then display the first active one.

`src/components/store/FlashSaleBanner.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Zap } from 'lucide-react'
import Link from 'next/link'

type Sale = { id: string; name: string; discountValue: number; discountType: string; endsAt: string }

export default function FlashSaleBanner() {
  const [sale, setSale] = useState<Sale | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    fetch('/api/admin/sales?page=1')
      .then(r => r.json())
      .then(d => {
        const sales: Sale[] = (d.sales || []).filter((s: any) => {
          const now = new Date()
          return s.isActive && new Date(s.startsAt) <= now && new Date(s.endsAt) >= now
        })
        if (sales.length > 0) {
          const active = sales[0]
          setSale(active)
          updateTimeLeft(active.endsAt)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!sale) return
    const interval = setInterval(() => updateTimeLeft(sale.endsAt), 1000)
    return () => clearInterval(interval)
  }, [sale])

  function updateTimeLeft(endsAt: string) {
    const diff = new Date(endsAt).getTime() - Date.now()
    if (diff <= 0) { setTimeLeft('Ended'); return }
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    setTimeLeft(`${h}h ${m}m ${s}s`)
  }

  if (!sale || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-gradient-to-r from-red-600 to-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <Zap className="h-4 w-4" />
            <span className="font-semibold">{sale.name}</span>
            <span className="hidden sm:inline text-white/80">
              {sale.discountType === 'percentage' ? `${sale.discountValue}% OFF` : `$${sale.discountValue} OFF`}
            </span>
            <span className="flex items-center gap-1 text-white/80">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/shop" className="text-xs font-medium underline underline-offset-2 hover:no-underline">Shop Now</Link>
            <button onClick={() => setDismissed(true)} className="text-white/80 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
```
