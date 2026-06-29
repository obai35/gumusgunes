# Excel Export & Order Returns/Edits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Excel export for accounting reports and order returns/edits with inventory restocking and return receipts.

**Architecture:** New `Return`/`ReturnItem` Prisma models for auditable returns; `exceljs`-based API routes stream styled .xlsx files; modal-based UIs in admin order detail page for process return and edit order; printable return receipt for POS.

**Tech Stack:** TypeScript, Next.js 16 App Router, Prisma 6 + SQLite, exceljs, Tailwind CSS v4, Zustand

---

### Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Return, ReturnItem models and Order fields**

Add before `model Newsletter`:

```prisma
model Return {
  id            String       @id @default(cuid())
  orderId       String
  order         Order        @relation(fields: [orderId], references: [id])
  returnNumber  String       @unique
  reason        String       // customer_change, defective, wrong_item, damaged, other
  refundMethod  String       // cash, store_credit, no_refund
  refundAmount  Float
  notes         String?
  restocked     Boolean      @default(false)
  processedById String
  processedBy   Admin        @relation(fields: [processedById], references: [id])
  createdAt     DateTime     @default(now())
  items         ReturnItem[]
}

model ReturnItem {
  id           String   @id @default(cuid())
  returnId     String
  return       Return   @relation(fields: [returnId], references: [id], onDelete: Cascade)
  productId    String
  product      Product  @relation(fields: [productId], references: [id])
  quantity     Int
  refundAmount Float
}
```

Add to Order model after `reconciledAt`:
```prisma
  editHistory    String?   // JSON array of { field, oldValue, newValue, editedAt, editedBy }
  refundedAmount Float     @default(0)
```

Also add the `returns` relation to Order:
```prisma
  returns        Return[]
```

Add to Admin model after `processedOrders`:
```prisma
  processedReturns Return[]
```

- [ ] **Step 2: Push schema to database**

```bash
npx prisma db push
```

Expected: Your database is now in sync with your Prisma schema.

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(db): add Return/ReturnItem models, order refund/edithistory fields"
```

---

### Task 2: Excel Export — Orders Route

**Files:**
- Create: `src/app/api/admin/accounting/export/orders/route.ts`

- [ ] **Step 1: Create the export route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const search = sp.get('search') || ''
    const status = sp.get('status') || ''
    const paymentStatus = sp.get('paymentStatus') || ''
    const branchId = sp.get('branchId') || ''
    const from = sp.get('from') || ''
    const to = sp.get('to') || ''

    const where: any = {}
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { receiptNumber: { contains: search } },
        { fullName: { contains: search } },
        { email: { contains: search } },
      ]
    }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (branchId) where.shift = { branchId }
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to + 'T23:59:59.999Z')
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        shift: { include: { branch: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Orders')
    ws.columns = [
      { header: 'Order #', key: 'orderNumber', width: 18 },
      { header: 'Receipt #', key: 'receiptNumber', width: 18 },
      { header: 'Customer', key: 'fullName', width: 22 },
      { header: 'Branch', key: 'branch', width: 15 },
      { header: 'Total', key: 'totalAmount', width: 14 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Payment', key: 'paymentMethod', width: 14 },
      { header: 'Payment Status', key: 'paymentStatus', width: 14 },
      { header: 'Fulfilled', key: 'fulfilledAt', width: 14 },
      { header: 'Reconciled', key: 'reconciledAt', width: 14 },
      { header: 'Date', key: 'createdAt', width: 18 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    headerRow.alignment = { horizontal: 'center' }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const paymentLabels: Record<string, string> = {
      cash: 'Cash', card: 'Card', split: 'Split',
      bank_transfer: 'Bank Transfer', instapay: 'InstaPay', wallet: 'Wallet',
    }

    orders.forEach((o) => {
      ws.addRow({
        orderNumber: o.orderNumber,
        receiptNumber: o.receiptNumber || '',
        fullName: o.fullName,
        branch: o.shift?.branch?.name || 'Online',
        totalAmount: o.totalAmount,
        status: o.status,
        paymentMethod: paymentLabels[o.paymentMethod] || o.paymentMethod,
        paymentStatus: o.paymentStatus,
        fulfilledAt: o.fulfilledAt ? new Date(o.fulfilledAt).toLocaleDateString() : '',
        reconciledAt: o.reconciledAt ? new Date(o.reconciledAt).toLocaleDateString() : '',
        createdAt: new Date(o.createdAt).toLocaleDateString(),
      })
    })

    ws.getColumn('totalAmount').numFmt = '$#,##0.00'
    ws.getColumn('totalAmount').alignment = { horizontal: 'right' }

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export orders' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/accounting/export/orders/route.ts
git commit -m "feat(export): add Excel export for orders"
```

---

### Task 3: Excel Export — Branches Route

