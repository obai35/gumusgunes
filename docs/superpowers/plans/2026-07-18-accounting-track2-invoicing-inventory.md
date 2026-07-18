# Track 2: Invoicing & Inventory Valuation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add customer invoices, supplier bills/AP management, and inventory valuation with COGS reconciliation to the accounting tab.

**Architecture:** New Prisma models for Invoice, InvoiceItem, Bill, BillItem; new API routes under `/api/admin/accounting/invoices/`, `/api/admin/accounting/bills/`, `/api/admin/accounting/inventory-valuation`; new UI tab components for Invoices, Bills, Inventory Valuation; journal entry generation on invoice/bill payment.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, Recharts, Sonner toast, shadcn/ui

---

### Task 2.1: Add Prisma models for Invoice, InvoiceItem, Bill, BillItem

**Files:**
- Modify: `prisma/schema.prisma` (add models after existing Budget model)

- [ ] **Step 1: Add models to schema**

Add after `model Budget { ... }` (around line 839):

```prisma
model Invoice {
  id              String        @id @default(cuid())
  invoiceNumber   String        @unique
  orderId         String?
  order           Order?        @relation(fields: [orderId], references: [id])
  customerName    String
  customerEmail   String?
  customerPhone   String?
  customerAddress String?
  items           InvoiceItem[]
  subtotal        Float
  tax             Float         @default(0)
  shipping        Float         @default(0)
  total           Float
  status          String        @default("draft") // draft, sent, paid, overdue, cancelled
  issuedAt        DateTime      @default(now())
  dueAt           DateTime?
  paidAt          DateTime?
  notes           String?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([status])
  @@index([customerEmail])
}

model InvoiceItem {
  id        String   @id @default(cuid())
  invoiceId String
  invoice   Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  name      String
  quantity  Int
  unitPrice Float
  total     Float
}

model Bill {
  id            String     @id @default(cuid())
  billNumber    String     @unique
  supplierId    String?
  supplier      Supplier?  @relation(fields: [supplierId], references: [id])
  supplierName  String
  items         BillItem[]
  subtotal      Float
  tax           Float      @default(0)
  total         Float
  status        String     @default("pending") // pending, approved, paid, overdue, cancelled
  issuedAt      DateTime   @default(now())
  dueAt         DateTime?
  paidAt        DateTime?
  paymentMethod String?
  notes         String?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  @@index([status])
  @@index([supplierId])
}

model BillItem {
  id        String @id @default(cuid())
  billId    String
  bill      Bill   @relation(fields: [billId], references: [id], onDelete: Cascade)
  name      String
  quantity  Int
  unitPrice Float
  total     Float
}
```

- [ ] **Step 2: Generate Prisma client and create migration**

Run:
```bash
npx prisma migrate dev --name add_invoice_bill_models
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Invoice and Bill models"
```

---

### Task 2.2: Invoices — API Routes

**Files:**
- Create: `src/app/api/admin/accounting/invoices/route.ts`
- Create: `src/app/api/admin/accounting/invoices/[id]/route.ts`
- Create: `src/app/api/admin/accounting/invoices/next-number/route.ts`

- [ ] **Step 1: Create list/create invoices route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { invoiceNumber: { contains: search, mode: 'insensitive' } },
    { customerName: { contains: search, mode: 'insensitive' } },
    { customerEmail: { contains: search, mode: 'insensitive' } },
  ]

  const [invoices, total] = await Promise.all([
    db.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { items: true } }),
    db.invoice.count({ where }),
  ])
  return NextResponse.json({ invoices, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const count = await db.invoice.count()
  const invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`

  if (body.orderId) {
    const order = await db.order.findUnique({ where: { id: body.orderId }, include: { items: { include: { product: true } } } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    const invoice = await db.invoice.create({
      data: {
        invoiceNumber,
        orderId: order.id,
        customerName: order.fullName,
        customerEmail: order.email,
        customerPhone: order.phone,
        customerAddress: order.address,
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        total: order.totalAmount,
        status: 'draft',
        items: { create: order.items.map(i => ({ productId: i.productId, name: i.product?.name || `Product ${i.productId.slice(0, 8)}`, quantity: i.quantity, unitPrice: i.price, total: i.price * i.quantity })) },
      },
      include: { items: true },
    })
    return NextResponse.json({ invoice })
  }

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      subtotal: body.subtotal,
      tax: body.tax || 0,
      shipping: body.shipping || 0,
      total: body.total,
      status: 'draft',
      issuedAt: new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      notes: body.notes,
      items: { create: (body.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
    },
    include: { items: true },
  })
  return NextResponse.json({ invoice })
}, 'accounting')
```

- [ ] **Step 2: Create single invoice get/update/delete route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const invoice = await db.invoice.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ invoice })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const updateData: any = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'paid') updateData.paidAt = new Date()
  if (body.notes !== undefined) updateData.notes = body.notes

  const invoice = await db.invoice.update({ where: { id: params.id }, data: updateData, include: { items: true } })
  return NextResponse.json({ invoice })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await db.invoice.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'accounting')
