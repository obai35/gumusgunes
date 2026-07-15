# Phase 6: Operations

## Models (Prisma Schema)

Add these models to `prisma/schema.prisma`:

```prisma
model Warehouse {
  id        String   @id @default(cuid())
  name      String
  code      String   @unique
  address   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  stockLevels StockLevel[]
}

model StockLevel {
  id         String   @id @default(cuid())
  warehouseId String
  warehouse  Warehouse @relation(fields: [warehouseId], references: [id], onDelete: Cascade)
  productId  String
  product    Product   @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity   Int       @default(0)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([warehouseId, productId])
  @@index([productId])
}

model PurchaseOrder {
  id        String   @id @default(cuid())
  poNumber  String   @unique
  supplierId String
  supplier  Supplier @relation(fields: [supplierId], references: [id])
  notes     String?
  status    String   @default("pending") // pending, partial, received, cancelled
  total     Float    @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     PurchaseOrderItem[]
}

model PurchaseOrderItem {
  id        String         @id @default(cuid())
  poId      String
  po        PurchaseOrder  @relation(fields: [poId], references: [id], onDelete: Cascade)
  productId String
  product   Product        @relation(fields: [productId], references: [id])
  quantity  Int
  received  Int            @default(0)
  unitCost  Float
}

model ReturnRequest {
  id          String   @id @default(cuid())
  orderId     String
  order       Order    @relation(fields: [orderId], references: [id])
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Int
  reason      String
  status      String   @default("pending") // pending, approved, rejected, refunded
  rmaNumber   String   @unique
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([orderId])
  @@index([status])
}

model QC_Template {
  id        String   @id @default(cuid())
  name      String
  items     String   // JSON array of checklist items
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  checks    QC_Check[]
}

model QC_Check {
  id         String      @id @default(cuid())
  productId  String
  product    Product     @relation(fields: [productId], references: [id])
  templateId String?
  template   QC_Template? @relation(fields: [templateId], references: [id], onDelete: SetNull)
  passed     Boolean
  notes      String?
  checkedBy  String
  createdAt  DateTime    @default(now())
}
```

Then run: `npx prisma migrate dev --name add-operations`

---

## 1. Purchase Orders

### 1.1 API: Fetch suppliers list for dropdown

File: `src/app/api/admin/purchase-orders/suppliers/route.ts`

```ts
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const suppliers = await db.supplier.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, suppliers: suppliers.map(s => ({ id: s.id, name: s.name })) })
}, 'inventory')
```

### 1.2 API: Purchase Orders CRUD + receive flow

File: `src/app/api/admin/purchase-orders/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const search = req.nextUrl.searchParams.get('search') || ''
  const status = req.nextUrl.searchParams.get('status') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.poNumber = { contains: search, mode: 'insensitive' }

  const [purchaseOrders, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.purchaseOrder.count({ where }),
  ])

  return NextResponse.json({
    ok: true,
    purchaseOrders: purchaseOrders.map(po => ({
      ...po,
      total: po.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0),
    })),
    total,
    totalPages: Math.ceil(total / limit),
  })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest) => {
  const { supplierId, notes, items } = await req.json()

  if (!supplierId) return NextResponse.json({ error: 'Supplier required' }, { status: 400 })
  if (!items?.length) return NextResponse.json({ error: 'At least one item required' }, { status: 400 })

  const count = await db.purchaseOrder.count()
  const poNumber = `PO-${String(count + 1).padStart(5, '0')}`

  const purchaseOrder = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId,
      notes,
      items: {
        create: items.map((i: { productId: string; quantity: number; unitCost: number }) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitCost: i.unitCost,
        })),
      },
    },
    include: {
      supplier: { select: { id: true, name: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
  })

  return NextResponse.json({ ok: true, purchaseOrder })
}, 'inventory')
```

### 1.3 API: Receive PO items (partial or full)

File: `src/app/api/admin/purchase-orders/[id]/receive/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { items } = await req.json()

  const po = await db.purchaseOrder.findUnique({ where: { id }, include: { items: true } })
  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  if (po.status === 'cancelled') return NextResponse.json({ error: 'PO is cancelled' }, { status: 400 })
  if (po.status === 'received') return NextResponse.json({ error: 'PO already fully received' }, { status: 400 })

  const result = await db.$transaction(async tx => {
    for (const item of items) {
      const poi = po.items.find(i => i.id === item.id)
      if (!poi) continue
      const newReceived = poi.received + item.received
      if (newReceived > poi.quantity) throw new Error(`Receiving ${newReceived} exceeds order quantity ${poi.quantity} for item ${poi.id}`)

      await tx.purchaseOrderItem.update({
        where: { id: poi.id },
        data: { received: newReceived },
      })

      await tx.product.update({
        where: { id: poi.productId },
        data: { stock: { increment: item.received } },
      })

      await tx.inventoryLog.create({
        data: {
          productId: poi.productId,
          type: 'PURCHASE',
          change: item.received,
          note: `PO ${po.poNumber} received ${item.received} units`,
        },
      })
    }

    const updatedItems = await tx.purchaseOrderItem.findMany({ where: { poId: id } })
    const allReceived = updatedItems.every(i => i.received >= i.quantity)
    const anyReceived = updatedItems.some(i => i.received > 0)
    const status = allReceived ? 'received' : anyReceived ? 'partial' : 'pending'

    await tx.purchaseOrder.update({ where: { id }, data: { status } })

    return tx.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    })
  })

  return NextResponse.json({ ok: true, purchaseOrder: result })
}, 'inventory')
```

