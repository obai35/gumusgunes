# Reporting & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete reporting & analytics module with 8 report types: Custom Report Builder, P&L by Category, Customer LTV, Sales Heatmap, Inventory Valuation, Margin Analysis, YoY Comparison, and Forecasting.

**Architecture:** New `/admin/reports` page with inline tabs (following accounting pattern). 8 new API routes under `/api/admin/reports/`. 8 tab components. 1 new sidebar link. Uses Recharts (already installed 2.15.4), exceljs, and exportCSVRows. All tabs follow existing `'use client'` pattern.

**Tech Stack:** Next.js 16, React 19, Prisma ORM, PostgreSQL, Recharts 2.15.4, ExcelJS, Tailwind CSS, shadcn/ui

---

### Task 1: Add Reports Permissions and Sidebar Link

**Files:**
- Modify: `src/lib/admin-permissions.ts`
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Add 'reports' to ALL_PERMISSIONS** in `src/lib/admin-permissions.ts`

```ts
export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed', 'customer_service', 'social',
  'reports',
] as const
```

- [ ] **Add Reports sidebar link** in `src/components/admin/Sidebar.tsx` (insert between Accounting and Orders)

```ts
import { LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftLeft, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, BarChart3,
} from 'lucide-react'
```

Replace `ArrowLeftRight` import with `ArrowLeftLeft` (keep existing), add `BarChart3`:

Edit the imports:
```ts
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, BarChart3,
} from 'lucide-react'
```

Insert after Accounting link:
```ts
  { href: '/admin/reports', label: 'Reports', icon: BarChart3, permission: 'reports' },
```

- [ ] **Commit**

```bash
git add src/lib/admin-permissions.ts src/components/admin/Sidebar.tsx
git commit -m "feat: add reports permission and sidebar link"
```

---

### Task 2: Create Reports Page Shell

**Files:**
- Create: `src/app/admin/reports/page.tsx`
- Create: `src/app/admin/reports/loading.tsx`
- Create: `src/app/admin/reports/error.tsx`

- [ ] **Create loading.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="flex gap-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /><Skeleton className="h-8 w-20" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  )
}
```

- [ ] **Create error.tsx**

```tsx
'use client'
import { ErrorBoundary } from '@/components/admin/ErrorBoundary'