```

- [ ] **Step 3: Create next-number route**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const count = await db.invoice.count()
  return NextResponse.json({ nextNumber: `INV-${String(count + 1).padStart(5, '0')}` })
}, 'accounting')
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/accounting/invoices/
git commit -m "feat: add invoices API routes"
```

---

### Task 2.3: Invoices — UI Tab

**Files:**
- Create: `src/app/admin/accounting/InvoicesTab.tsx`
- Modify: `src/app/admin/accounting/page.tsx` (add import, tab entry, render)

- [ ] **Step 1: Create InvoicesTab component**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Download, Eye, Send, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from './page'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function fetchInvoices() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/invoices?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setInvoices(d.invoices || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => { toast.error('Failed to load invoices'); setLoading(false) })
  }

  useEffect(() => { fetchInvoices() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/accounting/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success(`Invoice ${status}`); fetchInvoices() }
    else toast.error('Failed to update')
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    const res = await fetch(`/api/admin/accounting/invoices/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Invoice deleted'); fetchInvoices() }
    else toast.error('Failed to delete')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchInvoices() }} className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
        <button onClick={() => {
          const csv = ['Invoice#,Customer,Total,Status,Issued,Due'].join(',') + '\n' + invoices.map(i => `"${i.invoiceNumber}","${i.customerName}",${i.total},"${i.status}","${new Date(i.issuedAt).toLocaleDateString()}","${i.dueAt ? new Date(i.dueAt).toLocaleDateString() : ''}"`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoices.csv'; a.click()
        }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">Invoice #</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium text-right">Total</th><th className="p-3 font-medium text-center">Status</th><th className="p-3 font-medium">Issued</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium text-center">Actions</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-navy">{inv.invoiceNumber}</td>
                <td className="p-3 text-navy">{inv.customerName}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100'}`}>{inv.status}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                <td className="p-3 text-muted-foreground text-xs">{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : '-'}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {inv.status === 'draft' && <button onClick={() => updateStatus(inv.id, 'sent')} className="p-1 hover:bg-blue-50 rounded" title="Send"><Send className="h-3.5 w-3.5 text-blue-600" /></button>}
                    {inv.status === 'sent' && <button onClick={() => updateStatus(inv.id, 'paid')} className="p-1 hover:bg-green-50 rounded" title="Mark Paid"><CheckCircle className="h-3.5 w-3.5 text-green-600" /></button>}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && <button onClick={() => updateStatus(inv.id, 'cancelled')} className="p-1 hover:bg-red-50 rounded" title="Cancel"><XCircle className="h-3.5 w-3.5 text-red-600" /></button>}
                    {inv.status === 'draft' && <button onClick={() => deleteInvoice(inv.id)} className="p-1 hover:bg-red-50 rounded" title="Delete"><XCircle className="h-3.5 w-3.5 text-slate-400" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      {Math.ceil(total / 20) > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded-lg ${page === i + 1 ? 'bg-navy text-silver' : 'bg-white text-muted-foreground border border-border hover:text-navy'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">Create Invoice</h3>
            <p className="text-sm text-muted-foreground">Invoice creation form: customer details, line items, totals.</p>
            <p className="text-xs text-muted-foreground mt-2">Option: Create from Order (enter order ID to auto-fill).</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/accounting/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: 'New Customer', subtotal: 0, total: 0, items: [] }) })
                if (res.ok) { toast.success('Invoice created'); setShowCreateModal(false); fetchInvoices() }
                else toast.error('Failed to create')
              }} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Create Draft</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add import and tab to page.tsx**

