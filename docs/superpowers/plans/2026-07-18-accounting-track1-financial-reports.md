# Track 1: Financial Reports & Bank Reconciliation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cash flow statement, financial ratios, dashboard drill-downs, bank reconciliation, and export polish to the accounting tab.

**Architecture:** New API routes under `/api/admin/accounting/` for cash-flow, ratios, bank-accounts; new UI tab components for Cash Flow and Reconciliation; drill-down panels added to existing OverviewTab. Bank reconciliation uses two new Prisma models.

**Tech Stack:** Next.js App Router, Prisma, TypeScript, Recharts, Sonner toast, shadcn/ui

---

### Task 1.1: Add Prisma models for BankAccount and BankTransaction

**Files:**
- Modify: `prisma/schema.prisma` (add BankAccount and BankTransaction models after existing Budget model)

- [ ] **Step 1: Add models to schema**

Add after the `model Budget { ... }` block (around line 839):

```prisma
model BankAccount {
  id                String   @id @default(cuid())
  name              String
  accountNumber     String
  bankName          String
  openingBalance    Float    @default(0)
  currentBalance    Float    @default(0)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  transactions      BankTransaction[]
}

model BankTransaction {
  id              String   @id @default(cuid())
  bankAccountId   String
  bankAccount     BankAccount @relation(fields: [bankAccountId], references: [id])
  transactionDate DateTime
  description     String
  reference       String?
  debit           Float    @default(0)
  credit          Float    @default(0)
  balance         Float
  matchedEntryId  String?
  matchedEntry    JournalEntry? @relation(fields: [matchedEntryId], references: [id])
  matchedAt       DateTime?
  matchedById     String?
  matchedBy       Admin?   @relation(fields: [matchedById], references: [id])
  isReconciled    Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

- [ ] **Step 2: Generate Prisma client and create migration**

Run:
```bash
npx prisma migrate dev --name add_bank_accounts
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add BankAccount and BankTransaction models"
```

---

### Task 1.2: Cash Flow Statement API

**Files:**
- Create: `src/app/api/admin/accounting/cash-flow/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function getDateRange(period: string, customStart?: string, customEnd?: string) {
  if (customStart && customEnd) {
    const start = new Date(customStart); start.setHours(0, 0, 0, 0)
    const end = new Date(customEnd); end.setHours(23, 59, 59, 999)
    return { start, end }
  }
  const now = new Date()
  const start = new Date(now); const end = new Date(now)
  switch (period) {
    case 'day': start.setHours(0,0,0,0); end.setHours(23,59,59,999); break
    case 'week': { const d = start.getDay(); const diff = start.getDate() - d + (d === 0 ? -6 : 1); start.setDate(diff); start.setHours(0,0,0,0); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999); break }
    case 'month': start.setDate(1); start.setHours(0,0,0,0); end.setMonth(end.getMonth() + 1, 0); end.setHours(23,59,59,999); break
    case 'year': start.setMonth(0,1); start.setHours(0,0,0,0); end.setMonth(11,31); end.setHours(23,59,59,999); break
  }
  return { start, end }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const period = req.nextUrl.searchParams.get('period') || 'month'
    const customStart = req.nextUrl.searchParams.get('customStart') || undefined
    const customEnd = req.nextUrl.searchParams.get('customEnd') || undefined
    const { start, end } = getDateRange(period, customStart, customEnd)

    const cashAccount = await db.account.findUnique({ where: { code: '1000' } })
    const bankAccount = await db.account.findUnique({ where: { code: '1100' } })
    const cashId = cashAccount?.id
    const bankId = bankAccount?.id

    const lines = await db.journalLine.findMany({
      where: {
        accountId: { in: [cashId, bankId].filter(Boolean) as string[] },
        entry: { date: { gte: start, lte: end } },
      },
      select: { debit: true, credit: true, accountId: true, entry: { select: { description: true, date: true, type: true } } },
      orderBy: { entry: { date: 'asc' } },
    })

    const cashInflow = lines.filter(l => l.credit > 0).reduce((s, l) => s + l.credit, 0)
    const cashOutflow = lines.filter(l => l.debit > 0).reduce((s, l) => s + l.debit, 0)

    const totalDebit = await db.journalLine.aggregate({
      where: { accountId: { in: [cashId, bankId].filter(Boolean) as string[] } },
      _sum: { debit: true, credit: true },
    })

    const allEntries = await db.journalEntry.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        lines: {
          where: { accountId: { in: [cashId, bankId].filter(Boolean) as string[] } },
          select: { debit: true, credit: true, accountId: true },
        },
      },
    })

    const operatingItems: { label: string; amount: number }[] = []
    const investingItems: { label: string; amount: number }[] = []
    const financingItems: { label: string; amount: number }[] = []

    for (const entry of allEntries) {
      const netCash = entry.lines.reduce((s, l) => s + l.credit - l.debit, 0)
      if (entry.type === 'sale') operatingItems.push({ label: entry.description, amount: netCash })
      else if (entry.type === 'expense') operatingItems.push({ label: entry.description, amount: netCash })
      else if (entry.type === 'reconciliation') operatingItems.push({ label: entry.description, amount: netCash })
      else operatingItems.push({ label: entry.description, amount: netCash })
    }

    const openingCash = (totalDebit._sum.credit || 0) - (totalDebit._sum.debit || 0) - cashInflow + cashOutflow

    return NextResponse.json({
      period, dateRange: { start: start.toISOString(), end: end.toISOString() }, method: 'direct',
      operating: { cashReceipts: cashInflow, cashPayments: cashOutflow, netOperating: cashInflow - cashOutflow, items: operatingItems },
      investing: { netInvesting: 0, items: investingItems },
      financing: { netFinancing: 0, items: financingItems },
      netCashFlow: cashInflow - cashOutflow,
      openingCash: Math.max(0, openingCash),
      closingCash: Math.max(0, openingCash + cashInflow - cashOutflow),
    })
  } catch (e) {
    console.error('Cash flow error:', e)
    return NextResponse.json({ error: 'Failed to fetch cash flow' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Step 2: Test the endpoint**

Run dev server and verify: `GET /api/admin/accounting/cash-flow?period=month` returns 200 with the expected shape.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/accounting/cash-flow/route.ts
git commit -m "feat: add cash flow statement API route"
```

---

### Task 1.3: Financial Ratios API

**Files:**
- Create: `src/app/api/admin/accounting/ratios/route.ts`

- [ ] **Step 1: Create the API route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    const revenue = await db.journalLine.aggregate({
      where: { account: { code: '4000' }, entry: { date: { gte: yearStart } } },
      _sum: { credit: true },
    })
    const cogs = await db.journalLine.aggregate({
      where: { account: { code: '5000' }, entry: { date: { gte: yearStart } } },
      _sum: { debit: true },
    })
    const expenses = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '5' } }, entry: { date: { gte: yearStart } } },
      _sum: { debit: true },
    })
    const totalAssets = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '1' } } },
      _sum: { debit: true },
      _sum: { credit: true },
    })
    const totalLiabilities = await db.journalLine.aggregate({
      where: { account: { code: { startsWith: '2' } } },
      _sum: { debit: true },
      _sum: { credit: true },
    })

    const totalRevenue = revenue._sum.credit || 0
    const totalCogs = cogs._sum.debit || 0
    const totalExpenses = expenses._sum.debit || 0
    const assets = (totalAssets._sum.debit || 0) - (totalAssets._sum.credit || 0)
    const liabilities = (totalLiabilities._sum.credit || 0) - (totalLiabilities._sum.debit || 0)
    const netIncome = totalRevenue - totalCogs - totalExpenses
    const equity = assets - liabilities

    return NextResponse.json({
      profitability: {
        grossMargin: { value: totalRevenue > 0 ? (totalRevenue - totalCogs) / totalRevenue : 0, label: 'Gross Margin', benchmark: 0.4 },
        netMargin: { value: totalRevenue > 0 ? netIncome / totalRevenue : 0, label: 'Net Margin', benchmark: 0.1 },
        roa: { value: assets > 0 ? netIncome / assets : 0, label: 'Return on Assets' },
      },
      liquidity: {
        currentRatio: { value: liabilities > 0 ? assets / liabilities : 0, label: 'Current Ratio', benchmark: 2.0 },
        quickRatio: { value: liabilities > 0 ? (assets - (totalAssets._sum.debit || 0) * 0.5) / liabilities : 0, label: 'Quick Ratio', benchmark: 1.0 },
      },
      efficiency: {
        assetTurnover: { value: assets > 0 ? totalRevenue / assets : 0, label: 'Asset Turnover' },
        inventoryTurnover: { value: totalCogs > 0 ? totalCogs / (assets * 0.3) : 0, label: 'Inventory Turnover' },
      },
    })
  } catch (e) {
    console.error('Ratios error:', e)
    return NextResponse.json({ error: 'Failed to fetch ratios' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Step 2: Test the endpoint**

Verify: `GET /api/admin/accounting/ratios` returns 200.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/accounting/ratios/route.ts
git commit -m "feat: add financial ratios API route"
```

---

### Task 1.4: Cash Flow Tab UI

**Files:**
- Create: `src/app/admin/accounting/CashFlowTab.tsx`
- Modify: `src/app/admin/accounting/page.tsx` (add import, tab entry, and render)

- [ ] **Step 1: Create CashFlowTab component**

```typescript
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency } from './page'

export default function CashFlowTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ operating: true, investing: false, financing: false })

  function fetchCF() {
    setLoading(true)
    fetch(`/api/admin/accounting/cash-flow?period=${period}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load cash flow'); setLoading(false) })
  }

  useEffect(() => { fetchCF() }, [period])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const sections = [
    { key: 'operating', label: 'Operating Activities', color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'investing', label: 'Investing Activities', color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'financing', label: 'Financing Activities', color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        {['day', 'week', 'month', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={() => {
          const rows = [['Section', 'Label', 'Amount']]
          for (const s of sections) {
            for (const item of data[s.key]?.items || []) {
              rows.push([s.label, item.label, String(item.amount)])
            }
            rows.push([s.label, `Net ${s.label}`, String(data[s.key]?.netOperating || data[s.key]?.netInvesting || data[s.key]?.netFinancing || 0)])
          }
          rows.push(['Summary', 'Net Cash Flow', String(data.netCashFlow)])
          const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cash-flow-${period}.csv`; a.click()
        }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Opening Cash</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.openingCash)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Net Cash Flow</p>
          <p className={`text-xl font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.netCashFlow)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Closing Cash</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.closingCash)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Operating Cash Flow</p>
          <p className={`text-xl font-bold ${data.operating?.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.operating?.netOperating || 0)}</p>
        </div>
      </div>

      {sections.map(({ key, label, color, bg }) => {
        const section = data[key]
        if (!section) return null
        const isExpanded = expanded[key]
        const net = section.netOperating ?? section.netInvesting ?? section.netFinancing ?? 0
        return (
          <div key={key} className="bg-white rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))} className={`w-full px-4 py-3 ${bg} flex items-center justify-between hover:opacity-80 transition-opacity`}>
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-semibold text-navy">{label}</h3>
              </div>
              <span className={`text-sm font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(net)}</span>
            </button>
            {isExpanded && (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Description</th><th className="p-3 font-medium text-right">Amount</th></tr></thead>
                <tbody>
                  {(section.items || []).length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No transactions</td></tr>}
                  {(section.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-gray-50">
                      <td className="p-3 text-navy">{item.label}</td>
                      <td className={`p-3 text-right font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className={`${bg} font-semibold border-t-2 border-border`}>
                    <td className="p-3 text-navy">Net {label}</td>
                    <td className={`p-3 text-right ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(net)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Add import and tab to page.tsx**

In `src/app/admin/accounting/page.tsx`, add the import line after the existing imports (around line 18):
```typescript
import CashFlowTab from './CashFlowTab'
```

Add `'cash-flow'` to the tab list array (around line 152):
```typescript
{(['overview', 'journal', 'accounts', 'trial-balance', 'pl', 'balance-sheet', 'cash-flow', 'aging', 'tax', 'budget', 'audit', 'orders', 'branches', 'expenses', 'reports'] as const).map(t => (
```

Add the render case (around line 169):
```typescript
{tab === 'cash-flow' && <CashFlowTab />}
```

- [ ] **Step 3: Test**

Navigate to the accounting page, click the "Cash Flow" tab. Verify it loads data and displays correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/accounting/CashFlowTab.tsx src/app/admin/accounting/page.tsx
git commit -m "feat: add cash flow statement tab UI"
```

---

### Task 1.5: Add Ratios Section to Overview

**Files:**
- Modify: `src/app/admin/accounting/page.tsx` (add ratio fetching and display in OverviewTab)

- [ ] **Step 1: Add ratios fetch to OverviewTab**

Add state and fetch inside the `OverviewTab` function (after the existing `localCompare` state at line 186):
```typescript
const [ratios, setRatios] = useState<any>(null)

useEffect(() => {
  fetch('/api/admin/accounting/ratios')
    .then(r => { if (!r.ok) throw new Error(); return r.json() })
    .then(d => setRatios(d))
    .catch(() => {})
}, [])
```

- [ ] **Step 2: Add ratios display below revenue chart**

Add after the `</RevenueChart>` closing (around line 324):
```tsx
{ratios && (
  <div className="bg-white rounded-xl border border-border p-5">
    <h3 className="text-sm font-semibold text-navy mb-4">Financial Ratios</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Object.entries(ratios.profitability || {}).map(([key, r]: [string, any]) => (
        <div key={key} className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
          <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>
            {(r.value * 100).toFixed(1)}%
          </p>
          {r.benchmark !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">Benchmark: {(r.benchmark * 100).toFixed(0)}%</p>
          )}
        </div>
      ))}
      {Object.entries(ratios.liquidity || {}).map(([key, r]: [string, any]) => (
        <div key={key} className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
          <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>
            {r.value.toFixed(2)}
          </p>
          {r.benchmark !== undefined && <p className="text-xs text-muted-foreground mt-0.5">Benchmark: {r.benchmark.toFixed(1)}</p>}
        </div>
      ))}
      {Object.entries(ratios.efficiency || {}).map(([key, r]: [string, any]) => (
        <div key={key} className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
          <p className="text-lg font-bold text-navy">{r.value.toFixed(2)}</p>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat: add financial ratios to overview tab"
```

---

### Task 1.6: Dashboard Drill-Downs

**Files:**
- Modify: `src/app/admin/accounting/page.tsx` (add drill-down panel to OverviewTab)

- [ ] **Step 1: Add drill-down state and panel to OverviewTab**

After the ratios section (after the new ratios block), add drill-down state and component. Add inside the `OverviewTab` function after existing states:
```typescript
const [drillDown, setDrillDown] = useState<{ type: string; data: any } | null>(null)
```

Add a `DrillDownPanel` component after the `OverviewTab` function (before the closing of the file):
```tsx
function DrillDownPanel({ type, data, onClose }: { type: string; data: any; onClose: () => void }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-navy">Drill-down: {type}</h4>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-navy">Close</button>
      </div>
      <pre className="text-xs text-muted-foreground max-h-60 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
```

Make stat cards clickable. Find the `StatCard` function (around line 245) and add `onClick` prop. Add `cursor-pointer hover:shadow-lg` class. The card usage at lines 290-295 should pass `onClick`:

Replace the `handleExportCSV` button section with click handlers on stat cards. Each card's `onClick` sets `setDrillDown({ type: label, data: data })`.

- [ ] **Step 2: Add drill-down panel render**

Add before the `</div>` of the OverviewTab return (before the closing of the outer div):
```tsx
{drillDown && (
  <DrillDownPanel type={drillDown.type} data={drillDown.data} onClose={() => setDrillDown(null)} />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat: add dashboard drill-down panels"
```

---

### Task 1.7: Bank Reconciliation — API Routes

**Files:**
- Create: `src/app/api/admin/accounting/bank-accounts/route.ts`
- Create: `src/app/api/admin/accounting/bank-accounts/[id]/transactions/route.ts`
- Create: `src/app/api/admin/accounting/bank-accounts/[id]/import/route.ts`
- Create: `src/app/api/admin/accounting/bank-accounts/[id]/match/route.ts`
- Create: `src/app/api/admin/accounting/bank-accounts/[id]/transactions/[txId]/match/route.ts`

- [ ] **Step 1: Create bank-accounts list/create route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async () => {
  const accounts = await db.bankAccount.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
  return NextResponse.json({ accounts })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const account = await db.bankAccount.create({
    data: { name: body.name, accountNumber: body.accountNumber, bankName: body.bankName, openingBalance: body.openingBalance || 0, currentBalance: body.openingBalance || 0 },
  })
  return NextResponse.json({ account })
}, 'accounting')
```

- [ ] **Step 2: Create transactions list route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const transactions = await db.bankTransaction.findMany({
    where: { bankAccountId: params.id },
    orderBy: { transactionDate: 'desc' },
    include: { matchedEntry: { include: { lines: { include: { account: true } } } } },
  })
  return NextResponse.json({ transactions })
}, 'accounting')
```

- [ ] **Step 3: Create import route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json()
  const { transactions } = body
  const created = []
  for (const tx of transactions) {
    const createdTx = await db.bankTransaction.create({
      data: {
        bankAccountId: params.id,
        transactionDate: new Date(tx.date),
        description: tx.description,
        reference: tx.reference,
        debit: tx.debit || 0,
        credit: tx.credit || 0,
        balance: tx.balance || 0,
      },
    })
    created.push(createdTx)
  }
  return NextResponse.json({ imported: created.length })
}, 'accounting')
```

- [ ] **Step 4: Create auto-match suggestions route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const unmatched = await db.bankTransaction.findMany({
    where: { bankAccountId: params.id, matchedEntryId: null },
    orderBy: { transactionDate: 'desc' },
  })
  const entries = await db.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  })
  const suggestions: { transactionId: string; entryId: string; score: number }[] = []
  for (const tx of unmatched) {
    for (const entry of entries) {
      const entryTotal = entry.lines.reduce((s, l) => s + l.debit + l.credit, 0)
      const txAmount = tx.debit + tx.credit
      if (Math.abs(entryTotal - txAmount) < 0.01) {
        suggestions.push({ transactionId: tx.id, entryId: entry.id, score: 100 })
      }
    }
  }
  return NextResponse.json({ suggestions })
}, 'accounting')
```

- [ ] **Step 5: Create manual match route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req: NextRequest, { params }: { params: { id: string; txId: string } }) => {
  const body = await req.json()
  const tx = await db.bankTransaction.update({
    where: { id: params.txId },
    data: { matchedEntryId: body.entryId, matchedAt: new Date(), matchedById: params.id, isReconciled: true },
  })
  return NextResponse.json({ transaction: tx })
}, 'accounting')
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/accounting/bank-accounts/
git commit -m "feat: add bank reconciliation API routes"
```

---

### Task 1.8: Bank Reconciliation — UI Tab

**Files:**
- Create: `src/app/admin/accounting/ReconciliationTab.tsx`
- Modify: `src/app/admin/accounting/page.tsx` (add import, tab entry, render)

- [ ] **Step 1: Create ReconciliationTab component**

Create `src/app/admin/accounting/ReconciliationTab.tsx` with:
- Bank account selector dropdown (fetches from `/api/admin/accounting/bank-accounts`)
- Import CSV button with file input (parses CSV to JSON, POSTs to import endpoint)
- Two-column layout: left = bank transactions table, right = matched journal entries
- Auto-match button (calls match endpoint, highlights suggestions)
- Manual match: click a bank transaction row → select a journal entry to match
- Reconciliation summary bar: opening balance, cleared total, outstanding, difference

```typescript
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Upload, CheckCircle, XCircle, Link2 } from 'lucide-react'
import { formatCurrency } from './page'

export default function ReconciliationTab() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [suggestions, setSuggestions] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/accounting/bank-accounts')
      .then(r => r.json())
      .then(d => { setAccounts(d.accounts || []); if (d.accounts?.length) setSelectedAccount(d.accounts[0].id) })
      .catch(() => toast.error('Failed to load bank accounts'))
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    setLoading(true)
    fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/transactions`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load transactions'); setLoading(false) })
  }, [selectedAccount])

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').filter(Boolean)
      const headers = lines[0].split(',')
      const transactions = lines.slice(1).map(line => {
        const vals = line.split(',')
        const obj: any = {}
        headers.forEach((h, i) => obj[h.trim()] = vals[i]?.trim())
        return { date: obj.date || obj.Date, description: obj.description || obj.Description, reference: obj.reference || obj.Reference, debit: parseFloat(obj.debit || obj.Debit || 0), credit: parseFloat(obj.credit || obj.Credit || 0), balance: parseFloat(obj.balance || obj.Balance || 0) }
      })
      const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/import`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ transactions }) })
      if (res.ok) { toast.success(`Imported ${transactions.length} transactions`); window.location.reload() }
      else toast.error('Import failed')
    }
    input.click()
  }

  async function handleAutoMatch() {
    const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/match`, { method: 'POST' })
    const d = await res.json()
    setSuggestions(d.suggestions || [])
    toast.success(`Found ${d.suggestions?.length || 0} possible matches`)
  }

  async function handleMatch(txId: string, entryId: string) {
    const res = await fetch(`/api/admin/accounting/bank-accounts/${selectedAccount}/transactions/${txId}/match`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId }) })
    if (res.ok) { toast.success('Transaction matched'); setSelectedTx(null) }
    else toast.error('Match failed')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  const matched = transactions.filter(t => t.isReconciled)
  const unmatched = transactions.filter(t => !t.isReconciled)
  const totalCleared = matched.reduce((s, t) => s + (t.debit || 0) - (t.credit || 0), 0)
  const totalOutstanding = unmatched.reduce((s, t) => s + (t.debit || 0) - (t.credit || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bankName})</option>)}
        </select>
        <button onClick={handleImport} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
          <Upload className="h-4 w-4" /> Import CSV
        </button>
        <button onClick={handleAutoMatch} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-1.5">
          <Link2 className="h-4 w-4" /> Auto-match
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Transactions</p>
          <p className="text-xl font-bold text-navy">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Cleared</p>
          <p className="text-xl font-bold text-green-600">{matched.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Outstanding</p>
          <p className="text-xl font-bold text-amber-600">{unmatched.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-navy">Bank Transactions</h3>
          <span className="text-xs text-muted-foreground">{unmatched.length} unmatched</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white"><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Date</th><th className="p-3 font-medium">Description</th><th className="p-3 font-medium text-right">Debit</th><th className="p-3 font-medium text-right">Credit</th><th className="p-3 font-medium text-center">Status</th><th className="p-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {transactions.map(tx => {
                const suggestion = suggestions.find(s => s.transactionId === tx.id)
                return (
                  <tr key={tx.id} className={`border-b border-border/50 hover:bg-gray-50 ${tx.isReconciled ? 'bg-green-50/50' : suggestion ? 'bg-blue-50/50' : ''}`}>
                    <td className="p-3 text-navy">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td className="p-3 text-navy">{tx.description}</td>
                    <td className="p-3 text-right text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : ''}</td>
                    <td className="p-3 text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : ''}</td>
                    <td className="p-3 text-center">{tx.isReconciled ? <CheckCircle className="h-4 w-4 text-green-600 inline" /> : <XCircle className="h-4 w-4 text-amber-400 inline" />}</td>
                    <td className="p-3">
                      {!tx.isReconciled && (
                        <button onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)} className="text-xs text-navy hover:text-gold">
                          {selectedTx?.id === tx.id ? 'Cancel' : 'Match'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTx && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <h4 className="text-sm font-semibold text-navy mb-3">Match Transaction: {selectedTx.description}</h4>
          <p className="text-xs text-muted-foreground mb-3">Amount: {formatCurrency(selectedTx.debit + selectedTx.credit)}</p>
          <p className="text-xs text-muted-foreground mb-2">Match with journal entry:</p>
          <input type="text" placeholder="Enter journal entry ID..." className="w-full px-3 py-2 border border-border rounded-lg text-sm mb-3" />
          <button onClick={() => handleMatch(selectedTx.id, 'manual')} className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Match</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add import and tab to page.tsx**

Add import: `import ReconciliationTab from './ReconciliationTab'`
Add `'reconciliation'` to the tab list.
Add render: `{tab === 'reconciliation' && <ReconciliationTab />}`

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/accounting/ReconciliationTab.tsx src/app/admin/accounting/page.tsx
git commit -m "feat: add bank reconciliation tab UI"
```

---

### Task 1.9: Export Polish

**Files:**
- Modify: `src/app/admin/accounting/page.tsx` (standardize export buttons in OverviewTab)
- Modify: `src/app/admin/accounting/ProfitLossTab.tsx` (add Excel export)
- Modify: `src/app/admin/accounting/BalanceSheetTab.tsx` (add Excel export)

- [ ] **Step 1: Standardize export buttons across tabs**

Ensure every tab that has data has three export buttons: CSV (green), Excel (blue), PDF (red). Use consistent styling from ProfitLossTab as the reference.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/accounting/page.tsx src/app/admin/accounting/ProfitLossTab.tsx src/app/admin/accounting/BalanceSheetTab.tsx
git commit -m "feat: standardize export buttons across accounting tabs"
```