**Files:**
- Create: `src/app/api/admin/accounting/export/branches/route.ts`

- [ ] **Step 1: Create the export route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'day'
    const now = new Date()
    let from: Date
    if (period === 'week') {
      from = new Date(now)
      from.setDate(from.getDate() - from.getDay())
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setHours(0, 0, 0, 0)
    }

    const branches = await prisma.branch.findMany({
      include: {
        shifts: {
          where: { startedAt: { gte: from } },
          include: { orders: { select: { totalAmount: true, paymentMethod: true, cashAmount: true, cardAmount: true, status: true } } },
        },
      },
    })

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Branches')
    ws.columns = [
      { header: 'Branch', key: 'name', width: 20 },
      { header: 'Revenue', key: 'totalRevenue', width: 14 },
      { header: 'Orders', key: 'orderCount', width: 12 },
      { header: 'Cash', key: 'cashTotal', width: 14 },
      { header: 'Card', key: 'cardTotal', width: 14 },
      { header: 'Bank Transfer', key: 'bankTotal', width: 14 },
      { header: 'InstaPay', key: 'instapayTotal', width: 14 },
      { header: 'Wallet', key: 'walletTotal', width: 14 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    branches.forEach((branch) => {
      const orders = branch.shifts.flatMap((s: any) => s.orders).filter((o: any) => o.status !== 'cancelled')
      const revenue = orders.reduce((s: number, o: any) => s + o.totalAmount, 0)
      ws.addRow({
        name: branch.name,
        totalRevenue: revenue,
        orderCount: orders.length,
        cashTotal: orders.reduce((s: number, o: any) => s + (o.cashAmount || (o.paymentMethod === 'cash' ? o.totalAmount : 0)), 0),
        cardTotal: orders.reduce((s: number, o: any) => s + (o.cardAmount || (o.paymentMethod === 'card' ? o.totalAmount : 0)), 0),
        bankTotal: orders.filter((o: any) => o.paymentMethod === 'bank_transfer').reduce((s: number, o: any) => s + o.totalAmount, 0),
        instapayTotal: orders.filter((o: any) => o.paymentMethod === 'instapay').reduce((s: number, o: any) => s + o.totalAmount, 0),
        walletTotal: orders.filter((o: any) => o.paymentMethod === 'wallet').reduce((s: number, o: any) => s + o.totalAmount, 0),
      })
    })

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="branches-${period}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export branch data' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/accounting/export/branches/route.ts
git commit -m "feat(export): add Excel export for branch data"
```

---

### Task 4: Excel Export — Reports Route

**Files:**
- Create: `src/app/api/admin/accounting/export/reports/route.ts`

- [ ] **Step 1: Create the export route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const type = sp.get('type') || 'daily'
    const fromParam = sp.get('from') || ''
    const toParam = sp.get('to') || ''

    const now = new Date()
    let from: Date
    let to: Date = new Date(now)
    to.setHours(23, 59, 59, 999)

    if (fromParam) {
      from = new Date(fromParam)
    } else if (type === 'weekly') {
      from = new Date(now)
      from.setDate(from.getDate() - 27)
      from.setHours(0, 0, 0, 0)
    } else if (type === 'monthly') {
      from = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    } else {
      from = new Date(now)
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
    }
    if (toParam) to = new Date(toParam + 'T23:59:59.999Z')

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: from, lte: to }, status: { not: 'cancelled' } },
      orderBy: { createdAt: 'asc' },
    })

    const grouped: Record<string, { revenue: number; count: number }> = {}
    for (const order of orders) {
      let key: string
      if (type === 'monthly') {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      } else if (type === 'weekly') {
        const d = new Date(order.createdAt)
        const weekStart = new Date(d)
        weekStart.setDate(d.getDate() - d.getDay())
        key = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
      } else {
        key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}-${String(order.createdAt.getDate()).padStart(2, '0')}`
      }
      if (!grouped[key]) grouped[key] = { revenue: 0, count: 0 }
      grouped[key].revenue += order.totalAmount
      grouped[key].count++
    }

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Reports')
    ws.columns = [
      { header: 'Period', key: 'period', width: 18 },
      { header: 'Revenue', key: 'revenue', width: 14 },
      { header: 'Orders', key: 'orderCount', width: 12 },
      { header: 'Avg Order Value', key: 'avgOrderValue', width: 16 },
    ]

    const headerRow = ws.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D2D50' } }
    ws.views = [{ state: 'frozen', ySplit: 1 }]

    const periods = Object.entries(grouped).map(([period, data]) => ({
      period,
      revenue: data.revenue,
      orderCount: data.count,
      avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }))

    periods.forEach((p) => { ws.addRow(p) })
    ws.getColumn('revenue').numFmt = '$#,##0.00'
    ws.getColumn('avgOrderValue').numFmt = '$#,##0.00'

    const buf = await wb.xlsx.writeBuffer()
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reports-${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to export reports' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/accounting/export/reports/route.ts
git commit -m "feat(export): add Excel export for reports"
```

---

### Task 5: Return & Edit API Routes

**Files:**
- Create: `src/app/api/admin/orders/[id]/return/route.ts`
- Create: `src/app/api/admin/orders/[id]/returns/route.ts`
- Create: `src/app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Create return route (POST)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { items, reason, refundMethod, notes, processedById } = body

    if (!items?.length) return NextResponse.json({ error: 'At least one item required' }, { status: 400 })
    if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    if (!refundMethod) return NextResponse.json({ error: 'Refund method is required' }, { status: 400 })
    if (!processedById) return NextResponse.json({ error: 'Processed by is required' }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    for (const ri of items) {
      const original = order.items.find((oi) => oi.productId === ri.productId)
      if (!original) return NextResponse.json({ error: `Product ${ri.productId} not in order` }, { status: 400 })
      if (ri.quantity > original.quantity) return NextResponse.json({ error: `Cannot return more than ordered for product ${ri.productId}` }, { status: 400 })
    }

    const refundAmount = items.reduce((sum: number, ri: any) => sum + (ri.refundAmount || 0), 0)

    const result = await prisma.$transaction(async (tx) => {
      const returnCount = await tx.return.count()
      const returnNumber = `RMA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(returnCount + 1).padStart(6, '0')}`

      const ret = await tx.return.create({
        data: {
          orderId: id,
          returnNumber,
          reason,
          refundMethod,
          refundAmount,
          notes: notes || null,
          restocked: true,
          processedById,
          items: {
            create: items.map((ri: any) => ({
              productId: ri.productId,
              quantity: ri.quantity,
              refundAmount: ri.refundAmount || 0,
            })),
          },
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      })

      for (const ri of items) {
        await tx.product.update({
          where: { id: ri.productId },
          data: { stock: { increment: ri.quantity } },
        })
        await tx.inventoryLog.create({
          data: {
            productId: ri.productId,
            type: 'RETURN',
            change: ri.quantity,
            note: `Return ${returnNumber} - Order ${order.orderNumber}`,
          },
        })
      }

      await tx.order.update({
        where: { id },
        data: { refundedAmount: { increment: refundAmount } },
      })

      return ret
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to process return' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create list returns route (GET)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const returns = await prisma.return.findMany({
      where: { orderId: id },
      include: {
        items: { include: { product: { select: { name: true, sku: true } } } },
        processedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(returns)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create edit order route (PUT)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { items, fullName, phone, address, city, postalCode, notes, editedById } = body

    if (!editedById) return NextResponse.json({ error: 'Edited by is required' }, { status: 400 })

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    if (order.status === 'cancelled') return NextResponse.json({ error: 'Cannot edit cancelled order' }, { status: 400 })

    const editEntries: any[] = []

    if (items) {
      for (const newItem of items) {
        const existing = order.items.find((oi) => oi.id === newItem.id)
        if (existing) {
          const diff = newItem.quantity - existing.quantity
          if (diff > 0) {
            const product = await prisma.product.findUnique({ where: { id: existing.productId } })
            if (!product || product.stock < diff) return NextResponse.json({ error: `Insufficient stock for ${existing.productId}` }, { status: 400 })
          }
          editEntries.push({ field: `item_${existing.productId}_qty`, oldValue: existing.quantity, newValue: newItem.quantity, editedAt: new Date().toISOString(), editedBy: editedById })
        }
      }
    }

    if (fullName && fullName !== order.fullName) editEntries.push({ field: 'fullName', oldValue: order.fullName, newValue: fullName, editedAt: new Date().toISOString(), editedBy: editedById })
    if (phone !== undefined && phone !== order.phone) editEntries.push({ field: 'phone', oldValue: order.phone || '', newValue: phone || '', editedAt: new Date().toISOString(), editedBy: editedById })
    if (address && address !== order.address) editEntries.push({ field: 'address', oldValue: order.address, newValue: address, editedAt: new Date().toISOString(), editedBy: editedById })
    if (city && city !== order.city) editEntries.push({ field: 'city', oldValue: order.city, newValue: city, editedAt: new Date().toISOString(), editedBy: editedById })
    if (postalCode !== undefined && postalCode !== order.postalCode) editEntries.push({ field: 'postalCode', oldValue: order.postalCode, newValue: postalCode || '', editedAt: new Date().toISOString(), editedBy: editedById })

    const existingHistory = order.editHistory ? JSON.parse(order.editHistory) : []
    const updatedHistory = [...existingHistory, ...editEntries]

    const result = await prisma.$transaction(async (tx) => {
      if (items) {
        for (const newItem of items) {
          const existing = order.items.find((oi) => oi.id === newItem.id)
          if (existing) {
            const diff = newItem.quantity - existing.quantity
            if (diff !== 0) {
              await tx.product.update({
                where: { id: existing.productId },
                data: { stock: { increment: -diff } },
              })
              await tx.inventoryLog.create({
                data: {
                  productId: existing.productId,
                  type: 'ADJUSTMENT',
                  change: -diff,
                  note: `Order edit - ${order.orderNumber}`,
                },
              })
            }
            await tx.orderItem.update({
              where: { id: existing.id },
              data: { quantity: newItem.quantity },
            })
          }
        }
      }

      const updateData: any = { editHistory: JSON.stringify(updatedHistory) }
      if (fullName) updateData.fullName = fullName
      if (phone !== undefined) updateData.phone = phone
      if (address) updateData.address = address
      if (city) updateData.city = city
      if (postalCode !== undefined) updateData.postalCode = postalCode
      if (notes !== undefined) updateData.notes = notes

      return tx.order.update({
        where: { id },
        data: updateData,
        include: { items: { include: { product: { select: { name: true } } } } },
      })
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to edit order' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/orders/
git commit -m "feat(api): add order return, list returns, and edit order routes"
```

---

### Task 6: Update Overview API

**Files:**
- Modify: `src/app/api/admin/accounting/overview/route.ts`

- [ ] **Step 1: Add pendingRefunds to overview response**

After `openShifts` constant in the Promise.all array, add:
```typescript
      pendingRefunds,
```

And in the response:
```typescript
      pendingRefunds,
```

Add the query variable:
```typescript
      const pendingRefunds = await prisma.return.count({
        where: { refundMethod: { not: 'no_refund' }, createdAt: { gte: today } },
      })
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/accounting/overview/route.ts
git commit -m "feat(api): add pendingRefunds to accounting overview"
```

---

### Task 7: Return Receipt Component

**Files:**
- Create: `src/app/pos/components/ReturnReceipt.tsx`

- [ ] **Step 1: Create printable return receipt component**

```typescript
'use client'

import { useEffect, useRef } from 'react'

interface ReturnReceiptProps {
  returnData: {
    returnNumber: string
    reason: string
    refundMethod: string
    refundAmount: number
    createdAt: string
    items: Array<{
      product: { name: string }
      quantity: number
      refundAmount: number
    }>
    order: { receiptNumber: string }
    processedBy: { name: string }
  }
  branchName: string
  onClose: () => void
}

export default function ReturnReceipt({ returnData, branchName, onClose }: ReturnReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null)
  const printedRef = useRef(false)

  useEffect(() => {
    if (!printedRef.current) {
      printedRef.current = true
      setTimeout(() => {
        window.print()
      }, 300)
    }
  }, [])

  const date = new Date(returnData.createdAt).toLocaleString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white">
      <div ref={receiptRef} className="bg-white text-black p-6 rounded-xl shadow-2xl max-w-sm w-full print:shadow-none print:rounded-none print:p-4">
        <div className="text-center border-b border-gray-300 pb-4 mb-4">
          <h1 className="text-lg font-bold uppercase tracking-wide">Return Receipt</h1>
          <p className="text-sm">{branchName}</p>
          <p className="text-xs text-gray-500">{date}</p>
        </div>

        <div className="text-xs space-y-1 mb-4">
          <p><span className="font-semibold">Return #:</span> {returnData.returnNumber}</p>
          <p><span className="font-semibold">Original Receipt:</span> #{returnData.order.receiptNumber}</p>
          <p><span className="font-semibold">Reason:</span> {returnData.reason.replace(/_/g, ' ')}</p>
        </div>

        <table className="w-full text-xs mb-4">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left pb-1 font-semibold">Item</th>
              <th className="text-center pb-1 font-semibold">Qty</th>
              <th className="text-right pb-1 font-semibold">Refund</th>
            </tr>
          </thead>
          <tbody>
            {returnData.items.map((item, i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-1">{item.product.name}</td>
                <td className="text-center py-1">{item.quantity}</td>
                <td className="text-right py-1">${item.refundAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right text-sm font-bold border-t border-gray-300 pt-2 mb-6">
          Total Refund: ${returnData.refundAmount.toFixed(2)}
          <p className="text-xs font-normal text-gray-500">Method: {returnData.refundMethod.replace(/_/g, ' ')}</p>
        </div>

        <div className="border-t border-gray-300 pt-4 space-y-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Phone Number:</p>
            <div className="border-b border-gray-400 mt-1 h-6"></div>
          </div>
          <div>
            <p className="text-xs text-gray-500">Signature:</p>
            <div className="border-b border-gray-400 mt-1 h-8"></div>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-6">
          <p>Processed by: {returnData.processedBy.name}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 print:hidden"
        >
          Close
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/components/ReturnReceipt.tsx
git commit -m "feat(pos): add printable return receipt component"
```

---

### Task 8: Update Accounting Page UI

**Files:**
- Modify: `src/app/admin/accounting/page.tsx`

- [ ] **Step 1: Add export buttons and pendingRefunds display**

Add to the OverviewTab component, after `todayOrders` stat card:
```tsx
          { label: 'Pending Refunds', value: `$${data.pendingRefunds?.toFixed(2) || '0.00'}`, color: 'text-red-600' },
```

Add `Download` icon import:
```tsx
import { Search, CheckCircle, DollarSign, Filter, X, Building2, CalendarDays, Download } from 'lucide-react'
```

In OrdersTab, add an "Export Excel" button before the filter button:
```tsx
        <button onClick={() => window.open(`/api/admin/accounting/export/orders?${new URLSearchParams({ ...(search && { search }), ...(statusFilter && { status: statusFilter }), ...(paymentFilter && { paymentStatus: paymentFilter }) })}`, '_blank')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> Export Excel
        </button>
```

In BranchesTab, add export next to period toggle:
```tsx
        <button onClick={() => window.open(`/api/admin/accounting/export/branches?period=${period}`, '_blank')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> Export Excel
        </button>
```

In ReportsTab, add export next to type toggle:
```tsx
        <button onClick={() => window.open(`/api/admin/accounting/export/reports?type=${type}`, '_blank')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> Export Excel
        </button>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat(ui): add export buttons and pending refunds to accounting page"
```

---

### Task 9: Create OrderDetail Client Components

**Files:**
- Create: `src/app/admin/orders/[id]/ReturnModal.tsx`
- Create: `src/app/admin/orders/[id]/EditOrderModal.tsx`
- Create: `src/app/admin/orders/[id]/ReturnsSection.tsx`
- Create: `src/app/admin/orders/[id]/EditHistory.tsx`
- Modify: `src/app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create ReturnModal component**

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface ReturnModalProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  adminId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ReturnModal({ orderId, items, adminId, onClose, onSuccess }: ReturnModalProps) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('customer_change')
  const [refundMethod, setRefundMethod] = useState('store_credit')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleItem(productId: string, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[productId]) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return { ...prev, [productId]: maxQty }
    })
  }

  function updateQty(productId: string, qty: number) {
    setSelectedItems((prev) => ({ ...prev, [productId]: Math.max(1, qty) }))
  }

  async function handleSubmit() {
    const productIds = Object.keys(selectedItems)
    if (productIds.length === 0) { toast.error('Select at least one item'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: productIds.map((pid) => ({
            productId: pid,
            quantity: selectedItems[pid],
            refundAmount: items.find((i) => i.productId === pid)!.price * selectedItems[pid],
          })),
          reason,
          refundMethod,
          notes: notes || undefined,
          processedById: adminId,
        }),
      })
      if (res.ok) { toast.success('Return processed'); onSuccess(); onClose() }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to process return') }
    finally { setLoading(false) }
  }

  const refundMethodLabels: Record<string, string> = {
    cash: 'Cash Refund', store_credit: 'Store Credit', no_refund: 'No Refund (Loss)',
  }
  const reasonLabels: Record<string, string> = {
    customer_change: 'Customer Changed Mind', defective: 'Defective Item',
    wrong_item: 'Wrong Item Received', damaged: 'Damaged in Transit', other: 'Other',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-navy mb-4">Process Return</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-navy mb-2">Select Items to Return</p>
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50">
                <input
                  type="checkbox"
                  checked={!!selectedItems[item.productId]}
                  onChange={() => toggleItem(item.productId, item.quantity)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-navy flex-1">{item.product.name}</span>
                {selectedItems[item.productId] && (
                  <input
                    type="number"
                    min={1}
                    max={item.quantity}
                    value={selectedItems[item.productId]}
                    onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)}
                    className="w-16 px-2 py-1 border border-border rounded text-sm text-center"
                  />
                )}
                <span className="text-sm text-muted-foreground w-20 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {Object.entries(reasonLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">Refund Method</label>
            <select value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {Object.entries(refundMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-navy block mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
            <button onClick={handleSubmit} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Processing...' : 'Process Return'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create EditOrderModal component**

```typescript
'use client'

import { useState } from 'react'
import { toast } from 'sonner'

interface EditOrderModalProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  customer: { fullName: string; phone: string | null; address: string; city: string; postalCode: string; notes: string | null }
  adminId: string
  onClose: () => void
  onSuccess: () => void
}

export default function EditOrderModal({ orderId, items, customer, adminId, onClose, onSuccess }: EditOrderModalProps) {
  const [editItems, setEditItems] = useState(items.map((i) => ({ id: i.id, productId: i.productId, name: i.product.name, quantity: i.quantity, maxQty: i.quantity })))
  const [fullName, setFullName] = useState(customer.fullName)
  const [phone, setPhone] = useState(customer.phone || '')
  const [address, setAddress] = useState(customer.address)
  const [city, setCity] = useState(customer.city)
  const [postalCode, setPostalCode] = useState(customer.postalCode)
  const [notes, setNotes] = useState(customer.notes || '')
  const [loading, setLoading] = useState(false)

  function updateItemQty(id: string, qty: number) {
    setEditItems((prev) => prev.map((i) => i.id === id ? { ...i, quantity: Math.max(0, qty) } : i))
  }

  async function handleSave() {
    const validItems = editItems.filter((i) => i.quantity > 0)
    if (validItems.length === 0) { toast.error('At least one item required'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map((i) => ({ id: i.id, productId: i.productId, quantity: i.quantity })),
          fullName, phone: phone || null, address, city, postalCode, notes: notes || null,
          editedById: adminId,
        }),
      })
      if (res.ok) { toast.success('Order updated'); onSuccess(); onClose() }
      else { const e = await res.json(); toast.error(e.error) }
    } catch { toast.error('Failed to update order') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-navy mb-4">Edit Order</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-navy mb-2">Items</h3>
            {editItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-sm text-navy flex-1">{item.name}</span>
                <button onClick={() => updateItemQty(item.id, 0)} className="text-xs text-red-600 hover:text-red-800 mr-2">Remove</button>
                <input
                  type="number" min={0} max={999} value={item.quantity}
                  onChange={(e) => updateItemQty(item.id, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-navy block mb-1">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-navy block mb-1">Postal Code</label>
              <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-navy block mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" rows={2} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create ReturnsSection component**

```typescript
'use client'

import { useEffect, useState } from 'react'

interface ReturnsSectionProps {
  orderId: string
}

export default function ReturnsSection({ orderId }: ReturnsSectionProps) {
  const [returns, setReturns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/orders/${orderId}/returns`)
      .then((r) => r.json())
      .then(setReturns)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) return null
  if (returns.length === 0) return null

  const refundLabels: Record<string, string> = {
    cash: 'Cash', store_credit: 'Store Credit', no_refund: 'No Refund',
  }
  const reasonLabels: Record<string, string> = {
    customer_change: 'Changed Mind', defective: 'Defective', wrong_item: 'Wrong Item', damaged: 'Damaged', other: 'Other',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">Returns ({returns.length})</h2>
      <div className="space-y-3">
        {returns.map((ret: any) => (
          <div key={ret.id} className="border border-border rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium text-navy">{ret.returnNumber}</span>
              <span className="text-muted-foreground text-xs">{new Date(ret.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground mb-2">
              <span>Reason: {reasonLabels[ret.reason] || ret.reason}</span>
              <span>Refund: {refundLabels[ret.refundMethod]}</span>
              <span className="font-medium text-red-600">${ret.refundAmount.toFixed(2)}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {ret.items?.map((ri: any) => (
                <span key={ri.id} className="mr-3">{ri.product?.name} x{ri.quantity}</span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">By: {ret.processedBy?.name}</div>
            {ret.notes && <div className="text-xs text-muted-foreground mt-1 italic">{ret.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create EditHistory component**

```typescript
'use client'

interface EditHistoryProps {
  editHistory: string | null
}

export default function EditHistory({ editHistory }: EditHistoryProps) {
  if (!editHistory) return null

  let entries: any[]
  try { entries = JSON.parse(editHistory) } catch { return null }
  if (entries.length === 0) return null

  const fieldLabels: Record<string, string> = {
    fullName: 'Customer Name', phone: 'Phone', address: 'Address', city: 'City', postalCode: 'Postal Code',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">Edit History</h2>
      <div className="space-y-3">
        {entries.map((entry: any, i: number) => {
          const label = fieldLabels[entry.field] || (entry.field?.startsWith('item_') ? 'Item Quantity' : entry.field)
          return (
            <div key={i} className="flex items-start gap-3 text-sm border-l-2 border-navy pl-3 py-1">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{new Date(entry.editedAt).toLocaleString()}</p>
                <p className="text-navy font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="line-through">{String(entry.oldValue).slice(0, 50)}</span>
                  {' → '}
                  <span className="text-green-600">{String(entry.newValue).slice(0, 50)}</span>
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground mt-2">Last edit by: {entries[entries.length - 1]?.editedBy || 'Unknown'}</p>
    </div>
  )
}
```

- [ ] **Step 5: Update the order detail page to integrate all components**

Replace the file content:

```typescript
import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { PaymentVerification } from './PaymentVerification'
import OrderDetailClient from './OrderDetailClient'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, discount: true },
  })
  if (!order) notFound()

  const items = order.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    product: { name: i.product.name },
    quantity: i.quantity,
    price: i.price,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.createdAt.toLocaleDateString()}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-navy">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex"><dt className="w-24 text-muted-foreground">Name</dt><dd className="text-navy">{order.fullName}</dd></div>
              <div className="flex"><dt className="w-24 text-muted-foreground">Email</dt><dd className="text-navy">{order.email}</dd></div>
              {order.phone && <div className="flex"><dt className="w-24 text-muted-foreground">Phone</dt><dd className="text-navy">{order.phone}</dd></div>}
              <div className="flex"><dt className="w-24 text-muted-foreground">Address</dt><dd className="text-navy">{order.address}, {order.city}, {order.postalCode}, {order.country}</dd></div>
            </dl>
          </div>

          {order.editHistory && <EditHistory editHistory={order.editHistory} />}

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <ReturnsSection orderId={order.id} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-navy">${order.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-navy">{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</dd></div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-green-600">-${order.discountAmount.toFixed(2)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="text-navy">${order.tax.toFixed(2)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><dt className="text-navy">Total</dt><dd className="text-navy">${order.totalAmount.toFixed(2)}</dd></div>
              {order.refundedAmount > 0 && (
                <div className="flex justify-between pt-1"><dt className="text-red-600">Refunded</dt><dd className="text-red-600">-${order.refundedAmount.toFixed(2)}</dd></div>
              )}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-display font-semibold text-navy mb-3">Payment</h2>
            <p className="text-sm text-muted-foreground">Method: <span className="font-medium text-navy">{order.paymentMethod}</span></p>
            <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'awaiting_verification' ? 'text-orange-600' : 'text-navy'}`}>{order.paymentStatus}</span></p>
            {order.paymentMethod === 'card' && order.stripePaymentIntentId && (
              <p className="text-xs text-muted-foreground">Stripe ID: <span className="font-mono">{order.stripePaymentIntentId}</span></p>
            )}
            {order.paymentMethod === 'paypal' && order.paypalOrderId && (
              <p className="text-xs text-muted-foreground">PayPal ID: <span className="font-mono">{order.paypalOrderId}</span></p>
            )}
            {order.walletProvider && (
              <p className="text-xs text-muted-foreground">Wallet: <span className="font-medium text-navy">{order.walletProvider}</span></p>
            )}
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground">Reference: <span className="font-mono font-medium text-navy">{order.paymentReference}</span></p>
            )}
            {order.paymentProofUrl && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Payment Proof:</p>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <img src={order.paymentProofUrl} alt="Payment proof" className="w-full rounded-lg border border-border max-h-40 object-cover" />
                </a>
              </div>
            )}
            {order.paymentVerifiedAt && (
              <p className="text-xs text-muted-foreground">Verified: {new Date(order.paymentVerifiedAt).toLocaleString()}</p>
            )}
            <PaymentVerification orderId={order.id} paymentStatus={order.paymentStatus} />
          </div>
          <div className="flex flex-col gap-2">
            <EditOrderModalWrapper orderId={order.id} items={items} customer={{ fullName: order.fullName, phone: order.phone, address: order.address, city: order.city, postalCode: order.postalCode, notes: order.notes }} />
            <ReturnModalWrapper orderId={order.id} items={items} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

Wait — the wrappers need a different approach. Since page.tsx is a server component, we need a client component wrapper. Let me create an `OrderDetailActions.tsx` client component:

```typescript
'use client'

import { useState } from 'react'
import ReturnModal from './ReturnModal'
import EditOrderModal from './EditOrderModal'

interface OrderDetailActionsProps {
  orderId: string
  items: Array<{ id: string; productId: string; product: { name: string }; quantity: number; price: number }>
  customer: { fullName: string; phone: string | null; address: string; city: string; postalCode: string; notes: string | null }
  adminId: string
}

export default function OrderDetailActions({ orderId, items, customer, adminId }: OrderDetailActionsProps) {
  const [showReturn, setShowReturn] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleSuccess() { setRefreshKey((k) => k + 1) }

  return (
    <>
      <div className="flex flex-col gap-2" data-refresh-key={refreshKey}>
        <button onClick={() => setShowReturn(true)} className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
          Process Return
        </button>
        <button onClick={() => setShowEdit(true)} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          Edit Order
        </button>
      </div>
      {showReturn && <ReturnModal orderId={orderId} items={items} adminId={adminId} onClose={() => setShowReturn(false)} onSuccess={handleSuccess} />}
      {showEdit && <EditOrderModal orderId={orderId} items={items} customer={customer} adminId={adminId} onClose={() => setShowEdit(false)} onSuccess={handleSuccess} />}
    </>
  )
}
```

Now the page.tsx uses `OrderDetailActions` as a client boundary and `ReturnsSection`/`EditHistory` as additional client components.

The final page.tsx should look like:

```typescript
import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { OrderStatusUpdater } from './OrderStatusUpdater'
import { PaymentVerification } from './PaymentVerification'
import ReturnsSection from './ReturnsSection'
import EditHistory from './EditHistory'
import OrderDetailActions from './OrderDetailActions'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, discount: true },
  })
  if (!order) notFound()

  const cookieStore = await cookies()
  const adminId = cookieStore.get('adminId')?.value || ''

  const items = order.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    product: { name: i.product.name },
    quantity: i.quantity,
    price: i.price,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.createdAt.toLocaleDateString()}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-navy">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex"><dt className="w-24 text-muted-foreground">Name</dt><dd className="text-navy">{order.fullName}</dd></div>
              <div className="flex"><dt className="w-24 text-muted-foreground">Email</dt><dd className="text-navy">{order.email}</dd></div>
              {order.phone && <div className="flex"><dt className="w-24 text-muted-foreground">Phone</dt><dd className="text-navy">{order.phone}</dd></div>}
              <div className="flex"><dt className="w-24 text-muted-foreground">Address</dt><dd className="text-navy">{order.address}, {order.city}, {order.postalCode}, {order.country}</dd></div>
            </dl>
          </div>

          <EditHistory editHistory={order.editHistory} />

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          <ReturnsSection orderId={order.id} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-navy">${order.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-navy">{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</dd></div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-green-600">-${order.discountAmount.toFixed(2)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="text-navy">${order.tax.toFixed(2)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><dt className="text-navy">Total</dt><dd className="text-navy">${order.totalAmount.toFixed(2)}</dd></div>
              {order.refundedAmount > 0 && (
                <div className="flex justify-between pt-1"><dt className="text-red-600">Refunded</dt><dd className="text-red-600">-${order.refundedAmount.toFixed(2)}</dd></div>
              )}
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5 space-y-2">
            <h2 className="font-display font-semibold text-navy mb-3">Payment</h2>
            <p className="text-sm text-muted-foreground">Method: <span className="font-medium text-navy">{order.paymentMethod}</span></p>
            <p className="text-sm text-muted-foreground">Status: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'awaiting_verification' ? 'text-orange-600' : 'text-navy'}`}>{order.paymentStatus}</span></p>
            {order.paymentMethod === 'card' && order.stripePaymentIntentId && (
              <p className="text-xs text-muted-foreground">Stripe ID: <span className="font-mono">{order.stripePaymentIntentId}</span></p>
            )}
            {order.paymentMethod === 'paypal' && order.paypalOrderId && (
              <p className="text-xs text-muted-foreground">PayPal ID: <span className="font-mono">{order.paypalOrderId}</span></p>
            )}
            {order.walletProvider && (
              <p className="text-xs text-muted-foreground">Wallet: <span className="font-medium text-navy">{order.walletProvider}</span></p>
            )}
            {order.paymentReference && (
              <p className="text-xs text-muted-foreground">Reference: <span className="font-mono font-medium text-navy">{order.paymentReference}</span></p>
            )}
            {order.paymentProofUrl && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Payment Proof:</p>
                <a href={order.paymentProofUrl} target="_blank" rel="noopener noreferrer">
                  <img src={order.paymentProofUrl} alt="Payment proof" className="w-full rounded-lg border border-border max-h-40 object-cover" />
                </a>
              </div>
            )}
            {order.paymentVerifiedAt && (
              <p className="text-xs text-muted-foreground">Verified: {new Date(order.paymentVerifiedAt).toLocaleString()}</p>
            )}
            <PaymentVerification orderId={order.id} paymentStatus={order.paymentStatus} />
          </div>
          <OrderDetailActions orderId={order.id} items={items} customer={{ fullName: order.fullName, phone: order.phone, address: order.address, city: order.city, postalCode: order.postalCode, notes: order.notes }} adminId={adminId} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/orders/[id]/
git commit -m "feat(ui): add returns, edit order, edit history to order detail"
```

---

### Task 10: Build & Verify

- [ ] **Step 1: Build the project**

```bash
node node_modules\next\dist\bin\next build --webpack
```

Expected: Compiled successfully with no errors related to the new files.

- [ ] **Step 2: Push schema if not already done**

```bash
npx prisma db push
```

- [ ] **Step 3: Start dev server and manually test**

```bash
node node_modules\next\dist\bin\next dev -p 3000 --webpack
```

Test:
- Navigate to `/admin/accounting` — all 4 tabs load with data
- Click "Export Excel" on Orders tab — downloads .xlsx file
- Click "Export Excel" on Branches tab — downloads .xlsx file  
- Click "Export Excel" on Reports tab — downloads .xlsx file
- Navigate to `/admin/orders/[id]` — order detail loads
- Click "Process Return" — modal opens, select items, submit — return created
- Click "Edit Order" — modal opens, change quantity, save — order updated
- Returns section shows past returns if any
- Edit history shows past edits if any

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete excel export and order returns/edits"
```