### 1.4 UI: Purchase Orders list page

File: `src/app/admin/purchase-orders/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import type { ColumnDef } from '@tanstack/react-table'

type PO = {
  id: string
  poNumber: string
  supplier: { name: string }
  status: string
  total: number
  createdAt: string
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  async function fetchPOs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/purchase-orders?${params}`)
      const data = await res.json()
      if (data.ok) {
        setPurchaseOrders(data.purchaseOrders || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch { toast.error('Failed to load purchase orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPOs() }, [page, statusFilter])

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
  }

  const columns: ColumnDef<PO>[] = [
    { accessorKey: 'poNumber', header: 'PO #', cell: ({ row }) => <span className="font-mono text-navy font-medium">{row.original.poNumber}</span> },
    { accessorKey: 'supplier.name', header: 'Supplier' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium text-navy">${row.original.total.toFixed(2)}</span> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/admin/purchase-orders/${row.original.id}`} className="text-gold text-xs font-medium hover:text-gold/80">View →</Link> },
  ]

  return (
    <div>
      <PageHeader title="Purchase Orders" actions={<Link href="/admin/purchase-orders/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> New PO</Link>} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search PO number..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <DataTable columns={columns} data={purchaseOrders} keyExtractor={po => po.id} loading={loading} emptyTitle="No purchase orders yet" emptyAction={{ label: 'Create PO', onClick: () => window.location.href = '/admin/purchase-orders/new' }} />
      <Pagination page={page} totalPages={totalPages} totalItems={purchaseOrders.length} pageSize={20} onPageChange={setPage} onPageSizeChange={() => {}} />
    </div>
  )
}
```

### 1.5 UI: New Purchase Order form

File: `src/app/admin/purchase-orders/new/page.tsx`

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Plus } from 'lucide-react'
import { toast } from 'sonner'

type Supplier = { id: string; name: string }

export default function NewPurchaseOrder() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ productId: string; productName: string; sku: string; quantity: number; unitCost: number }>>([])
  const [products, setProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/purchase-orders/suppliers').then(r => r.json()).then(d => setSuppliers(d.suppliers || [])).catch(() => {})
    fetch('/api/admin/products?limit=500').then(r => r.json()).then(d => setProducts(Array.isArray(d.products) ? d.products : [])).catch(() => {})
  }, [])

  function addItem(productId: string) {
    const p = products.find(x => x.id === productId)
    if (!p || items.find(i => i.productId === productId)) return
    setItems([...items, { productId, productName: p.name, sku: p.sku, quantity: 1, unitCost: 0 }])
    setSearchTerm('')
  }

  function removeItem(productId: string) {
    setItems(items.filter(i => i.productId !== productId))
  }

  function updateField(productId: string, field: string, value: number) {
    setItems(items.map(i => i.productId === productId ? { ...i, [field]: value } : i))
  }

  const filtered = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const total = items.reduce((s, i) => s + i.unitCost * i.quantity, 0)

  async function handleSubmit() {
    if (!supplierId) { toast.error('Select a supplier'); return }
    if (!items.length) { toast.error('Add at least one item'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          notes: notes || undefined,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitCost: i.unitCost })),
        }),
      })
      const data = await res.json()
      if (data.ok) { toast.success('Purchase order created'); router.push('/admin/purchase-orders') }
      else toast.error(data.error || 'Failed to create')
    } catch { toast.error('Failed to create purchase order') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">New Purchase Order</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Supplier</h2>
            <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Items</h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
            </div>
            {searchTerm && (
              <div className="max-h-40 overflow-y-auto border border-border rounded-lg mb-4">
                {filtered.slice(0, 10).map((p: any) => (
                  <button key={p.id} onClick={() => addItem(p.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-border/50 last:border-0 flex items-center gap-2">
                    <Plus className="h-3 w-3 text-gold" />
                    {p.name} <span className="text-muted-foreground">({p.sku})</span>
                  </button>
                ))}
                {filtered.length === 0 && <p className="p-3 text-sm text-muted-foreground">No products found</p>}
              </div>
            )}
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-navy flex-1 truncate">{item.productName} <span className="text-muted-foreground">({item.sku})</span></span>
                  <input type="number" min={1} value={item.quantity} onChange={e => updateField(item.productId, 'quantity', parseInt(e.target.value) || 1)} className="w-16 px-2 py-1 border border-border rounded text-sm text-center" placeholder="Qty" />
                  <input type="number" min={0} step={0.01} value={item.unitCost} onChange={e => updateField(item.productId, 'unitCost', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border border-border rounded text-sm text-center" placeholder="Cost" />
                  <span className="text-sm font-medium text-navy w-20 text-right">${(item.unitCost * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeItem(item.productId)} className="text-red-500 hover:text-red-700"><X className="h-4 w-4" /></button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items added</p>}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Notes</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={3} placeholder="Optional notes..." />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-border p-5 h-fit">
          <h2 className="font-semibold text-navy mb-4">Summary</h2>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between"><span className="text-muted-foreground">Items</span><span className="font-medium text-navy">{items.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Qty</span><span className="font-medium text-navy">{items.reduce((s, i) => s + i.quantity, 0)}</span></div>
            <div className="flex justify-between border-t border-border pt-2"><span className="font-medium text-navy">Total</span><span className="font-bold text-navy">${total.toFixed(2)}</span></div>
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{loading ? 'Creating...' : 'Create Purchase Order'}</button>
        </div>
      </div>
    </div>
  )
}
```

### 1.6 UI: Purchase Order detail with receive flow

File: `src/app/admin/purchase-orders/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { POReceiveClient } from './POReceiveClient'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      items: { include: { product: { select: { id: true, name: true, sku: true, imageUrl: true } } } },
    },
  })
  if (!po) notFound()

  return <POReceiveClient purchaseOrder={JSON.parse(JSON.stringify(po))} />
}
```

File: `src/app/admin/purchase-orders/[id]/POReceiveClient.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2, Package } from 'lucide-react'
import Link from 'next/link'

type POItem = { id: string; productId: string; product: { id: string; name: string; sku: string; imageUrl: string }; quantity: number; received: number; unitCost: number }

export function POReceiveClient({ purchaseOrder }: { purchaseOrder: any }) {
  const router = useRouter()
  const [receiveValues, setReceiveValues] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
  }

  async function handleReceive() {
    const items = purchaseOrder.items
      .filter((i: POItem) => (receiveValues[i.id] || 0) > 0)
      .map((i: POItem) => ({ id: i.id, received: Math.min(receiveValues[i.id] || 0, i.quantity - i.received) }))

    if (!items.length) { toast.error('Enter receive quantities'); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/purchase-orders/${purchaseOrder.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const data = await res.json()
      if (data.ok) { toast.success('Stock received'); router.refresh() }
      else toast.error(data.error || 'Receive failed')
    } catch { toast.error('Failed to receive') }
    finally { setLoading(false) }
  }

  const totalValue = purchaseOrder.items.reduce((s: number, i: POItem) => s + i.unitCost * i.quantity, 0)

  return (
    <div>
      <Link href="/admin/purchase-orders" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"><ArrowLeft className="h-4 w-4" /> Back to POs</Link>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-semibold text-navy">{purchaseOrder.poNumber}</h1>
          {statusBadge(purchaseOrder.status)}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-4">Items</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-3 font-medium">Product</th><th className="p-3 font-medium text-right">Ordered</th>
                <th className="p-3 font-medium text-right">Received</th><th className="p-3 font-medium text-right">Unit Cost</th>
                <th className="p-3 font-medium text-right">Subtotal</th>
                {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && <th className="p-3 font-medium text-right">Receive</th>}
              </tr></thead>
              <tbody>
                {purchaseOrder.items.map((item: POItem) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="p-3 font-medium text-navy flex items-center gap-2">
                      {item.product.imageUrl && <img src={item.product.imageUrl} className="h-8 w-8 rounded object-cover" />}
                      {item.product.name} <span className="text-muted-foreground font-normal">({item.product.sku})</span>
                    </td>
                    <td className="p-3 text-right text-navy">{item.quantity}</td>
                    <td className="p-3 text-right"><span className="text-green-600 font-medium">{item.received}</span></td>
                    <td className="p-3 text-right text-muted-foreground">${item.unitCost.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium text-navy">${(item.unitCost * item.quantity).toFixed(2)}</td>
                    {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
                      <td className="p-3 text-right">
                        <input type="number" min={0} max={item.quantity - item.received}
                          value={receiveValues[item.id] || ''}
                          onChange={e => setReceiveValues(v => ({ ...v, [item.id]: parseInt(e.target.value) || 0 }))}
                          disabled={(item.received >= item.quantity)}
                          className={`w-16 px-2 py-1 border border-border rounded text-sm text-center ${item.received >= item.quantity ? 'opacity-50' : ''}`}
                          placeholder="0"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t border-border font-medium text-navy">
                <td className="p-3" colSpan={4}>Total</td>
                <td className="p-3 text-right">${totalValue.toFixed(2)}</td>
                {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && <td />}
              </tr></tfoot>
            </table>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-semibold text-navy mb-3">Supplier</h2>
            <p className="text-sm text-navy">{purchaseOrder.supplier.name}</p>
            <p className="text-xs text-muted-foreground">{purchaseOrder.supplier.phone || 'No phone'}</p>
            {purchaseOrder.supplier.email && <p className="text-xs text-muted-foreground">{purchaseOrder.supplier.email}</p>}
          </div>
          {purchaseOrder.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-semibold text-navy mb-3">Notes</h2>
              <p className="text-sm text-muted-foreground">{purchaseOrder.notes}</p>
            </div>
          )}
          {purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled' && (
            <button onClick={handleReceive} disabled={loading} className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Package className="h-4 w-4" /> {loading ? 'Receiving...' : 'Receive Stock'}
            </button>
          )}
          {purchaseOrder.status === 'received' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-700">Fully Received</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## 2. Warehouse Management

### 2.1 API: Warehouse CRUD

File: `src/app/api/admin/warehouses/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const warehouses = await db.warehouse.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { stockLevels: true } } },
  })
  return NextResponse.json({ ok: true, warehouses: warehouses.map(w => ({ id: w.id, name: w.name, code: w.code, address: w.address, isActive: w.isActive, _count: w._count })) })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, code, address } = await req.json()
  if (!name || !code) return NextResponse.json({ error: 'Name and code required' }, { status: 400 })
  const existing = await db.warehouse.findUnique({ where: { code } })
  if (existing) return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 409 })
  const warehouse = await db.warehouse.create({ data: { name, code, address } })
  return NextResponse.json({ ok: true, warehouse })
}, 'inventory')