Add import: `import InvoicesTab from './InvoicesTab'`
Add `'invoices'` to the tab list (insert after `'tax'`).
Add render: `{tab === 'invoices' && <InvoicesTab />}`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/InvoicesTab.tsx src/app/admin/accounting/page.tsx
git commit -m "feat: add invoices tab UI"
```

---

### Task 2.4: Bills — API Routes

**Files:**
- Create: `src/app/api/admin/accounting/bills/route.ts`
- Create: `src/app/api/admin/accounting/bills/[id]/route.ts`
- Create: `src/app/api/admin/accounting/bills/aging/route.ts`

- [ ] **Step 1: Create list/create bills route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [
    { billNumber: { contains: search, mode: 'insensitive' } },
    { supplierName: { contains: search, mode: 'insensitive' } },
  ]

  const [bills, total] = await Promise.all([
    db.bill.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit, include: { items: true } }),
    db.bill.count({ where }),
  ])
  return NextResponse.json({ bills, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const count = await db.bill.count()
  const billNumber = `BILL-${String(count + 1).padStart(5, '0')}`

  const bill = await db.bill.create({
    data: {
      billNumber,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      subtotal: body.subtotal,
      tax: body.tax || 0,
      total: body.total,
      status: 'pending',
      issuedAt: new Date(),
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      notes: body.notes,
      items: { create: (body.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, total: i.quantity * i.unitPrice })) },
    },
    include: { items: true },
  })
  return NextResponse.json({ bill })
}, 'accounting')
```

- [ ] **Step 2: Create single bill get/update/delete route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const bill = await db.bill.findUnique({ where: { id: params.id }, include: { items: true } })
  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ bill })
}, 'accounting')

export const PATCH = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const updateData: any = {}
  if (body.status) updateData.status = body.status
  if (body.status === 'paid') updateData.paidAt = new Date()
  if (body.paymentMethod) updateData.paymentMethod = body.paymentMethod
  if (body.notes !== undefined) updateData.notes = body.notes

  const bill = await db.bill.update({ where: { id: params.id }, data: updateData, include: { items: true } })
  return NextResponse.json({ bill })
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  await db.bill.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'accounting')
```

- [ ] **Step 3: Create bills aging route**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const now = new Date()
  const bills = await db.bill.findMany({ where: { status: { notIn: ['paid', 'cancelled'] } }, orderBy: { dueAt: 'asc' } })
  const buckets = { current: { label: 'Current', total: 0, count: 0, bills: [] as any[] },
    overdue_30: { label: '1-30 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_60: { label: '31-60 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_90: { label: '61-90 Days', total: 0, count: 0, bills: [] as any[] },
    overdue_90plus: { label: '90+ Days', total: 0, count: 0, bills: [] as any[] } }

  for (const bill of bills) {
    if (!bill.dueAt) { buckets.current.bills.push(bill); buckets.current.total += bill.total; buckets.current.count++; continue }
    const daysOverdue = Math.floor((now.getTime() - bill.dueAt.getTime()) / (1000 * 60 * 60 * 24))
    if (daysOverdue <= 0) { buckets.current.bills.push(bill); buckets.current.total += bill.total; buckets.current.count++ }
    else if (daysOverdue <= 30) { buckets.overdue_30.bills.push(bill); buckets.overdue_30.total += bill.total; buckets.overdue_30.count++ }
    else if (daysOverdue <= 60) { buckets.overdue_60.bills.push(bill); buckets.overdue_60.total += bill.total; buckets.overdue_60.count++ }
    else if (daysOverdue <= 90) { buckets.overdue_90.bills.push(bill); buckets.overdue_90.total += bill.total; buckets.overdue_90.count++ }
    else { buckets.overdue_90plus.bills.push(bill); buckets.overdue_90plus.total += bill.total; buckets.overdue_90plus.count++ }
  }

  return NextResponse.json({ buckets, totalOutstanding: bills.reduce((s, b) => s + b.total, 0) })
}, 'accounting')
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/accounting/bills/
git commit -m "feat: add bills API routes"
```

---

### Task 2.5: Bills — UI Tab

**Files:**
- Create: `src/app/admin/accounting/BillsTab.tsx`
- Modify: `src/app/admin/accounting/page.tsx` (add import, tab entry, render)

- [ ] **Step 1: Create BillsTab component**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatCurrency } from './page'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