export default function ReportsError({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorBoundary error={error} reset={reset} />
}
```

- [ ] **Create page.tsx** — main page with 8 tabs

```tsx
'use client'

import { useState } from 'react'
import { ErrorBoundary } from '@/components/admin/ErrorBoundary'
import { BarChart3 } from 'lucide-react'
import CustomReportBuilder from './CustomReportBuilder'
import PlCategoryTab from './PlCategoryTab'
import CustomerLTVTab from './CustomerLTVTab'
import SalesHeatmapTab from './SalesHeatmapTab'
import InventoryValuationTab from './InventoryValuationTab'
import MarginAnalysisTab from './MarginAnalysisTab'
import YoYComparisonTab from './YoYComparisonTab'
import ForecastingTab from './ForecastingTab'

const TABS = [
  { key: 'custom-report', label: 'Custom Report', icon: BarChart3 },
  { key: 'pl-category', label: 'P&L by Category', icon: BarChart3 },
  { key: 'customer-ltv', label: 'Customer LTV', icon: BarChart3 },
  { key: 'sales-heatmap', label: 'Sales Heatmap', icon: BarChart3 },
  { key: 'inventory-valuation', label: 'Inventory Valuation', icon: BarChart3 },
  { key: 'margin-analysis', label: 'Margin Analysis', icon: BarChart3 },
  { key: 'yoy-comparison', label: 'YoY Comparison', icon: BarChart3 },
  { key: 'forecasting', label: 'Forecasting', icon: BarChart3 },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('custom-report')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-navy">Reporting & Analytics</h1>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors capitalize whitespace-nowrap ${
              tab === t.key ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ErrorBoundary>
        {tab === 'custom-report' && <CustomReportBuilder />}
        {tab === 'pl-category' && <PlCategoryTab />}
        {tab === 'customer-ltv' && <CustomerLTVTab />}
        {tab === 'sales-heatmap' && <SalesHeatmapTab />}
        {tab === 'inventory-valuation' && <InventoryValuationTab />}
        {tab === 'margin-analysis' && <MarginAnalysisTab />}
        {tab === 'yoy-comparison' && <YoYComparisonTab />}
        {tab === 'forecasting' && <ForecastingTab />}
      </ErrorBoundary>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/
git commit -m "feat: create reports page shell with 8 tab layout"
```

---

### Task 3: Custom Report Builder API Route

**Files:**
- Create: `src/app/api/admin/reports/builder/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { metrics, dimension, filters, from, to } = await req.json()
    if (!Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({ error: 'At least one metric required' }, { status: 400 })
    }
    if (!dimension) {
      return NextResponse.json({ error: 'Dimension required' }, { status: 400 })
    }

    const start = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = to ? new Date(to + 'T23:59:59.999Z') : new Date()
    start.setHours(0, 0, 0, 0)

    const where: any = {
      createdAt: { gte: start, lte: end },
      status: { not: 'cancelled' },
    }
    if (filters?.status) where.status = filters.status
    if (filters?.paymentMethod) where.paymentMethod = filters.paymentMethod

    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: { select: { name: true, categoryId: true, price: true } } } },
      },
      orderBy: { createdAt: 'asc' },
    })

    const customers = metrics.includes('customers')
      ? await db.user.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: { id: true, createdAt: true },
        })
      : []

    let grouped: Record<string, any> = {}
    const getKey = (order: typeof orders[0]): string => {
      const d = new Date(order.createdAt)
      if (dimension === 'date') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dimension === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (dimension === 'product') return order.items[0]?.product?.name || 'Unknown'
      if (dimension === 'category') return order.items[0]?.product?.categoryId || 'Unknown'
      if (dimension === 'branch') return order.shiftId || 'Unknown'
      return 'All'
    }

    for (const order of orders) {
      const key = getKey(order)
      if (!grouped[key]) grouped[key] = {}
      if (metrics.includes('revenue')) grouped[key].revenue = (grouped[key].revenue || 0) + order.totalAmount
      if (metrics.includes('orders')) grouped[key].orders = (grouped[key].orders || 0) + 1
      if (metrics.includes('avg_order_value')) {
        const count = (grouped[key].orders || 0)
        grouped[key].avg_order_value = count > 0 ? (grouped[key].revenue || 0) / count : 0
      }
    }

    if (metrics.includes('customers')) {
      for (const c of customers) {
        const d = new Date(c.createdAt)
        const key = dimension === 'month'
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        if (!grouped[key]) grouped[key] = {}
        grouped[key].customers = (grouped[key].customers || 0) + 1
      }
    }

    const rows = Object.entries(grouped)
      .map(([key, vals]) => ({ [dimension]: key, ...vals }))
      .sort((a, b) => (a[dimension] || '').localeCompare(b[dimension] || ''))

    const summary: any = {}
    if (metrics.includes('revenue')) summary.totalRevenue = rows.reduce((s, r) => s + (r.revenue || 0), 0)
    if (metrics.includes('orders')) summary.totalOrders = rows.reduce((s, r) => s + (r.orders || 0), 0)
    if (metrics.includes('customers')) summary.totalCustomers = rows.reduce((s, r) => s + (r.customers || 0), 0)
    if (metrics.includes('avg_order_value')) {
      summary.avgOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0
    }

    return NextResponse.json({ rows, summary, dimension, metrics })
  } catch (e) {
    console.error('Report builder error:', e)
    return NextResponse.json({ error: 'Failed to build report' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/builder/route.ts
git commit -m "feat: add custom report builder API route"
```

---

### Task 4: Custom Report Builder Tab Component

**Files:**
- Create: `src/app/admin/reports/CustomReportBuilder.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Download, BarChart3, Loader2, Plus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
  { value: 'avg_order_value', label: 'Avg Order Value' },
]

const DIMENSIONS = [
  { value: 'date', label: 'Date (Daily)' },
  { value: 'month', label: 'Month' },
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'branch', label: 'Branch' },
]

export default function CustomReportBuilder() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'orders'])
  const [dimension, setDimension] = useState('date')
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  function toggleMetric(m: string) {
    setSelectedMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  async function generateReport() {
    if (selectedMetrics.length === 0) {
      toast.error('Select at least one metric')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: selectedMetrics, dimension, filters, from, to }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const chartData = data?.rows || []
  const colors = ['#b8860b', '#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Report Configuration
        </h2>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Metrics</label>
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.value}
                onClick={() => toggleMetric(m.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  selectedMetrics.includes(m.value)
                    ? 'bg-navy text-silver border-navy'
                    : 'bg-white text-muted-foreground border-border hover:text-navy'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Dimension</label>
            <select value={dimension} onChange={e => setDimension(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status Filter</label>
            <select value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Generate Report
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.summary.totalRevenue !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-navy">E£{data.summary.totalRevenue.toFixed(2)}</p>
                </div>
              )}
              {data.summary.totalOrders !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-navy">{data.summary.totalOrders}</p>
                </div>
              )}
              {data.summary.totalCustomers !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Customers</p>
                  <p className="text-xl font-bold text-navy">{data.summary.totalCustomers}</p>
                </div>
              )}
              {data.summary.avgOrderValue !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Order Value</p>
                  <p className="text-xl font-bold text-navy">E£{data.summary.avgOrderValue.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey={dimension} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  {selectedMetrics.map((m, i) => (
                    <Bar
                      key={m}
                      dataKey={m}
                      name={METRICS.find(x => x.value === m)?.label || m}
                      fill={colors[i % colors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-navy">Data Table</h3>
              <ExportButton
                filename={`custom-report-${dimension}`}
                columns={[
                  { header: dimension.charAt(0).toUpperCase() + dimension.slice(1), key: dimension },
                  ...selectedMetrics.map(m => ({ header: METRICS.find(x => x.value === m)?.label || m, key: m })),
                ]}
                data={chartData}
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                  <th className="p-3 font-medium capitalize">{dimension}</th>
                  {selectedMetrics.map(m => (
                    <th key={m} className="p-3 font-medium text-right">{METRICS.find(x => x.value === m)?.label || m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{row[dimension]}</td>
                    {selectedMetrics.map(m => (
                      <td key={m} className="p-3 text-right text-navy">
                        {typeof row[m] === 'number' ? (m === 'orders' || m === 'customers' ? row[m] : `E£${row[m].toFixed(2)}`) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                {chartData.length === 0 && (
                  <tr><td colSpan={selectedMetrics.length + 1} className="p-6 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/CustomReportBuilder.tsx
git commit -m "feat: add custom report builder tab component"
```

---

### Task 5: P&L by Category API Route

**Files:**
- Create: `src/app/api/admin/reports/pl-category/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'month'
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = parseInt(sp.get('month') || String(new Date().getMonth() + 1))

    const now = new Date()
    let start: Date, end: Date
    if (period === 'month') {
      start = new Date(year, month - 1, 1)
      end = new Date(year, month, 0, 23, 59, 59, 999)
    } else if (period === 'quarter') {
      const qStart = Math.floor((month - 1) / 3) * 3
      start = new Date(year, qStart, 1)
      end = new Date(year, qStart + 3, 0, 23, 59, 59, 999)
    } else {
      start = new Date(year, 0, 1)
      end = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    const categories = await db.category.findMany({
      include: {
        products: {
          include: {
            orderItems: {
              where: {
                order: {
                  createdAt: { gte: start, lte: end },
                  status: { not: 'cancelled' },
                },
              },
              include: { order: { select: { totalAmount: true } } },
            },
          },
        },
      },
    })

    const result = categories
      .map(cat => {
        const items = cat.products.flatMap(p => p.orderItems)
        const revenue = items.reduce((s, i) => s + (i.price * i.quantity), 0)
        const cost = items.reduce((s, i) => {
          const unitCost = i.product?.price || 0
          return s + (unitCost * i.quantity * 0.6)
        }, 0)
        const grossProfit = revenue - cost
        const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
        const orderCount = new Set(items.map(i => i.orderId)).size
        return {
          categoryId: cat.id,
          categoryName: cat.name,
          revenue: Math.round(revenue * 100) / 100,
          cost: Math.round(cost * 100) / 100,
          grossProfit: Math.round(grossProfit * 100) / 100,
          margin: Math.round(margin * 100) / 100,
          orderCount,
        }
      })
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    const totalRevenue = result.reduce((s, c) => s + c.revenue, 0)
    const totalCost = result.reduce((s, c) => s + c.cost, 0)
    const totalGrossProfit = result.reduce((s, c) => s + c.grossProfit, 0)
    const overallMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      categories: result,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
        overallMargin: Math.round(overallMargin * 100) / 100,
      },
      period,
    })
  } catch (e) {
    console.error('P&L category error:', e)
    return NextResponse.json({ error: 'Failed to load P&L by category' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/pl-category/route.ts
git commit -m "feat: add P&L by category API route"
```

---

### Task 6: P&L by Category Tab Component

**Files:**
- Create: `src/app/admin/reports/PlCategoryTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell,
} from 'recharts'

const COLORS = ['#b8860b', '#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function PlCategoryTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/pl-category?period=${period}&year=${year}&month=${month}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load P&L'); setLoading(false) })
  }, [period, year, month])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  const chartData = data.categories.map((c: any) => ({
    name: c.categoryName,
    Revenue: c.revenue,
    Cost: c.cost,
    Profit: c.grossProfit,
  }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        {['month', 'quarter', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || 2024)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm w-20" />
        {period !== 'year' && (
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-lg text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        )}
        <ExportButton
          filename={`pl-category-${period}-${year}`}
          columns={[
            { header: 'Category', key: 'categoryName' },
            { header: 'Revenue', key: 'revenue' },
            { header: 'Cost', key: 'cost' },
            { header: 'Gross Profit', key: 'grossProfit' },
            { header: 'Margin %', key: 'margin' },
            { header: 'Orders', key: 'orderCount' },
          ]}
          data={data.categories}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Cost</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gross Profit</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.totalGrossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall Margin</p>
          <p className={`text-xl font-bold ${data.summary.overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.summary.overallMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Revenue vs Cost by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [formatCurrency(v), undefined]}
            />
            <Legend />
            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#b8860b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Cost</th>
              <th className="p-3 font-medium text-right">Profit</th>
              <th className="p-3 font-medium text-right">Margin</th>
              <th className="p-3 font-medium text-right">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c: any) => (
              <tr key={c.categoryId} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{c.categoryName}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(c.revenue)}</td>
                <td className="p-3 text-right text-orange-600">{formatCurrency(c.cost)}</td>
                <td className="p-3 text-right text-navy font-medium">{formatCurrency(c.grossProfit)}</td>
                <td className={`p-3 text-right font-medium ${c.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.margin.toFixed(1)}%
                </td>
                <td className="p-3 text-right text-muted-foreground">{c.orderCount}</td>
              </tr>
            ))}
            {data.categories.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data</td></tr>}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold border-t-2 border-border">
              <td className="p-3 text-navy">Total</td>
              <td className="p-3 text-right text-green-600">{formatCurrency(data.summary.totalRevenue)}</td>
              <td className="p-3 text-right text-orange-600">{formatCurrency(data.summary.totalCost)}</td>
              <td className="p-3 text-right text-navy">{formatCurrency(data.summary.totalGrossProfit)}</td>
              <td className="p-3 text-right text-green-600">{data.summary.overallMargin.toFixed(1)}%</td>
              <td className="p-3 text-right text-muted-foreground" />
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/PlCategoryTab.tsx
git commit -m "feat: add P&L by category tab component"
```

---

### Task 7: Customer LTV API Route

**Files:**
- Create: `src/app/api/admin/reports/customer-ltv/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const cohortMonths = parseInt(req.nextUrl.searchParams.get('months') || '12')

    const users = await db.user.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const orders = await db.order.findMany({
      where: { userId: { not: null }, status: { not: 'cancelled' } },
      select: { userId: true, totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const orderMap = new Map<string, { total: number; count: number; firstDate: Date }>()
    for (const o of orders) {
      if (!o.userId) continue
      const existing = orderMap.get(o.userId)
      if (existing) {
        existing.total += o.totalAmount
        existing.count++
        if (o.createdAt < existing.firstDate) existing.firstDate = o.createdAt
      } else {
        orderMap.set(o.userId, { total: o.totalAmount, count: 1, firstDate: o.createdAt })
      }
    }

    const cohorts: Record<string, { users: number; totalRevenue: number; totalOrders: number }> = {}
    for (const u of users) {
      const cohort = `${u.createdAt.getFullYear()}-${String(u.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!cohorts[cohort]) cohorts[cohort] = { users: 0, totalRevenue: 0, totalOrders: 0 }
      cohorts[cohort].users++
      const orderData = orderMap.get(u.id)
      if (orderData) {
        cohorts[cohort].totalRevenue += orderData.total
        cohorts[cohort].totalOrders += orderData.count
      }
    }

    const cohortData = Object.entries(cohorts)
      .map(([cohort, data]) => ({
        cohort,
        users: data.users,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalOrders: data.totalOrders,
        ltv: data.users > 0 ? Math.round((data.totalRevenue / data.users) * 100) / 100 : 0,
        avgOrdersPerUser: data.users > 0 ? Math.round((data.totalOrders / data.users) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort))
      .slice(-cohortMonths)

    const overall = {
      totalUsers: users.length,
      totalRevenue: cohortData.reduce((s, c) => s + c.totalRevenue, 0),
      totalOrders: cohortData.reduce((s, c) => s + c.totalOrders, 0),
      avgLtv: cohortData.length > 0
        ? Math.round((cohortData.reduce((s, c) => s + c.ltv, 0) / cohortData.length) * 100) / 100
        : 0,
    }

    const userAov = orderMap.size > 0
      ? Math.round(([...orderMap.values()].reduce((s, o) => s + o.total, 0) / orderMap.size) * 100) / 100
      : 0

    return NextResponse.json({ cohortData, overall, userAov })
  } catch (e) {
    console.error('Customer LTV error:', e)
    return NextResponse.json({ error: 'Failed to load customer LTV' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/customer-ltv/route.ts
git commit -m "feat: add customer LTV API route"
```

---

### Task 8: Customer LTV Tab Component

**Files:**
- Create: `src/app/admin/reports/CustomerLTVTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from 'recharts'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function CustomerLTVTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [chartMode, setChartMode] = useState<'ltv' | 'revenue'>('ltv')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/customer-ltv?months=${months}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load LTV'); setLoading(false) })
  }, [months])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  const chartData = data.cohortData.map((c: any) => ({
    cohort: c.cohort,
    LTV: c.ltv,
    Revenue: c.totalRevenue,
    Users: c.users,
    'Avg Orders': c.avgOrdersPerUser,
  }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[6, 12, 24].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${months === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m} Months
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setChartMode('ltv')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'ltv' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            LTV
          </button>
          <button onClick={() => setChartMode('revenue')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'revenue' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Revenue
          </button>
        </div>
        <ExportButton
          filename="customer-ltv"
          columns={[
            { header: 'Cohort', key: 'cohort' },
            { header: 'Users', key: 'users' },
            { header: 'Total Revenue', key: 'totalRevenue' },
            { header: 'Total Orders', key: 'totalOrders' },
            { header: 'LTV', key: 'ltv' },
            { header: 'Avg Orders/User', key: 'avgOrdersPerUser' },
          ]}
          data={data.cohortData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Customers</p>
          <p className="text-xl font-bold text-navy">{data.overall.totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg LTV</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.avgLtv)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg AOV (w/ orders)</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.userAov)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartMode === 'ltv' ? 'Customer LTV by Cohort' : 'Revenue by Cohort'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [chartMode === 'ltv' ? formatCurrency(v) : formatCurrency(v), undefined]}
            />
            <Area
              type="monotone"
              dataKey={chartMode === 'ltv' ? 'LTV' : 'Revenue'}
              stroke="#b8860b"
              fill="#b8860b"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Cohort</th>
              <th className="p-3 font-medium text-right">Users</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Orders</th>
              <th className="p-3 font-medium text-right">LTV</th>
              <th className="p-3 font-medium text-right">Avg Orders/User</th>
            </tr>
          </thead>
          <tbody>
            {data.cohortData.map((c: any) => (
              <tr key={c.cohort} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{c.cohort}</td>
                <td className="p-3 text-right text-muted-foreground">{c.users}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(c.totalRevenue)}</td>
                <td className="p-3 text-right text-muted-foreground">{c.totalOrders}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(c.ltv)}</td>
                <td className="p-3 text-right text-muted-foreground">{c.avgOrdersPerUser}</td>
              </tr>
            ))}
            {data.cohortData.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/CustomerLTVTab.tsx
git commit -m "feat: add customer LTV tab component"
```

---

### Task 9: Sales Heatmap API Route

**Files:**
- Create: `src/app/api/admin/reports/sales-heatmap/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const fromParam = sp.get('from') || ''
    const toParam = sp.get('to') || ''

    const end = toParam ? new Date(toParam + 'T23:59:59.999Z') : new Date()
    const start = fromParam
      ? new Date(fromParam)
      : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
    start.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: 'cancelled' },
      },
      select: { totalAmount: true, createdAt: true },
    })

    const heatmap: Record<string, Record<string, { revenue: number; count: number }>> = {}
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    for (const day of days) {
      heatmap[day] = {}
      for (let h = 0; h < 24; h++) {
        heatmap[day][h] = { revenue: 0, count: 0 }
      }
    }

    for (const o of orders) {
      const d = new Date(o.createdAt)
      const day = days[d.getDay()]
      const hour = d.getHours()
      if (heatmap[day]?.[hour] !== undefined) {
        heatmap[day][hour].revenue += o.totalAmount
        heatmap[day][hour].count++
      }
    }

    const grid = days.map(day => ({
      day,
      hours: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        revenue: Math.round(heatmap[day][i].revenue * 100) / 100,
        count: heatmap[day][i].count,
      })),
    }))

    const totals = {
      totalRevenue: orders.reduce((s, o) => s + o.totalAmount, 0),
      totalOrders: orders.length,
    }

    const maxRevenue = Math.max(
      ...days.flatMap(d => Object.values(heatmap[d]).map(v => v.revenue)),
      1
    )

    const busiestHour = days.reduce<{ day: string; hour: number; count: number }>(
      (best, day) => {
        for (let h = 0; h < 24; h++) {
          if (heatmap[day][h].count > best.count) {
            best = { day, hour: h, count: heatmap[day][h].count }
          }
        }
        return best
      },
      { day: '', hour: 0, count: 0 }
    )

    return NextResponse.json({
      grid,
      days,
      maxRevenue,
      totals: { totalRevenue: Math.round(totals.totalRevenue * 100) / 100, totalOrders: totals.totalOrders },
      busiestHour,
    })
  } catch (e) {
    console.error('Sales heatmap error:', e)
    return NextResponse.json({ error: 'Failed to load heatmap' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/sales-heatmap/route.ts
git commit -m "feat: add sales heatmap API route"
```

---

### Task 10: Sales Heatmap Tab Component

**Files:**
- Create: `src/app/admin/reports/SalesHeatmapTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import { Clock, Sun as SunIcon, Moon } from 'lucide-react'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

function getHeatColor(value: number, max: number): string {
  if (max === 0) return 'bg-gray-50'
  const intensity = value / max
  if (intensity === 0) return 'bg-gray-50'
  if (intensity < 0.2) return 'bg-amber-50'
  if (intensity < 0.4) return 'bg-amber-100'
  if (intensity < 0.6) return 'bg-amber-200'
  if (intensity < 0.8) return 'bg-amber-300'
  return 'bg-amber-400'
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a'
  if (i < 12) return `${i}a`
  if (i === 12) return '12p'
  return `${i - 12}p`
})

export default function SalesHeatmapTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<'revenue' | 'count'>('revenue')

  function fetchData() {
    setLoading(true)
    fetch(`/api/admin/reports/sales-heatmap?from=${from}&to=${to}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load heatmap'); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>

  const maxVal = data ? (mode === 'revenue' ? data.maxRevenue : Math.max(...data.days.flatMap((d: any) => d.hours.map((h: any) => h.count)), 1)) : 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        <span className="text-xs text-muted-foreground">to</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        <button onClick={fetchData}
          className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          Load
        </button>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setMode('revenue')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'revenue' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Revenue
          </button>
          <button onClick={() => setMode('count')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'count' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Orders
          </button>
        </div>
        <ExportButton
          filename="sales-heatmap"
          columns={
            data ? [{ header: 'Day/Hour', key: 'day' }, ...Array.from({ length: 24 }, (_, i) => ({ header: HOUR_LABELS[i], key: String(i) }))] : []
          }
          data={data ? data.days.map((d: any) => {
            const row: any = { day: d.day }
            d.hours.forEach((h: any) => { row[String(h.hour)] = mode === 'revenue' ? h.revenue : h.count })
            return row
          }) : []}
        />
      </div>

      {data && data.busiestHour && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue (period)</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(data.totals.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Orders</p>
            <p className="text-xl font-bold text-navy">{data.totals.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Busiest Day</p>
            <p className="text-xl font-bold text-navy">{data.busiestHour.day}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Busiest Hour</p>
            <p className="text-xl font-bold text-navy">{HOUR_LABELS[data.busiestHour.hour]}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Sales {mode === 'revenue' ? 'Revenue' : 'Orders'} Heatmap (Weekday × Hour)
        </h3>
        {data && (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left text-muted-foreground font-medium w-12" />
                {HOUR_LABELS.map((label, i) => (
                  <th key={i} className={`p-1 text-center font-medium w-8 ${i >= 6 && i < 18 ? 'text-amber-600' : 'text-indigo-400'}`}>
                    {i === 6 ? <SunIcon className="h-3 w-3 inline" /> : i === 18 ? <Moon className="h-3 w-3 inline" /> : null}
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.days.map((d: any) => (
                <tr key={d.day}>
                  <td className="p-1 font-medium text-navy text-left">{d.day}</td>
                  {d.hours.map((h: any) => {
                    const val = mode === 'revenue' ? h.revenue : h.count
                    return (
                      <td
                        key={h.hour}
                        className={`p-1 text-center rounded cursor-default ${getHeatColor(val, maxVal)}`}
                        title={`${d.day} ${HOUR_LABELS[h.hour]}: ${mode === 'revenue' ? formatCurrency(h.revenue) : `${h.count} orders`}`}
                      >
                        <span className="text-[10px] font-medium text-gray-700">
                          {mode === 'revenue' ? (h.revenue > 0 ? 'E£' + (h.revenue / 1000).toFixed(0) + 'k' : '') : (h.count > 0 ? h.count : '')}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>Low</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-6 rounded bg-gray-50 border border-border" />
            <div className="h-3 w-6 rounded bg-amber-50 border border-amber-100" />
            <div className="h-3 w-6 rounded bg-amber-100 border border-amber-200" />
            <div className="h-3 w-6 rounded bg-amber-200 border border-amber-300" />
            <div className="h-3 w-6 rounded bg-amber-300 border border-amber-400" />
            <div className="h-3 w-6 rounded bg-amber-400 border border-amber-500" />
          </div>
          <span>High</span>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/SalesHeatmapTab.tsx
git commit -m "feat: add sales heatmap tab component"
```

---

### Task 11: Inventory Valuation API Route

**Files:**
- Create: `src/app/api/admin/reports/inventory-valuation/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const slowDays = parseInt(sp.get('slowDays') || '90')

    const products = await db.product.findMany({
      where: { isActive: true },
      include: {
        orderItems: {
          where: { order: { status: { not: 'cancelled' } } },
          select: { quantity: true, order: { select: { createdAt: true } } },
          orderBy: { order: { createdAt: 'desc' } },
          take: 1,
        },
        stocks: { include: { branch: { select: { name: true } } } },
      },
    })

    const slowThreshold = new Date(Date.now() - slowDays * 24 * 60 * 60 * 1000)
    const categories = await db.category.findMany({ select: { id: true, name: true } })
    const catMap = new Map(categories.map(c => [c.id, c.name]))

    const items = products.map(p => {
      const lastSold = p.orderItems[0]?.order?.createdAt || null
      const daysSinceLastSale = lastSold ? Math.floor((Date.now() - lastSold.getTime()) / (24 * 60 * 60 * 1000)) : null
      const totalStock = p.stocks.reduce((s, st) => s + st.quantity, 0)
      const costPrice = p.price * 0.6
      const retailValue = totalStock * p.price
      const costValue = totalStock * costPrice
      const isSlowMoving = daysSinceLastSale !== null && daysSinceLastSale >= slowDays

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: catMap.get(p.categoryId) || 'Unknown',
        totalStock,
        price: p.price,
        costPrice: Math.round(costPrice * 100) / 100,
        retailValue: Math.round(retailValue * 100) / 100,
        costValue: Math.round(costValue * 100) / 100,
        potentialProfit: Math.round((retailValue - costValue) * 100) / 100,
        lastSoldDate: lastSold ? lastSold.toISOString().slice(0, 10) : null,
        daysSinceLastSale,
        isSlowMoving,
        branchDistribution: p.stocks.map(s => ({ branch: s.branch.name, qty: s.quantity })),
      }
    })

    const slowMoving = items.filter(i => i.isSlowMoving).sort((a, b) => (b.daysSinceLastSale || 0) - (a.daysSinceLastSale || 0))
    const activeItems = items.filter(i => !i.isSlowMoving)

    const totalRetailValue = items.reduce((s, i) => s + i.retailValue, 0)
    const totalCostValue = items.reduce((s, i) => s + i.costValue, 0)
    const totalPotentialProfit = items.reduce((s, i) => s + i.potentialProfit, 0)
    const totalStock = items.reduce((s, i) => s + i.totalStock, 0)

    return NextResponse.json({
      items: items.sort((a, b) => b.retailValue - a.retailValue),
      slowMoving,
      activeItems,
      summary: {
        totalProducts: items.length,
        totalStock,
        totalRetailValue: Math.round(totalRetailValue * 100) / 100,
        totalCostValue: Math.round(totalCostValue * 100) / 100,
        totalPotentialProfit: Math.round(totalPotentialProfit * 100) / 100,
        slowMovingCount: slowMoving.length,
        slowMovingValue: Math.round(slowMoving.reduce((s, i) => s + i.costValue, 0) * 100) / 100,
      },
      slowDays,
    })
  } catch (e) {
    console.error('Inventory valuation error:', e)
    return NextResponse.json({ error: 'Failed to load inventory valuation' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/inventory-valuation/route.ts
git commit -m "feat: add inventory valuation API route"
```

---

### Task 12: Inventory Valuation Tab Component

**Files:**
- Create: `src/app/admin/reports/InventoryValuationTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { Warehouse, AlertTriangle, DollarSign, Package } from 'lucide-react'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

export default function InventoryValuationTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [slowDays, setSlowDays] = useState(90)
  const [view, setView] = useState<'all' | 'slow'>('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/inventory-valuation?slowDays=${slowDays}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load inventory'); setLoading(false) })
  }, [slowDays])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  const items = view === 'slow' ? data.slowMoving : data.items
  const pieData = [
    { name: 'Retail Value', value: data.summary.totalRetailValue },
    { name: 'Cost Value', value: data.summary.totalCostValue },
    { name: 'Potential Profit', value: data.summary.totalPotentialProfit },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('all')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === 'all' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            All Items
          </button>
          <button onClick={() => setView('slow')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === 'slow' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Slow Moving ({data.summary.slowMovingCount})
          </button>
        </div>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Slow after
          <select value={slowDays} onChange={e => setSlowDays(parseInt(e.target.value))}
            className="px-2 py-1 border border-border rounded text-xs">
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
          </select>
        </label>
        <ExportButton
          filename={`inventory-valuation-${view}`}
          columns={[
            { header: 'Product', key: 'productName' },
            { header: 'SKU', key: 'sku' },
            { header: 'Category', key: 'category' },
            { header: 'Stock', key: 'totalStock' },
            { header: 'Retail Value', key: 'retailValue' },
            { header: 'Cost Value', key: 'costValue' },
            { header: 'Potential Profit', key: 'potentialProfit' },
            { header: 'Last Sold', key: 'lastSoldDate' },
            { header: 'Days Since Sale', key: 'daysSinceLastSale' },
          ]}
          data={items}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-navy" /><p className="text-xs text-muted-foreground uppercase tracking-wide">Total Products</p></div>
          <p className="text-xl font-bold text-navy">{data.summary.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Warehouse className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">Total Stock</p></div>
          <p className="text-xl font-bold text-blue-600">{data.summary.totalStock}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">Retail Value</p></div>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalRetailValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-orange-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">At Cost</p></div>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary.totalCostValue)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Inventory Value Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value }) => `${name}: ${formatCurrency(value)}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Top 10 by Value</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.items.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 9 }} width={120} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="retailValue" fill="#10b981" radius={[0, 4, 4, 0]} name="Retail Value" />
              <Bar dataKey="costValue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Cost Value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">{view === 'slow' ? 'Slow-Moving Items' : 'All Inventory'}</h3>
          <span className="text-xs text-muted-foreground">{items.length} items</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">SKU</th>
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">Stock</th>
              <th className="p-3 font-medium text-right">Retail Value</th>
              <th className="p-3 font-medium text-right">Cost Value</th>
              <th className="p-3 font-medium text-right">Potential Profit</th>
              <th className="p-3 font-medium text-right">Last Sold</th>
              <th className="p-3 font-medium text-right">Days</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 100).map((i: any) => (
              <tr key={i.productId} className={`border-b border-border/50 hover:bg-gray-50 ${i.isSlowMoving ? 'bg-red-50/30' : ''}`}>
                <td className="p-3 font-medium text-navy max-w-[200px] truncate">{i.productName}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground">{i.sku}</td>
                <td className="p-3 text-muted-foreground">{i.category}</td>
                <td className="p-3 text-right font-medium text-navy">{i.totalStock}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(i.retailValue)}</td>
                <td className="p-3 text-right text-orange-600">{formatCurrency(i.costValue)}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(i.potentialProfit)}</td>
                <td className="p-3 text-right text-muted-foreground">{i.lastSoldDate || '-'}</td>
                <td className={`p-3 text-right font-medium ${i.isSlowMoving ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {i.daysSinceLastSale != null ? `${i.daysSinceLastSale}d` : '-'}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No items found</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/InventoryValuationTab.tsx
git commit -m "feat: add inventory valuation tab component"
```

---

### Task 13: Margin Analysis API Route

**Files:**
- Create: `src/app/api/admin/reports/margin-analysis/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const months = parseInt(sp.get('months') || '12')
    const categoryId = sp.get('categoryId') || ''

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    start.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: start },
        status: { not: 'cancelled' },
      },
      include: {
        items: {
          include: { product: { select: { categoryId: true, price: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const categories = await db.category.findMany({ select: { id: true, name: true } })
    const catMap = new Map(categories.map(c => [c.id, c.name]))

    const monthlyData: Record<string, { revenue: number; cost: number; orders: number }> = {}
    const categoryData: Record<string, { revenue: number; cost: number; orders: number }> = {}

    for (const order of orders) {
      const d = new Date(order.createdAt)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { revenue: 0, cost: 0, orders: 0 }

      for (const item of order.items) {
        const revenue = item.price * item.quantity
        const unitCost = item.product?.price || 0
        const cost = unitCost * item.quantity * 0.6
        monthlyData[monthKey].revenue += revenue
        monthlyData[monthKey].cost += cost
        monthlyData[monthKey].orders++

        const catId = item.product?.categoryId || 'unknown'
        if (!categoryId || catId === categoryId) {
          if (!categoryData[catId]) categoryData[catId] = { revenue: 0, cost: 0, orders: 0 }
          categoryData[catId].revenue += revenue
          categoryData[catId].cost += cost
          categoryData[catId].orders++
        }
      }
    }

    const trend = Object.entries(monthlyData)
      .map(([month, d]) => ({
        month,
        revenue: Math.round(d.revenue * 100) / 100,
        cost: Math.round(d.cost * 100) / 100,
        grossProfit: Math.round((d.revenue - d.cost) * 100) / 100,
        margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    const catBreakdown = Object.entries(categoryData)
      .map(([catId, d]) => ({
        categoryId: catId,
        categoryName: catMap.get(catId) || 'Unknown',
        revenue: Math.round(d.revenue * 100) / 100,
        cost: Math.round(d.cost * 100) / 100,
        grossProfit: Math.round((d.revenue - d.cost) * 100) / 100,
        margin: d.revenue > 0 ? Math.round(((d.revenue - d.cost) / d.revenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)

    const totalRevenue = trend.reduce((s, t) => s + t.revenue, 0)
    const totalCost = trend.reduce((s, t) => s + t.cost, 0)
    const overallMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : 0

    return NextResponse.json({
      trend,
      categoryBreakdown: catBreakdown,
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalGrossProfit: Math.round((totalRevenue - totalCost) * 100) / 100,
        overallMargin,
      },
    })
  } catch (e) {
    console.error('Margin analysis error:', e)
    return NextResponse.json({ error: 'Failed to load margin analysis' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/margin-analysis/route.ts
git commit -m "feat: add margin analysis API route"
```

---

### Task 14: Margin Analysis Tab Component

**Files:**
- Create: `src/app/admin/reports/MarginAnalysisTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from 'recharts'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function MarginAnalysisTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [categoryId, setCategoryId] = useState('')
  const [chartView, setChartView] = useState<'trend' | 'category'>('trend')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/margin-analysis?months=${months}${categoryId ? `&categoryId=${categoryId}` : ''}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load margins'); setLoading(false) })
  }, [months, categoryId])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[3, 6, 12, 24].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${months === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo
            </button>
          ))}
        </div>
        {data.categories && (
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">All Categories</option>
            {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setChartView('trend')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartView === 'trend' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Trend
          </button>
          <button onClick={() => setChartView('category')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartView === 'category' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            By Category
          </button>
        </div>
        <ExportButton
          filename="margin-analysis"
          columns={
            chartView === 'trend'
              ? [{ header: 'Month', key: 'month' }, { header: 'Revenue', key: 'revenue' }, { header: 'Cost', key: 'cost' }, { header: 'Gross Profit', key: 'grossProfit' }, { header: 'Margin %', key: 'margin' }]
              : [{ header: 'Category', key: 'categoryName' }, { header: 'Revenue', key: 'revenue' }, { header: 'Cost', key: 'cost' }, { header: 'Gross Profit', key: 'grossProfit' }, { header: 'Margin %', key: 'margin' }]
          }
          data={chartView === 'trend' ? data.trend : data.categoryBreakdown}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Cost</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gross Profit</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.totalGrossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall Margin</p>
          <p className={`text-xl font-bold ${data.summary.overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.summary.overallMargin}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartView === 'trend' ? 'Margin Trend Over Time' : 'Margin by Category'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartView === 'trend' ? data.trend : data.categoryBreakdown}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chartView === 'trend' ? 'month' : 'categoryName'} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Cost" />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#b8860b" strokeWidth={2} dot={{ r: 3 }} name="Margin %" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{chartView === 'trend' ? 'Month' : 'Category'}</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Cost</th>
              <th className="p-3 font-medium text-right">Gross Profit</th>
              <th className="p-3 font-medium text-right">Margin %</th>
            </tr>
          </thead>
          <tbody>
            {(chartView === 'trend' ? data.trend : data.categoryBreakdown).map((r: any) => (
              <tr key={r.month || r.categoryId} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{r.month || r.categoryName}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(r.revenue)}</td>
                <td className="p-3 text-right text-orange-600">{formatCurrency(r.cost)}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(r.grossProfit)}</td>
                <td className={`p-3 text-right font-medium ${r.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.margin}%
                </td>
              </tr>
            ))}
            {(chartView === 'trend' ? data.trend : data.categoryBreakdown).length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/MarginAnalysisTab.tsx
git commit -m "feat: add margin analysis tab component"
```

---

### Task 15: YoY Comparison API Route

**Files:**
- Create: `src/app/api/admin/reports/yoy-comparison/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const years = parseInt(sp.get('years') || '3')
    const metric = sp.get('metric') || 'revenue'

    const currentYear = new Date().getFullYear()
    const result: any[] = []

    for (let y = currentYear - years + 1; y <= currentYear; y++) {
      const start = new Date(y, 0, 1)
      const end = new Date(y, 11, 31, 23, 59, 59, 999)

      if (metric === 'revenue' || metric === 'all') {
        const revenueAgg = await db.order.aggregate({
          where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
          _sum: { totalAmount: true },
        })

        const ordersByMonth: Record<string, number> = {}
        const monthlyOrders = await db.order.findMany({
          where: { createdAt: { gte: start, lte: end }, status: { not: 'cancelled' } },
          select: { totalAmount: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })

        for (const o of monthlyOrders) {
          const m = `${y}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
          ordersByMonth[m] = (ordersByMonth[m] || 0) + o.totalAmount
        }

        result.push({
          year: y,
          revenue: Math.round((revenueAgg._sum.totalAmount || 0) * 100) / 100,
          orderCount: monthlyOrders.length,
          monthlyRevenue: Object.entries(ordersByMonth)
            .map(([month, rev]) => ({ month, revenue: Math.round(rev * 100) / 100 }))
            .sort((a, b) => a.month.localeCompare(b.month)),
        })
      }

      if (metric === 'customers' || metric === 'all') {
        const customerCount = await db.user.count({
          where: { createdAt: { gte: start, lte: end } },
        })
        if (!result.find(r => r.year === y)) {
          result.push({ year: y, customers: customerCount })
        } else {
          const existing = result.find(r => r.year === y)!
          existing.customers = customerCount
        }
      }
    }

    const comparisons = result.map((r, i) => {
      const prev = i > 0 ? result[i - 1] : null
      const revChange = prev && prev.revenue
        ? Math.round(((r.revenue - prev.revenue) / prev.revenue) * 1000) / 10
        : null
      const orderChange = prev && prev.orderCount
        ? Math.round(((r.orderCount - prev.orderCount) / prev.orderCount) * 1000) / 10
        : null
      const custChange = prev && prev.customers
        ? Math.round(((r.customers - prev.customers) / prev.customers) * 1000) / 10
        : null
      return { ...r, revChange, orderChange, custChange }
    })

    return NextResponse.json({
      years: comparisons,
      metric,
    })
  } catch (e) {
    console.error('YoY comparison error:', e)
    return NextResponse.json({ error: 'Failed to load YoY comparison' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/yoy-comparison/route.ts
git commit -m "feat: add YoY comparison API route"
```

---

### Task 16: YoY Comparison Tab Component

**Files:**
- Create: `src/app/admin/reports/YoYComparisonTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  LineChart, Line, AreaChart, Area,
} from 'recharts'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function YoYComparisonTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [years, setYears] = useState(3)
  const [metric, setMetric] = useState('all')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/yoy-comparison?years=${years}&metric=${metric}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false); if (d.years?.length) setSelectedYear(d.years[d.years.length - 1].year) })
      .catch(() => { toast.error('Failed to load YoY'); setLoading(false) })
  }, [years, metric])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data || !data.years) return <div className="text-muted-foreground text-sm">No data</div>

  const yearlyChartData = data.years.map((y: any) => ({
    year: String(y.year),
    Revenue: y.revenue || 0,
    Orders: y.orderCount || 0,
    Customers: y.customers || 0,
  }))

  const selectedYearData = data.years.find((y: any) => y.year === selectedYear)
  const monthlyChartData = selectedYearData?.monthlyRevenue || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[2, 3, 5].map(y => (
            <button key={y} onClick={() => setYears(y)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${years === y ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {y} Years
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'revenue', label: 'Revenue' },
            { value: 'customers', label: 'Customers' },
          ].map(m => (
            <button key={m.value} onClick={() => setMetric(m.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${metric === m.value ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <ExportButton
          filename="yoy-comparison"
          columns={[
            { header: 'Year', key: 'year' },
            { header: 'Revenue', key: 'revenue' },
            { header: 'Orders', key: 'orderCount' },
            { header: 'YoY Rev %', key: 'revChange' },
            { header: 'YoY Orders %', key: 'orderChange' },
          ]}
          data={data.years}
        />
      </div>

      {data.years.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.years.slice(-2).map((y: any, i: number) => (
            <React.Fragment key={y.year}>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{y.year} Revenue</p>
                <p className="text-xl font-bold text-navy">{formatCurrency(y.revenue)}</p>
                {y.revChange != null && i > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-0.5 ${y.revChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {y.revChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {y.revChange >= 0 ? '+' : ''}{y.revChange}% YoY
                  </p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{y.year} Orders</p>
                <p className="text-xl font-bold text-navy">{y.orderCount}</p>
                {y.orderChange != null && i > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-0.5 ${y.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {y.orderChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {y.orderChange >= 0 ? '+' : ''}{y.orderChange}% YoY
                  </p>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Yearly Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              {(metric === 'all' || metric === 'customers') && (
                <Bar dataKey="Customers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy">Monthly Breakdown</h3>
            <select value={selectedYear || ''} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-2 py-1 border border-border rounded text-xs">
              {data.years.map((y: any) => <option key={y.year} value={y.year}>{y.year}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="revenue" stroke="#b8860b" fill="#b8860b" fillOpacity={0.2} strokeWidth={2} dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Year</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Orders</th>
              <th className="p-3 font-medium text-right">Customers</th>
              <th className="p-3 font-medium text-right">Rev Change</th>
              <th className="p-3 font-medium text-right">Order Change</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y: any) => (
              <tr key={y.year} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-bold text-navy">{y.year}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(y.revenue)}</td>
                <td className="p-3 text-right text-navy">{y.orderCount}</td>
                <td className="p-3 text-right text-amber-600">{y.customers || '-'}</td>
                <td className={`p-3 text-right font-medium ${y.revChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {y.revChange != null ? `${y.revChange >= 0 ? '+' : ''}${y.revChange}%` : '-'}
                </td>
                <td className={`p-3 text-right font-medium ${y.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {y.orderChange != null ? `${y.orderChange >= 0 ? '+' : ''}${y.orderChange}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/YoYComparisonTab.tsx
git commit -m "feat: add YoY comparison tab component"
```

---

### Task 17: Forecasting API Route

**Files:**
- Create: `src/app/api/admin/reports/forecasting/route.ts`

- [ ] **Create the API route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number; r2: number } {
  const n = data.length
  if (n < 2) return { slope: 0, intercept: 0, r2: 0 }
  const sumX = data.reduce((s, d) => s + d.x, 0)
  const sumY = data.reduce((s, d) => s + d.y, 0)
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0)
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0)
  const sumY2 = data.reduce((s, d) => s + d.y * d.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  const ssRes = data.reduce((s, d) => {
    const pred = slope * d.x + intercept
    return s + (d.y - pred) ** 2
  }, 0)
  const ssTot = data.reduce((s, d) => s + (d.y - sumY / n) ** 2, 0)
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0

  return { slope, intercept, r2: Math.round(r2 * 1000) / 1000 }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const forecastMonths = parseInt(sp.get('forecastMonths') || '6')
    const historyMonths = parseInt(sp.get('historyMonths') || '24')

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - historyMonths, 1)
    start.setHours(0, 0, 0, 0)

    const orders = await db.order.findMany({
      where: { createdAt: { gte: start }, status: { not: 'cancelled' } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const monthlyMap: Record<string, number> = {}
    for (const o of orders) {
      const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, '0')}`
      monthlyMap[key] = (monthlyMap[key] || 0) + o.totalAmount
    }

    const history: { month: string; revenue: number; x: number; y: number }[] = []
    let x = 0
    for (let i = historyMonths; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const revenue = monthlyMap[key] || 0
      history.push({ month: key, revenue: Math.round(revenue * 100) / 100, x, y: revenue })
      x++
    }

    const regression = linearRegression(history.filter(h => h.y > 0).map(h => ({ x: h.x, y: h.y })))

    const forecast: { month: string; revenue: number }[] = []
    const lastX = history[history.length - 1]?.x || 0
    for (let i = 1; i <= forecastMonths; i++) {
      const fx = lastX + i
      const predicted = Math.max(0, regression.slope * fx + regression.intercept)
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      forecast.push({ month: key, revenue: Math.round(predicted * 100) / 100 })
    }

    const totalForecastRevenue = forecast.reduce((s, f) => s + f.revenue, 0)
    const totalHistoryRevenue = history.reduce((s, h) => s + h.revenue, 0)

    const avgHistoryRevenue = history.length > 0
      ? Math.round((totalHistoryRevenue / history.length) * 100) / 100
      : 0
    const avgForecastRevenue = forecastMonths > 0
      ? Math.round((totalForecastRevenue / forecastMonths) * 100) / 100
      : 0

    return NextResponse.json({
      history,
      forecast,
      regression: {
        slope: Math.round(regression.slope * 100) / 100,
        intercept: Math.round(regression.intercept * 100) / 100,
        r2: regression.r2,
        trend: regression.slope >= 0 ? 'up' : 'down',
      },
      summary: {
        totalHistoryRevenue: Math.round(totalHistoryRevenue * 100) / 100,
        totalForecastRevenue: Math.round(totalForecastRevenue * 100) / 100,
        avgHistoryRevenue,
        avgForecastRevenue,
        forecastMonths,
        historyMonths,
      },
    })
  } catch (e) {
    console.error('Forecasting error:', e)
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 })
  }
}, 'reports')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/reports/forecasting/route.ts
git commit -m "feat: add forecasting API route"
```

---

### Task 18: Forecasting Tab Component

**Files:**
- Create: `src/app/admin/reports/ForecastingTab.tsx`

- [ ] **Create the component**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ComposedChart, Line, Bar,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function ForecastingTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forecastMonths, setForecastMonths] = useState(6)
  const [historyMonths, setHistoryMonths] = useState(24)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/forecasting?forecastMonths=${forecastMonths}&historyMonths=${historyMonths}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load forecast'); setLoading(false) })
  }, [forecastMonths, historyMonths])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  const chartData = [
    ...data.history.map((h: any) => ({ ...h, type: 'history' })),
    ...data.forecast.map((f: any) => ({ ...f, type: 'forecast' })),
  ]

  const TrendIcon = data.regression.trend === 'up' ? TrendingUp : data.regression.trend === 'down' ? TrendingDown : Minus
  const trendColor = data.regression.trend === 'up' ? 'text-green-600' : data.regression.trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setForecastMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${forecastMonths === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo Forecast
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          {[12, 24, 36].map(m => (
            <button key={m} onClick={() => setHistoryMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${historyMonths === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo History
            </button>
          ))}
        </div>
        <ExportButton
          filename="revenue-forecast"
          columns={[
            { header: 'Month', key: 'month' },
            { header: 'Revenue', key: 'revenue' },
            { header: 'Type', key: 'type' },
          ]}
          data={chartData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Trend</p>
          </div>
          <p className={`text-xl font-bold capitalize ${trendColor}`}>{data.regression.trend}</p>
          <p className="text-xs text-muted-foreground">R² = {data.regression.r2}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Monthly (History)</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.avgHistoryRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Monthly (Forecast)</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.avgForecastRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Forecast</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.totalForecastRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">History Total</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalHistoryRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Revenue History & Forecast</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [formatCurrency(v), 'Revenue']}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.6} name="Historical" />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#b8860b"
              strokeWidth={2}
              dot={false}
              name="Trend"
            />
            {data.regression.trend && (
              <Line
                type="monotone"
                data={data.forecast}
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#3b82f6' }}
                name="Forecast"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">Historical Data</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.history.slice(-12).reverse().map((h: any) => (
                  <tr key={h.month} className="border-b border-border/50">
                    <td className="py-1.5 text-navy font-medium">{h.month}</td>
                    <td className="py-1.5 text-right text-green-600">{formatCurrency(h.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">Forecast</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Predicted Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f: any) => (
                  <tr key={f.month} className="border-b border-border/50">
                    <td className="py-1.5 text-navy font-medium">{f.month}</td>
                    <td className="py-1.5 text-right text-blue-600 font-medium">{formatCurrency(f.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/reports/ForecastingTab.tsx
git commit -m "feat: add forecasting tab component"
```

---

### Task 19: Final Verification

**Files:**
- All newly created files

- [ ] **Build check**

```bash
cd C:\Users\obai\Desktop\website
npx prisma generate
npm run build 2>&1 | head -50
```

- [ ] **If build succeeds, commit all remaining files**

```bash
git add .
git commit -m "feat: complete reporting and analytics module"
```

- [ ] **If build fails, fix issues and re-run**

```bash
# Check for specific errors
npm run build 2>&1 | grep -i "error"
```

- [ ] **Verify sidebar renders with Reports link** — navigate to `/admin` and confirm sidebar shows Reports link between Accounting and Orders.