export const PUT = withAdmin(async (req: NextRequest) => {
  const { id, name, code, address, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const warehouse = await db.warehouse.update({ where: { id }, data: { name, code, address, isActive } })
  return NextResponse.json({ ok: true, warehouse })
}, 'inventory')

export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.warehouse.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'inventory')
```

### 2.2 API: Stock Levels per warehouse

File: `src/app/api/admin/warehouses/[id]/stock/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const search = req.nextUrl.searchParams.get('search') || ''

  const where: any = { warehouseId: id }
  if (search) {
    where.product = { OR: [{ name: { contains: search, mode: 'insensitive' } }, { sku: { contains: search, mode: 'insensitive' } }] }
  }

  const stockLevels = await db.stockLevel.findMany({
    where,
    include: { product: { select: { id: true, name: true, sku: true, imageUrl: true, stock: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ ok: true, stockLevels: stockLevels.map(sl => ({ id: sl.id, productId: sl.productId, productName: sl.product.name, sku: sl.product.sku, imageUrl: sl.product.imageUrl, quantity: sl.quantity, mainStock: sl.product.stock })) })
}, 'inventory')

export const POST = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { productId, quantity } = await req.json()
  if (!productId || quantity === undefined) return NextResponse.json({ error: 'productId and quantity required' }, { status: 400 })

  const stockLevel = await db.stockLevel.upsert({
    where: { warehouseId_productId: { warehouseId: id, productId } },
    create: { warehouseId: id, productId, quantity },
    update: { quantity },
  })
  return NextResponse.json({ ok: true, stockLevel })
}, 'inventory')
```

### 2.3 UI: Warehouses list page

File: `src/app/admin/warehouses/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Warehouse as WarehouseIcon, Package, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  async function fetchWarehouses() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/warehouses')
      const data = await res.json()
      if (data.ok) setWarehouses(data.warehouses || [])
    } catch { toast.error('Failed to load warehouses') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWarehouses() }, [])

  function resetForm() { setForm({ name: '', code: '', address: '' }); setEditing(null); setShowForm(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.code) { toast.error('Name and code required'); return }
    setSubmitting(true)
    try {
      const url = editing ? '/api/admin/warehouses' : '/api/admin/warehouses'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) })
      const data = await res.json()
      if (data.ok) { toast.success(editing ? 'Updated' : 'Created'); resetForm(); fetchWarehouses() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Operation failed') }
    finally { setSubmitting(false) }
  }

  async function toggleActive(w: any) {
    try {
      const res = await fetch('/api/admin/warehouses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: w.id, name: w.name, code: w.code, address: w.address, isActive: !w.isActive }) })
      const data = await res.json()
      if (data.ok) { toast.success('Toggled'); fetchWarehouses() }
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <PageHeader title="Warehouses" actions={<button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> Add Warehouse</button>} />
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">{editing ? 'Edit' : 'Add'} Warehouse</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Code</label><input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={2} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(w => (
            <div key={w.id} className={`bg-white rounded-xl border p-5 ${!w.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5 text-navy" />
                  <div>
                    <h3 className="font-semibold text-navy">{w.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{w.code}</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={w.isActive} onChange={() => toggleActive(w)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
                </label>
              </div>
              {w.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="h-3 w-3" /> {w.address}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> {w._count?.stockLevels || 0} products</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => window.location.href = `/admin/warehouses/${w.id}`} className="text-xs text-gold hover:text-gold/80 font-medium">View Stock</button>
                <button onClick={() => { setForm({ name: w.name, code: w.code, address: w.address || '' }); setEditing(w); setShowForm(true) }} className="text-xs text-muted-foreground hover:text-navy">Edit</button>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No warehouses yet</div>}
        </div>
      )}
    </div>
  )
}
```

### 2.4 UI: Warehouse stock detail

File: `src/app/admin/warehouses/[id]/page.tsx`

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { WarehouseStockClient } from './WarehouseStockClient'

export const dynamic = 'force-dynamic'

export default async function WarehouseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const warehouse = await db.warehouse.findUnique({ where: { id } })
  if (!warehouse) notFound()
  return <WarehouseStockClient warehouse={warehouse} />
}
```

File: `src/app/admin/warehouses/[id]/WarehouseStockClient.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function WarehouseStockClient({ warehouse }: { warehouse: any }) {
  const [stockLevels, setStockLevels] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    fetch(`/api/admin/warehouses/${warehouse.id}/stock${params}`)
      .then(r => r.json()).then(d => setStockLevels(d.stockLevels || [])).catch(() => {})
  }, [warehouse.id, search])

  return (
    <div>
      <Link href="/admin/warehouses" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-navy mb-4"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">{warehouse.name} Stock</h1>
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">Product</th><th className="p-3 font-medium">SKU</th>
            <th className="p-3 font-medium text-right">Warehouse Stock</th><th className="p-3 font-medium text-right">Main Stock</th>
          </tr></thead>
          <tbody>
            {stockLevels.map(sl => (
              <tr key={sl.id} className="border-b border-border/50">
                <td className="p-3 font-medium text-navy flex items-center gap-2">
                  {sl.imageUrl && <img src={sl.imageUrl} className="h-8 w-8 rounded object-cover" />}
                  {sl.productName}
                </td>
                <td className="p-3 text-muted-foreground font-mono text-xs">{sl.sku}</td>
                <td className="p-3 text-right font-medium text-navy">{sl.quantity}</td>
                <td className="p-3 text-right text-muted-foreground">{sl.mainStock}</td>
              </tr>
            ))}
            {stockLevels.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No stock records</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### 2.5 Update sidebar to add warehouses + purchase orders links

Edit `src/components/admin/Sidebar.tsx`: Add two new link entries after the `stock-transfers` entry:

```ts
  { href: '/admin/purchase-orders', label: 'Purchase Orders', icon: Package, permission: 'inventory' },
  { href: '/admin/warehouses', label: 'Warehouses', icon: Warehouse, permission: 'inventory' },
```

Also add `Warehouse` to the lucide-react import line if not already there.

### 2.6 Add new permissions to ALL_PERMISSIONS

Edit `src/lib/admin-permissions.ts` - no changes needed since we use `inventory` permission for all of these.

---

## 3. Barcode Generation

### 3.1 Install bwip-js dependency

```bash
npm install bwip-js
npm install --save-dev @types/bwip-js
```

### 3.2 API: Generate barcode for a product

File: `src/app/api/admin/products/[id]/barcode/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import bwipjs from 'bwip-js'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const product = await db.product.findUnique({ where: { id } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const numericId = id.replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0')
  const barcodeText = numericId

  try {
    const png = await bwipjs.toBuffer({
      bcid: 'ean13',
      text: barcodeText,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    })

    return new NextResponse(png, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${product.sku}-barcode.png"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Barcode generation failed' }, { status: 500 })
  }
}, 'products')
```

### 3.3 UI: Add "Generate Barcode" button to product edit page

File: `src/app/admin/products/[id]/edit/page.tsx` — add barcode section after StockHistory:

```tsx
import { BarcodeGenerator } from '../BarcodeGenerator'

// In the JSX, after <StockHistory productId={product.id} /> add:
// <BarcodeGenerator productId={product.id} sku={product.sku} />
```

File: `src/app/admin/products/[id]/BarcodeGenerator.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Barcode, Download } from 'lucide-react'
import { toast } from 'sonner'

export function BarcodeGenerator({ productId, sku }: { productId: string; sku: string }) {
  const [loading, setLoading] = useState(false)

  async function downloadBarcode() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/barcode`)
      if (!res.ok) { toast.error('Failed to generate barcode'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${sku}-barcode.png`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Barcode downloaded')
    } catch { toast.error('Failed to download barcode') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5 mt-6">
      <h2 className="font-display font-semibold text-navy mb-3 flex items-center gap-2"><Barcode className="h-4 w-4" /> Barcode</h2>
      <p className="text-sm text-muted-foreground mb-3">Generate an EAN-13 barcode for this product.</p>
      <button onClick={downloadBarcode} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors">
        <Download className="h-4 w-4" /> {loading ? 'Generating...' : 'Download Barcode PNG'}
      </button>
    </div>
  )
}
```

---

## 4. Shipping Labels

### 4.1 API: Generate shipping label for a shipment

File: `src/app/api/admin/shipping/shipments/[id]/label/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const shipment = await db.shipment.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { name: true, sku: true } } } },
          shippingMethod: true,
        },
      },
    },
  })
  if (!shipment) return NextResponse.json({ error: 'Shipment not found' }, { status: 404 })

  const order = shipment.order
  const addressSnapshot = (() => { try { return JSON.parse(shipment.addressSnapshot) } catch { return {} } })()

  const labelHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
  .label { width: 4in; padding: 10px; border: 1px solid #ccc; }
  .header { text-align: center; border-bottom: 1px solid #333; padding-bottom: 8px; margin-bottom: 8px; }
  .header h2 { margin: 0; font-size: 14px; }
  .header p { margin: 2px 0; font-size: 11px; }
  .section { margin-bottom: 8px; }
  .section h3 { font-size: 11px; margin: 0 0 4px; text-transform: uppercase; color: #555; }
  .section p { margin: 2px 0; font-size: 12px; }
  .items { font-size: 11px; }
  .items td { padding: 2px 4px; }
  .barcode { text-align: center; margin: 8px 0; font-family: monospace; font-size: 16px; letter-spacing: 2px; }
  .footer { text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ccc; padding-top: 6px; }
  @media print { body { padding: 0; } .label { border: none; } }
</style></head><body>
<div class="label">
  <div class="header">
    <h2>SHIPPING LABEL</h2>
    <p>Order #${order.orderNumber} | ${shipment.trackingNumber}</p>
  </div>
  <div class="section">
    <h3>Ship To</h3>
    <p><strong>${addressSnapshot.fullName || order.fullName}</strong></p>
    <p>${addressSnapshot.street || order.address}</p>
    <p>${addressSnapshot.city || order.city}${addressSnapshot.state ? ', ' + addressSnapshot.state : ''} ${addressSnapshot.postalCode || order.postalCode}</p>
    <p>${addressSnapshot.country || order.country}</p>
    ${addressSnapshot.phone || order.phone ? `<p>Phone: ${addressSnapshot.phone || order.phone}</p>` : ''}
  </div>
  <div class="section">
    <h3>Shipping Method</h3>
    <p>${shipment.method?.name || order.shippingMethod?.name || 'Standard'}</p>
  </div>
  <div class="section">
    <h3>Items</h3>
    <table class="items"><tr><th>Qty</th><th>SKU</th><th>Name</th></tr>
    ${order.items.map(i => `<tr><td>${i.quantity}</td><td>${i.product.sku}</td><td>${i.product.name}</td></tr>`).join('')}
    </table>
  </div>
  <div class="barcode">${shipment.trackingNumber}</div>
  <div class="footer">Generated ${new Date().toLocaleString()}</div>
</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`

  return new NextResponse(labelHtml, {
    headers: { 'Content-Type': 'text/html' },
  })
}, 'shipping')
```

### 4.2 UI: Add "Print Label" button to shipments tab

Edit `src/components/admin/shipping/ShipmentsTab.tsx` (read it first if exists, or create if not):

First check the file:

```bash
cat src/components/admin/shipping/ShipmentsTab.tsx
```

If the file exists, find the table/actions column and add a "Print Label" button that opens `/api/admin/shipping/shipments/${shipment.id}/label` in a new window.

If it doesn't exist, the plan is: In the shipments tab where tracking numbers are listed, add a column/button:

```tsx
<button
  onClick={() => window.open(`/api/admin/shipping/shipments/${shipment.id}/label`, '_blank')}
  className="text-xs text-gold hover:text-gold/80 font-medium"
>
  Print Label
</button>
```

---

## 5. Returns Dashboard

### 5.1 API: Return Requests CRUD

File: `src/app/api/admin/return-requests/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const status = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') || '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  const where: any = {}
  if (status) where.status = status
  if (search) where.OR = [{ rmaNumber: { contains: search, mode: 'insensitive' } }, { order: { orderNumber: { contains: search, mode: 'insensitive' } } }]

  const [returnRequests, total] = await Promise.all([
    db.returnRequest.findMany({
      where,
      include: {
        order: { select: { id: true, orderNumber: true, fullName: true } },
        product: { select: { id: true, name: true, sku: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.returnRequest.count({ where }),
  ])

  return NextResponse.json({ ok: true, returnRequests, total, totalPages: Math.ceil(total / limit) })
}, 'orders')

export const POST = withAdmin(async (req: NextRequest) => {
  const { orderId, productId, quantity, reason, notes } = await req.json()
  if (!orderId || !productId || !quantity || !reason) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const count = await db.returnRequest.count()
  const rmaNumber = `RMA-${String(count + 1).padStart(5, '0')}`

  const returnRequest = await db.returnRequest.create({
    data: { orderId, productId, quantity, reason, notes, rmaNumber },
    include: {
      order: { select: { orderNumber: true, fullName: true } },
      product: { select: { name: true, sku: true } },
    },
  })

  return NextResponse.json({ ok: true, returnRequest })
}, 'orders')
```

### 5.2 API: Approve/Reject/Refund return requests

File: `src/app/api/admin/return-requests/[id]/status/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { status, notes } = await req.json()

  if (!['approved', 'rejected', 'refunded'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const returnRequest = await db.returnRequest.findUnique({ where: { id }, include: { product: true } })
  if (!returnRequest) return NextResponse.json({ error: 'Return request not found' }, { status: 404 })

  await db.$transaction(async tx => {
    await tx.returnRequest.update({ where: { id }, data: { status, notes: notes || undefined } })

    if (status === 'approved') {
      await tx.product.update({
        where: { id: returnRequest.productId },
        data: { stock: { increment: returnRequest.quantity } },
      })
      await tx.inventoryLog.create({
        data: {
          productId: returnRequest.productId,
          type: 'RETURN',
          change: returnRequest.quantity,
          note: `RMA ${returnRequest.rmaNumber} approved - restocked ${returnRequest.quantity} units`,
        },
      })
    }
  })

  return NextResponse.json({ ok: true })
}, 'orders')
```

### 5.3 UI: Returns Dashboard page

File: `src/app/admin/returns/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import type { ColumnDef } from '@tanstack/react-table'

type ReturnReq = {
  id: string
  rmaNumber: string
  status: string
  reason: string
  quantity: number
  notes: string | null
  createdAt: string
  order: { id: string; orderNumber: string; fullName: string }
  product: { id: string; name: string; sku: string; imageUrl: string }
}

export default function ReturnsDashboard() {
  const [returns, setReturns] = useState<ReturnReq[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchReturns() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/return-requests?${params}`)
      const data = await res.json()
      if (data.ok) { setReturns(data.returnRequests || []); setTotalPages(data.totalPages || 1) }
    } catch { toast.error('Failed to load return requests') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReturns() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/return-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.ok) { toast.success(`Return ${status}`); fetchReturns() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to update status') }
    finally { setActionLoading(null) }
  }

  const reasonLabels: Record<string, string> = {
    customer_change: 'Changed Mind', defective: 'Defective', wrong_item: 'Wrong Item',
    damaged: 'Damaged', other: 'Other',
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', refunded: 'bg-blue-100 text-blue-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>
  }

  const columns: ColumnDef<ReturnReq>[] = [
    { accessorKey: 'rmaNumber', header: 'RMA #', cell: ({ row }) => <span className="font-mono font-medium text-navy">{row.original.rmaNumber}</span> },
    { accessorKey: 'order.orderNumber', header: 'Order', cell: ({ row }) => <span className="text-navy">{row.original.order.orderNumber}</span> },
    { accessorKey: 'order.fullName', header: 'Customer' },
    {
      accessorKey: 'product.name', header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.product.imageUrl && <img src={row.original.product.imageUrl} className="h-7 w-7 rounded object-cover" />}
          <span>{row.original.product.name} <span className="text-muted-foreground text-xs">({row.original.product.sku})</span></span>
        </div>
      ),
    },
    { accessorKey: 'quantity', header: 'Qty', cell: ({ row }) => <span className="font-medium text-navy">{row.original.quantity}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-xs text-muted-foreground">{reasonLabels[row.original.reason] || row.original.reason}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => {
        if (row.original.status !== 'pending') return <span className="text-xs text-muted-foreground">—</span>
        return (
          <div className="flex gap-1">
            <button onClick={() => updateStatus(row.original.id, 'approved')} disabled={actionLoading === row.original.id} className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50" title="Approve"><CheckCircle className="h-4 w-4" /></button>
            <button onClick={() => updateStatus(row.original.id, 'rejected')} disabled={actionLoading === row.original.id} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50" title="Reject"><XCircle className="h-4 w-4" /></button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Returns Dashboard" subtitle="Manage RMA requests" />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search RMA or order..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <DataTable columns={columns} data={returns} keyExtractor={r => r.id} loading={loading} emptyTitle="No return requests" />
      <Pagination page={page} totalPages={totalPages} totalItems={returns.length} pageSize={20} onPageChange={setPage} onPageSizeChange={() => {}} />
    </div>
  )
}
```

### 5.4 Add "Returns" link to sidebar

Edit `src/components/admin/Sidebar.tsx` — add after `reviews`:

```ts
  { href: '/admin/returns', label: 'Returns', icon: RefreshCw, permission: 'orders' },
```

Add `RefreshCw` to the lucide-react imports.

---

## 6. Quality Control

### 6.1 API: QC Templates CRUD

File: `src/app/api/admin/qc/templates/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async () => {
  const templates = await db.qC_Template.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ ok: true, templates: templates.map(t => ({ ...t, items: JSON.parse(t.items) })) })
}, 'products')

export const POST = withAdmin(async (req: NextRequest) => {
  const { name, items, isActive } = await req.json()
  if (!name || !items?.length) return NextResponse.json({ error: 'Name and items required' }, { status: 400 })
  const template = await db.qC_Template.create({
    data: { name, items: JSON.stringify(items), isActive: isActive ?? true },
  })
  return NextResponse.json({ ok: true, template: { ...template, items: JSON.parse(template.items) } })
}, 'products')

export const PUT = withAdmin(async (req: NextRequest) => {
  const { id, name, items, isActive } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const template = await db.qC_Template.update({
    where: { id },
    data: { name, items: JSON.stringify(items), isActive },
  })
  return NextResponse.json({ ok: true, template: { ...template, items: JSON.parse(template.items) } })
}, 'products')

export const DELETE = withAdmin(async (req: NextRequest) => {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await db.qC_Template.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}, 'products')
```

### 6.2 API: QC Checks create + list

File: `src/app/api/admin/qc/checks/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const productId = req.nextUrl.searchParams.get('productId') || ''
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') || '20'))
  const skip = parseInt(req.nextUrl.searchParams.get('skip') || '0')

  const where = productId ? { productId } : {}
  const [checks, total] = await Promise.all([
    db.qC_Check.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        template: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.qC_Check.count({ where }),
  ])
  return NextResponse.json({ ok: true, checks, total })
}, 'products')

export const POST = withAdmin(async (req: NextRequest) => {
  const { productId, templateId, passed, notes } = await req.json()
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
  const admin = await requireAdmin('products') as any
  if (admin) return admin

  const token = await import('@/lib/admin-permissions').then(m => m.getAdminFromToken(req))
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const check = await db.qC_Check.create({
    data: { productId, templateId: templateId || null, passed, notes, checkedBy: token.name },
    include: {
      product: { select: { name: true, sku: true } },
      template: { select: { name: true } },
    },
  })
  return NextResponse.json({ ok: true, check })
}, 'products')
```

### 6.3 UI: Quality Control page

File: `src/app/admin/quality-control/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, CheckCircle2, ClipboardCheck, FileText, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

type QC_CHECK = {
  id: string
  product: { id: string; name: string; sku: string }
  template: { id: string; name: string } | null
  passed: boolean
  notes: string | null
  checkedBy: string
  createdAt: string
}

export default function QualityControlPage() {
  const [tab, setTab] = useState<'templates' | 'checks'>('templates')
  const [templates, setTemplates] = useState<any[]>([])
  const [checks, setChecks] = useState<QC_CHECK[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', items: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [checkForm, setCheckForm] = useState({ productId: '', templateId: '', passed: true, notes: '' })
  const [checkSubmitting, setCheckSubmitting] = useState(false)

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/qc/templates')
      const d = await res.json()
      if (d.ok) setTemplates(d.templates || [])
    } catch { toast.error('Failed to load templates') }
  }

  async function fetchChecks() {
    try {
      const res = await fetch('/api/admin/qc/checks?limit=50')
      const d = await res.json()
      if (d.ok) setChecks(d.checks || [])
    } catch { toast.error('Failed to load checks') }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTemplates(), fetchChecks()]).finally(() => setLoading(false))
    fetch('/api/admin/products?limit=200').then(r => r.json()).then(d => setProducts(Array.isArray(d.products) ? d.products : [])).catch(() => {})
  }, [])

  function resetForm() { setForm({ name: '', items: '' }); setEditing(null); setShowForm(false) }
  function resetCheckForm() { setCheckForm({ productId: '', templateId: '', passed: true, notes: '' }); setShowCheckForm(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.items) { toast.error('Name and items required'); return }
    const itemsArr = form.items.split('\n').filter(Boolean)
    setSubmitting(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/qc/templates', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id, items: itemsArr } : { ...form, items: itemsArr }),
      })
      const d = await res.json()
      if (d.ok) { toast.success(editing ? 'Updated' : 'Created'); resetForm(); fetchTemplates() }
      else toast.error(d.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setSubmitting(false) }
  }

  async function deleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/qc/templates?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) { toast.success('Deleted'); fetchTemplates() }
    } catch { toast.error('Failed to delete') }
  }

  async function handleCheckSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkForm.productId) { toast.error('Select a product'); return }
    setCheckSubmitting(true)
    try {
      const res = await fetch('/api/admin/qc/checks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkForm),
      })
      const d = await res.json()
      if (d.ok) { toast.success('Check recorded'); resetCheckForm(); fetchChecks() }
      else toast.error(d.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setCheckSubmitting(false) }
  }

  const checksColumns: ColumnDef<QC_CHECK>[] = [
    { accessorKey: 'product.name', header: 'Product', cell: ({ row }) => <span className="font-medium text-navy">{row.original.product.name} <span className="text-muted-foreground text-xs">({row.original.product.sku})</span></span> },
    { accessorKey: 'template.name', header: 'Template', cell: ({ row }) => <span className="text-xs">{row.original.template?.name || '—'}</span> },
    { accessorKey: 'passed', header: 'Result', cell: ({ row }) => row.original.passed ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Pass</span> : <span className="text-red-600 font-medium">Fail</span> },
    { accessorKey: 'checkedBy', header: 'Checked By' },
    { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.notes || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
  ]

  return (
    <div>
      <PageHeader title="Quality Control" actions={
        <div className="flex gap-2">
          <button onClick={() => { resetCheckForm(); setShowCheckForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"><ClipboardCheck className="h-4 w-4" /> New Check</button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> New Template</button>
        </div>
      } />
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['templates', 'checks'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'}`}>{t === 'templates' ? 'Templates' : 'Inspection Log'}</button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border border-border p-4 ${!t.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-navy flex items-center gap-2"><FileText className="h-4 w-4" /> {t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ name: t.name, items: Array.isArray(t.items) ? t.items.join('\n') : '' }); setEditing(t); setShowForm(true) }} className="text-xs text-muted-foreground hover:text-navy">Edit</button>
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {Array.isArray(t.items) && t.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-1">• {item}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">{t.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No templates yet</div>}
        </div>
      )}

      {tab === 'checks' && (
        <DataTable columns={checksColumns} data={checks} keyExtractor={c => c.id} loading={loading} emptyTitle="No inspections recorded" />
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-navy">{editing ? 'Edit' : 'New'} Template</h3><button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Checklist Items (one per line)</label><textarea required value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={6} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check Form Modal */}
      {showCheckForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetCheckForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-navy">Record QC Check</h3><button onClick={resetCheckForm}><X className="h-4 w-4 text-muted-foreground" /></button></div>
            <form onSubmit={handleCheckSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Product</label>
                <select required value={checkForm.productId} onChange={e => setCheckForm(f => ({ ...f, productId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1">
                  <option value="">Select product...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-navy">Template</label>
                <select value={checkForm.templateId} onChange={e => setCheckForm(f => ({ ...f, templateId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1">
                  <option value="">No template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCheckForm(f => ({ ...f, passed: true }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${checkForm.passed ? 'bg-green-100 text-green-700 border-green-300' : 'border-border'}`}>PASS</button>
                <button type="button" onClick={() => setCheckForm(f => ({ ...f, passed: false }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${!checkForm.passed ? 'bg-red-100 text-red-700 border-red-300' : 'border-border'}`}>FAIL</button>
              </div>
              <div><label className="text-xs font-medium text-navy">Notes</label><textarea value={checkForm.notes} onChange={e => setCheckForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={2} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={checkSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{checkSubmitting ? 'Recording...' : 'Record Check'}</button>
                <button type="button" onClick={resetCheckForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
```

### 6.4 Add QC link to sidebar

Edit `src/components/admin/Sidebar.tsx` — add a new entry near inventory/products:

```ts
  { href: '/admin/quality-control', label: 'Quality Control', icon: ClipboardCheck, permission: 'products' },
```

Add `ClipboardCheck` to the lucide-react imports.

---

## Summary of Files Created

| Area | Files |
|------|-------|
| **Schema** | `prisma/schema.prisma` (5 new models) |
| **Purchase Orders** | `src/app/api/admin/purchase-orders/suppliers/route.ts`, `src/app/api/admin/purchase-orders/route.ts`, `src/app/api/admin/purchase-orders/[id]/receive/route.ts`, `src/app/admin/purchase-orders/page.tsx`, `src/app/admin/purchase-orders/new/page.tsx`, `src/app/admin/purchase-orders/[id]/page.tsx`, `src/app/admin/purchase-orders/[id]/POReceiveClient.tsx` |
| **Warehouses** | `src/app/api/admin/warehouses/route.ts`, `src/app/api/admin/warehouses/[id]/stock/route.ts`, `src/app/admin/warehouses/page.tsx`, `src/app/admin/warehouses/[id]/page.tsx`, `src/app/admin/warehouses/[id]/WarehouseStockClient.tsx` |
| **Barcodes** | `src/app/api/admin/products/[id]/barcode/route.ts`, `src/app/admin/products/[id]/BarcodeGenerator.tsx` |
| **Shipping Labels** | `src/app/api/admin/shipping/shipments/[id]/label/route.ts` |
| **Returns** | `src/app/api/admin/return-requests/route.ts`, `src/app/api/admin/return-requests/[id]/status/route.ts`, `src/app/admin/returns/page.tsx` |
| **Quality Control** | `src/app/api/admin/qc/templates/route.ts`, `src/app/api/admin/qc/checks/route.ts`, `src/app/admin/quality-control/page.tsx` |
| **Sidebar Updates** | `src/components/admin/Sidebar.tsx` (add purchase-orders, warehouses, returns, quality-control links) |

## Execute Order

1. `npx prisma migrate dev --name add-operations`
2. `npm install bwip-js && npm install -D @types/bwip-js`
3. Create API routes first (all of them)
4. Create page components (all of them)
5. Update sidebar
6. `npm run build` to verify