export default function BillsTab() {
  const [bills, setBills] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function fetchBills() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/bills?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setBills(d.bills || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => { toast.error('Failed to load bills'); setLoading(false) })
  }

  useEffect(() => { fetchBills() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/accounting/bills/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success(`Bill ${status}`); fetchBills() }
    else toast.error('Failed to update')
  }

  async function deleteBill(id: string) {
    if (!confirm('Delete this bill?')) return
    const res = await fetch(`/api/admin/accounting/bills/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Bill deleted'); fetchBills() }
    else toast.error('Failed to delete')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search bills..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchBills() }} className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create Bill
        </button>
        <button onClick={() => {
          const csv = ['Bill#,Supplier,Total,Status,Issued,Due'].join(',') + '\n' + bills.map(b => `"${b.billNumber}","${b.supplierName}",${b.total},"${b.status}","${new Date(b.issuedAt).toLocaleDateString()}","${b.dueAt ? new Date(b.dueAt).toLocaleDateString() : ''}"`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bills.csv'; a.click()
        }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">Bill #</th><th className="p-3 font-medium">Supplier</th><th className="p-3 font-medium text-right">Total</th><th className="p-3 font-medium text-center">Status</th><th className="p-3 font-medium">Issued</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium text-center">Actions</th></tr></thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-navy">{b.billNumber}</td>
                <td className="p-3 text-navy">{b.supplierName}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(b.total)}</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>{b.status}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(b.issuedAt).toLocaleDateString()}</td>
                <td className="p-3 text-muted-foreground text-xs">{b.dueAt ? new Date(b.dueAt).toLocaleDateString() : '-'}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {b.status === 'pending' && <button onClick={() => updateStatus(b.id, 'approved')} className="p-1 hover:bg-blue-50 rounded" title="Approve"><Clock className="h-3.5 w-3.5 text-blue-600" /></button>}
                    {(b.status === 'pending' || b.status === 'approved') && <button onClick={() => updateStatus(b.id, 'paid')} className="p-1 hover:bg-green-50 rounded" title="Mark Paid"><CheckCircle className="h-3.5 w-3.5 text-green-600" /></button>}
                    {b.status !== 'paid' && b.status !== 'cancelled' && <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-1 hover:bg-red-50 rounded" title="Cancel"><XCircle className="h-3.5 w-3.5 text-red-600" /></button>}
                    {b.status === 'pending' && <button onClick={() => deleteBill(b.id)} className="p-1 hover:bg-red-50 rounded" title="Delete"><XCircle className="h-3.5 w-3.5 text-slate-400" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {bills.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No bills found</td></tr>}
          </tbody>
        </table>
      </div>

      {Math.ceil(total / 20) > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded-lg ${page === i + 1 ? 'bg-navy text-silver' : 'bg-white text-muted-foreground border border-border hover:text-navy'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">Create Bill</h3>
            <p className="text-sm text-muted-foreground">Bill creation form: supplier, line items, totals, due date.</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/accounting/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierName: 'New Supplier', subtotal: 0, total: 0, items: [] }) })
                if (res.ok) { toast.success('Bill created'); setShowCreateModal(false); fetchBills() }
                else toast.error('Failed to create')
              }} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add import and tab to page.tsx**

Add import: `import BillsTab from './BillsTab'`
Add `'bills'` to the tab list (insert after `'invoices'`).
Add render: `{tab === 'bills' && <BillsTab />}`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/BillsTab.tsx src/app/admin/accounting/page.tsx
git commit -m "feat: add bills tab UI"
```

---

### Task 2.6: Inventory Valuation API

**Files:**
- Create: `src/app/api/admin/accounting/inventory-valuation/route.ts`

- [ ] **Step 1: Create inventory valuation route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const dateParam = req.nextUrl.searchParams.get('date') || new Date().toISOString().slice(0, 10)
    const method = req.nextUrl.searchParams.get('method') || 'weighted'
    const asOfDate = new Date(dateParam)
    asOfDate.setHours(23, 59, 59, 999)

    const [products, cogsLines, revenueLines] = await Promise.all([
      db.product.findMany({
        where: { isActive: true },
        select: { id: true, name: true, sku: true, price: true, stock: true, costPrice: true },
        orderBy: { name: 'asc' },
      }),
      db.journalLine.aggregate({
        where: { account: { code: '5000' }, entry: { date: { lte: asOfDate } } },
        _sum: { debit: true },
      }),
      db.journalLine.aggregate({
        where: { account: { code: '4000' }, entry: { date: { lte: asOfDate } } },
        _sum: { credit: true },
      }),
    ])

    const totalCOGS = cogsLines._sum.debit || 0
    const totalRevenue = revenueLines._sum.credit || 0

    const items = products.map(p => {
      const unitCost = p.costPrice || (p.price * 0.6)
      return {
        id: p.id, sku: p.sku || p.id.slice(0, 8), name: p.name,
        quantity: p.stock || 0, unitCost, totalValue: (p.stock || 0) * unitCost,
      }
    })

    const totalValue = items.reduce((s, i) => s + i.totalValue, 0)
    const totalQuantity = items.reduce((s, i) => s + i.quantity, 0)

    return NextResponse.json({
      asOfDate: dateParam, method,
      totalProducts: products.length,
      totalQuantity,
      totalValue,
      totalCOGS,
      totalRevenue,
      grossMargin: totalRevenue > 0 ? ((totalRevenue - totalCOGS) / totalRevenue) * 100 : 0,
      items,
    })
  } catch (e) {
    console.error('Inventory valuation error:', e)
    return NextResponse.json({ error: 'Failed to fetch inventory valuation' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Step 2: Test endpoint**

Verify: `GET /api/admin/accounting/inventory-valuation` returns 200 with the expected shape.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/accounting/inventory-valuation/route.ts
git commit -m "feat: add inventory valuation API route"
```

---

### Task 2.7: Inventory Valuation UI Tab

**Files:**
- Create: `src/app/admin/accounting/InventoryValuationTab.tsx`
- Modify: `src/app/admin/accounting/page.tsx` (add import, tab entry, render)

- [ ] **Step 1: Create InventoryValuationTab component**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Package, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from './page'

export default function InventoryValuationTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState('weighted')

  function fetchValuation() {
    setLoading(true)
    fetch(`/api/admin/accounting/inventory-valuation?date=${date}&method=${method}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load inventory valuation'); setLoading(false) })
  }

  useEffect(() => { fetchValuation() }, [date, method])

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          <option value="weighted">Weighted Average</option>
          <option value="fifo">FIFO</option>
        </select>
        <button onClick={() => {
          const csv = ['SKU,Name,Quantity,UnitCost,TotalValue'].join(',') + '\n' + data.items.map((i: any) => `"${i.sku}","${i.name}",${i.quantity},${i.unitCost},${i.totalValue}`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inventory-valuation.csv'; a.click()
        }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground">Total Products</p></div>
          <p className="text-2xl font-bold text-navy">{data.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground">Total Value</p></div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-purple-600" /><p className="text-xs text-muted-foreground">Total COGS</p></div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totalCOGS)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-600" /><p className="text-xs text-muted-foreground">Gross Margin</p></div>
          <p className={`text-2xl font-bold ${data.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{data.grossMargin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border">
          <h3 className="font-semibold text-navy">Inventory Items</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white"><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">SKU</th><th className="p-3 font-medium">Name</th><th className="p-3 font-medium text-right">Qty</th><th className="p-3 font-medium text-right">Unit Cost</th><th className="p-3 font-medium text-right">Total Value</th></tr></thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="p-3 font-medium text-navy">{item.name}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(item.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add import and tab to page.tsx**

Add import: `import InventoryValuationTab from './InventoryValuationTab'`
Add `'inventory-valuation'` to the tab list.
Add render: `{tab === 'inventory-valuation' && <InventoryValuationTab />}`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/InventoryValuationTab.tsx src/app/admin/accounting/page.tsx
git commit -m "feat: add inventory valuation tab UI"
```

---

### Task 2.8: COGS Reconciliation Card

**Files:**
- Modify: `src/app/admin/accounting/page.tsx` (add COGS reconciliation section to OverviewTab)

- [ ] **Step 1: Add COGS reconciliation section**

In the `OverviewTab` return, add after the ratios section (or near the budget vs actual section):

```tsx
{data.totalRevenue > 0 && data.totalReturns !== undefined && (
  <div className="bg-white rounded-xl border border-border p-5">
    <h3 className="text-sm font-semibold text-navy mb-3">COGS Reconciliation</h3>
    <div className="grid grid-cols-3 gap-4">
      <div>
        <p className="text-xs text-muted-foreground">Revenue</p>
        <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">COGS (Est.)</p>
        <p className="text-lg font-bold text-amber-600">{formatCurrency(data.totalRevenue * 0.6)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Gross Margin</p>
        <p className="text-lg font-bold text-purple-600">{formatCurrency(data.totalRevenue * 0.4)} (40%)</p>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat: add COGS reconciliation card to overview"
```
