# Accounting Deep-Dive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the accounting module with P&L, Balance Sheet, Audit Logging, Recharts charts, AR/AP Aging, Tax Reports, Budget vs Actual, and PDF export.

**Architecture:** 8 new API routes, 6 new tab components, 1 new Prisma model (Budget), 2 new npm packages (jspdf, jspdf-autotable). Re-use existing `logAudit()` pattern. Replace inline SVG RevenueChart with Recharts. All tabs follow existing `'use client'` pattern. PDF is client-side via jspdf.

**Tech Stack:** Next.js 16, React 19, Prisma ORM, PostgreSQL, Recharts 2.15.4, ExcelJS, jsPDF, Tailwind CSS, shadcn/ui

---

### Task 1: Add Budget Model to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add Budget model after Account model** (insert after line 703, before `model JournalEntry`)

```prisma
model Budget {
  id          String   @id @default(cuid())
  accountCode String
  month       Int      // 1-12
  year        Int
  amount      Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([accountCode, month, year])
  @@index([year, month])
}
```

- [ ] **Run migration**

```bash
cd C:\Users\obai\Desktop\website
npx prisma migrate dev --name add-budget-model
```

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Budget model"
```

---

### Task 2: Install jsPDF for Client-Side PDF Generation

**Files:**
- Modify: `package.json` (via npm install)

- [ ] **Install jspdf and jspdf-autotable**

```bash
cd C:\Users\obai\Desktop\website
npm install jspdf jspdf-autotable
```

- [ ] **Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add jspdf and jspdf-autotable for PDF exports"
```

---

### Task 3: Create P&L API Route

**Files:**
- Create: `src/app/api/admin/accounting/pl/route.ts`

- [ ] **Create the P&L route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function getDateRange(period: string, year?: string, month?: string): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (period === 'month' && year && month) {
    start.setFullYear(parseInt(year), parseInt(month) - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), parseInt(month), 0, 23, 59, 59, 999)
  } else if (period === 'quarter' && year && month) {
    const qStart = (Math.floor((parseInt(month) - 1) / 3)) * 3 + 1
    start.setFullYear(parseInt(year), qStart - 1, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), qStart + 2, 0, 23, 59, 59, 999)
  } else if (period === 'year' && year) {
    start.setFullYear(parseInt(year), 0, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(parseInt(year), 11, 31, 23, 59, 59, 999)
  } else {
    start.setFullYear(now.getFullYear(), 0, 1)
    start.setHours(0, 0, 0, 0)
    end.setFullYear(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  }

  return { start, end }
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const period = sp.get('period') || 'year'
    const year = sp.get('year') || String(new Date().getFullYear())
    const month = sp.get('month') || String(new Date().getMonth() + 1)
    const comparison = sp.get('comparison') // 'monthly' or undefined

    const { start, end } = getDateRange(period, year, month)

    const accounts = await db.account.findMany({
      where: { type: { in: ['income', 'expense'] } },
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            entry: {
              date: { gte: start, lte: end },
            },
          },
          select: { debit: true, credit: true },
        },
      },
    })

    const incomeAccounts = accounts.filter(a => a.type === 'income')
    const expenseAccounts = accounts.filter(a => a.type === 'expense')

    const incomeItems = incomeAccounts.map(acc => {
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      return { code: acc.code, name: acc.name, nameAr: acc.nameAr, balance: totalCredit - totalDebit }
    })

    const expenseItems = expenseAccounts.map(acc => {
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      return { code: acc.code, name: acc.name, nameAr: acc.nameAr, balance: totalDebit - totalCredit }
    })

    const totalIncome = incomeItems.reduce((s, i) => s + i.balance, 0)
    const totalExpenses = expenseItems.reduce((s, e) => s + e.balance, 0)
    const netProfit = totalIncome - totalExpenses

    let monthlyComparison: { month: string; income: number; expenses: number; net: number }[] | null = null

    if (comparison === 'monthly') {
      const months: { month: string; start: Date; end: Date }[] = []
      const y = parseInt(year)
      for (let m = 1; m <= 12; m++) {
        const ms = new Date(y, m - 1, 1, 0, 0, 0, 0)
        const me = new Date(y, m, 0, 23, 59, 59, 999)
        months.push({ month: `${y}-${String(m).padStart(2, '0')}`, start: ms, end: me })
      }

      const allIncome = await db.account.findMany({
        where: { type: 'income' },
        select: { id: true, code: true, name: true },
      })
      const allExpense = await db.account.findMany({
        where: { type: 'expense' },
        select: { id: true, code: true, name: true },
      })

      monthlyComparison = []
      for (const m of months) {
        const [incomeLines, expenseLines] = await Promise.all([
          db.journalLine.findMany({
            where: {
              accountId: { in: allIncome.map(a => a.id) },
              entry: { date: { gte: m.start, lte: m.end } },
            },
            select: { debit: true, credit: true },
          }),
          db.journalLine.findMany({
            where: {
              accountId: { in: allExpense.map(a => a.id) },
              entry: { date: { gte: m.start, lte: m.end } },
            },
            select: { debit: true, credit: true },
          }),
        ])
        const inc = incomeLines.reduce((s, l) => s + l.credit - l.debit, 0)
        const exp = expenseLines.reduce((s, l) => s + l.debit - l.credit, 0)
        monthlyComparison.push({ month: m.month, income: inc, expenses: exp, net: inc - exp })
      }
    }

    return NextResponse.json({
      period,
      year,
      month,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      incomeItems,
      expenseItems,
      totalIncome,
      totalExpenses,
      netProfit,
      monthlyComparison,
    })
  } catch (e) {
    console.error('P&L GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch P&L' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/pl/route.ts
git commit -m "feat: add P&L API route with period and monthly comparison"
```

---

### Task 4: Create ProfitLossTab Component

**Files:**
- Create: `src/app/admin/accounting/ProfitLossTab.tsx`

- [ ] **Create ProfitLossTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Download, BarChart3 } from 'lucide-react'
import { formatCurrency } from './page'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export default function ProfitLossTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [period, setPeriod] = useState('year')
  const [comparison, setComparison] = useState('')

  function fetchPL() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('period', period)
    params.set('year', year)
    if (comparison) params.set('comparison', comparison)
    fetch(`/api/admin/accounting/pl?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load P&L'); setLoading(false) })
  }

  useEffect(() => { fetchPL() }, [period, year, comparison])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const colors = { income: '#10b981', expenses: '#f59e0b', net: '#6366f1' }

  const comparisonData = data.monthlyComparison?.map((m: any) => ({
    month: m.month.slice(5),
    Income: m.income,
    Expenses: m.expenses,
    Net: m.net,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {['year', 'quarter', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setComparison(comparison ? '' : 'monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${comparison ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Monthly View
        </button>
        <button
          onClick={() => {
            const rows: Record<string, any>[] = [
              ...data.incomeItems.map((i: any) => ({ Category: 'Income', Account: i.name, Amount: i.balance })),
              ...data.expenseItems.map((e: any) => ({ Category: 'Expense', Account: e.name, Amount: e.balance })),
              { Category: '', Account: 'Net Profit', Amount: data.netProfit },
            ]
            const csv = ['Category,Account,Amount', ...rows.map(r => `"${r.Category}","${r.Account}",${r.Amount}`)].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pnl-${year}.csv`; a.click()
          }}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-50"><TrendingUp className="h-4 w-4 text-green-600" /></div>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-50"><TrendingDown className="h-4 w-4 text-amber-600" /></div>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${data.netProfit >= 0 ? 'bg-indigo-50' : 'bg-red-50'}`}><DollarSign className={`h-4 w-4 ${data.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`} /></div>
            <p className="text-xs text-muted-foreground">Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(data.netProfit))}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">Income</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Amount</th></tr></thead>
            <tbody>
              {data.incomeItems.map((i: any) => (
                <tr key={i.code} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{i.name}</td>
                  <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(i.balance)}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">Total Income</td><td className="p-3 text-right text-green-700">{formatCurrency(data.totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">Expenses</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Amount</th></tr></thead>
            <tbody>
              {data.expenseItems.map((e: any) => (
                <tr key={e.code} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{e.name}</td>
                  <td className="p-3 text-right font-semibold text-amber-600">{formatCurrency(e.balance)}</td>
                </tr>
              ))}
              <tr className="bg-amber-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">Total Expenses</td><td className="p-3 text-right text-amber-700">{formatCurrency(data.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {comparisonData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Income" fill={colors.income} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill={colors.expenses} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Net" fill={colors.net} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{data.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(Math.abs(data.netProfit))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">{period === 'year' ? `Year ${year}` : `${period} ${year}`}</p>
            <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${data.netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {data.netProfit >= 0 ? '+' : '-'} Income - Expenses
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
          <div><p className="text-xs opacity-60">Total Income</p><p className="font-semibold text-green-300">+{formatCurrency(data.totalIncome)}</p></div>
          <div><p className="text-xs opacity-60">Total Expenses</p><p className="font-semibold text-red-300">-{formatCurrency(data.totalExpenses)}</p></div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/ProfitLossTab.tsx
git commit -m "feat: add Profit & Loss tab with Recharts monthly comparison"
```

---

### Task 5: Create Balance Sheet API Route

**Files:**
- Create: `src/app/api/admin/accounting/balance-sheet/route.ts`

- [ ] **Create the balance sheet route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const dateParam = sp.get('date') || new Date().toISOString().slice(0, 10)
    const asOfDate = new Date(dateParam)
    asOfDate.setHours(23, 59, 59, 999)

    const accounts = await db.account.findMany({
      orderBy: { code: 'asc' },
      include: {
        journalLines: {
          where: {
            entry: { date: { lte: asOfDate } },
          },
          select: { debit: true, credit: true },
        },
      },
    })

    const groups: Record<string, { code: string; name: string; balance: number }[]> = {
      asset: [],
      liability: [],
      equity: [],
    }

    for (const acc of accounts) {
      if (!groups[acc.type]) continue
      const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
      const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
      let balance = totalDebit - totalCredit
      if (['liability', 'equity'].includes(acc.type)) {
        balance = totalCredit - totalDebit
      }
      groups[acc.type].push({ code: acc.code, name: acc.name, balance })
    }

    const totalAssets = groups.asset.reduce((s, a) => s + a.balance, 0)
    const totalLiabilities = groups.liability.reduce((s, l) => s + l.balance, 0)
    const totalEquity = groups.equity.reduce((s, e) => s + e.balance, 0)

    return NextResponse.json({
      asOfDate: asOfDate.toISOString(),
      groups,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    })
  } catch (e) {
    console.error('Balance sheet GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch balance sheet' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/balance-sheet/route.ts
git commit -m "feat: add balance sheet API route"
```

---

### Task 6: Create BalanceSheetTab Component

**Files:**
- Create: `src/app/admin/accounting/BalanceSheetTab.tsx`

- [ ] **Create BalanceSheetTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Scale, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from './page'

export default function BalanceSheetTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  function fetchBS() {
    setLoading(true)
    fetch(`/api/admin/accounting/balance-sheet?date=${date}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load balance sheet'); setLoading(false) })
  }

  useEffect(() => { fetchBS() }, [date])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const sectionColors: Record<string, { text: string; bg: string; label: string }> = {
    asset: { text: 'text-green-600', bg: 'bg-green-50', label: 'Assets' },
    liability: { text: 'text-blue-600', bg: 'bg-blue-50', label: 'Liabilities' },
    equity: { text: 'text-purple-600', bg: 'bg-purple-50', label: 'Equity' },
  }

  function handleExportCSV() {
    const rows: Record<string, any>[] = []
    for (const [type, items] of Object.entries(data.groups || {})) {
      for (const item of items as any[]) {
        rows.push({ Type: sectionColors[type]?.label || type, Account: item.name, Balance: item.balance })
      }
    }
    rows.push({ Type: '', Account: 'Total Assets', Balance: data.totalAssets })
    rows.push({ Type: '', Account: 'Total Liabilities', Balance: data.totalLiabilities })
    rows.push({ Type: '', Account: 'Total Equity', Balance: data.totalEquity })
    const csv = ['Type,Account,Balance', ...rows.map(r => `"${r.Type}","${r.Account}",${r.Balance}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'balance-sheet.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${data.balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {data.balanced ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {data.balanced ? 'Balanced' : 'Out of Balance'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(sectionColors).map(([type, cfg]) => (
          <div key={type} className={`${cfg.bg} rounded-xl border border-border p-4`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{cfg.label}</p>
            <p className={`text-2xl font-bold ${cfg.text}`}>
              {type === 'asset' ? formatCurrency(data.totalAssets) : type === 'liability' ? formatCurrency(data.totalLiabilities) : formatCurrency(data.totalEquity)}
            </p>
          </div>
        ))}
      </div>

      {Object.entries(sectionColors).map(([type, cfg]) => {
        const items = data.groups?.[type] || []
        return (
          <div key={type} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-4 py-3 ${cfg.bg}`}>
              <h3 className="font-semibold text-navy">{cfg.label}</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Balance</th></tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No accounts</td></tr>}
                {items.map((item: any) => (
                  <tr key={item.code} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{item.name}</td>
                    <td className={`p-3 text-right font-semibold ${cfg.text}`}>{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
                <tr className={`${cfg.bg} font-semibold border-t-2 border-border`}>
                  <td className="p-3 text-navy">Total {cfg.label}</td>
                  <td className={`p-3 text-right ${cfg.text}`}>
                    {formatCurrency(type === 'asset' ? data.totalAssets : type === 'liability' ? data.totalLiabilities : data.totalEquity)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 opacity-80" />
          <div>
            <p className="text-sm opacity-80">Accounting Equation</p>
            <p className="text-lg font-bold mt-1">Assets = Liabilities + Equity</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-mono opacity-90">{formatCurrency(data.totalAssets)} = {formatCurrency(data.totalLiabilities)} + {formatCurrency(data.totalEquity)}</p>
            <p className={`text-xs mt-1 font-medium ${data.balanced ? 'text-green-300' : 'text-red-300'}`}>
              {data.balanced ? '✓ Balanced' : '✗ Out of balance by ' + formatCurrency(Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/BalanceSheetTab.tsx
git commit -m "feat: add Balance Sheet tab"
```

---

### Task 7: Wire Audit Logging into Existing Accounting Routes

**Files:**
- Modify: `src/app/api/admin/accounting/expenses/route.ts`
- Modify: `src/app/api/admin/accounting/orders/[id]/fulfill/route.ts`
- Modify: `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts`
- Modify: `src/app/api/admin/accounting/sync/route.ts`

- [ ] **Add audit logging to expense create/delete**

In `src/app/api/admin/accounting/expenses/route.ts`, add the import and wire logging:

Add import at top (after existing imports):
```ts
import { logAudit } from '@/lib/audit'
```

In the POST handler, after `await createExpenseJournalEntry(expense)`, add:
```ts
try {
  await logAudit({ adminId: ctx.admin.id, action: 'create', resource: 'expense', resourceId: expense.id, details: { amount: expense.amount, description: expense.description } })
} catch {}
```

In the DELETE handler, before `await db.expense.delete`, add:
```ts
try {
  const exp = await db.expense.findUnique({ where: { id }, select: { amount: true, description: true } })
  if (exp) await logAudit({ adminId: ctx.admin.id, action: 'delete', resource: 'expense', resourceId: id, details: { amount: exp.amount, description: exp.description } })
} catch {}
```

The current POST handler uses `(req: Request)` without `ctx`. Change it to `(req: Request, ctx: { params: any; admin: AdminInfo })` and update the `withAdmin` callback signature accordingly.

Full modified POST:
```ts
export const POST = withAdmin(async (req: Request, ctx: { params: any; admin: AdminInfo }) => {
  try {
    const { amount, description, paymentMethod, branchId, supplierId, invoiceNumber, notes } = await req.json()
    if (!amount || !description || !paymentMethod) {
      return NextResponse.json({ error: 'Amount, description, and payment method required' }, { status: 400 })
    }
    const expense = await db.expense.create({
      data: {
        amount: parseFloat(amount),
        description,
        paymentMethod,
        branchId: branchId || null,
        supplierId: supplierId || null,
        invoiceNumber: invoiceNumber || null,
        notes: notes || null,
      },
    })
    try {
      await createExpenseJournalEntry(expense)
    } catch (journalErr) {
      console.error('Failed to create journal entry for expense:', journalErr)
    }
    try {
      await logAudit({ adminId: ctx.admin.id, action: 'create', resource: 'expense', resourceId: expense.id, details: { amount: expense.amount, description: expense.description } })
    } catch {}
    return NextResponse.json({ ok: true, expense })
  } catch (e) {
    console.error('Expenses POST error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
```

Full modified DELETE:
```ts
export const DELETE = withAdmin(async (req: NextRequest, ctx: { params: any; admin: AdminInfo }) => {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    try {
      const exp = await db.expense.findUnique({ where: { id }, select: { amount: true, description: true } })
      if (exp) await logAudit({ adminId: ctx.admin.id, action: 'delete', resource: 'expense', resourceId: id, details: { amount: exp.amount, description: exp.description } })
    } catch {}
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Expenses DELETE error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Add audit logging to fulfill route**

In `src/app/api/admin/accounting/orders/[id]/fulfill/route.ts`:
```ts
import { logAudit } from '@/lib/audit'
```

Change the handler to accept ctx:
```ts
export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
```

After the update, add:
```ts
try {
  await logAudit({ adminId: admin.id, action: 'fulfill', resource: 'order', resourceId: id, details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount } })
} catch {}
```

Full handler:
```ts
export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  try {
    const { id } = await params
    const order = await db.order.findUnique({ where: { id } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const updated = await db.order.update({
      where: { id },
      data: { status: 'delivered', fulfilledAt: new Date() },
    })

    try {
      await logAudit({ adminId: admin.id, action: 'fulfill', resource: 'order', resourceId: id, details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount } })
    } catch {}

    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    console.error('Fulfill POST error:', e)
    return NextResponse.json({ error: 'Failed to fulfill order' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Add audit logging to reconcile route**

In `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts`:
```ts
import { logAudit } from '@/lib/audit'
```

Add after the journal creation block:
```ts
try {
  await logAudit({ adminId: ctx.admin.id, action: 'reconcile', resource: 'order', resourceId: id, details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount } })
} catch {}
```

The current handler already uses `ctx` with admin. Add the import and the logAudit call inside the try block after `await createReconciliationJournalEntry`.

- [ ] **Add audit logging to sync route**

In `src/app/api/admin/accounting/sync/route.ts`:
```ts
import { logAudit } from '@/lib/audit'
```

Change handler to accept ctx:
```ts
export const POST = withAdmin(async (req: Request, { admin }: { params: any; admin: AdminInfo }) => {
```

Add after the sync loops:
```ts
try {
  await logAudit({ adminId: admin.id, action: 'sync', resource: 'journal', details: { synced: results } })
} catch {}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/expenses/route.ts src/app/api/admin/accounting/orders/\[id\]/fulfill/route.ts src/app/api/admin/accounting/orders/\[id\]/reconcile/route.ts src/app/api/admin/accounting/sync/route.ts
git commit -m "feat: wire audit logging into expense CRUD, fulfill, reconcile, sync"
```

---

### Task 8: Create Audit Log API Route

**Files:**
- Create: `src/app/api/admin/accounting/audit/route.ts`

- [ ] **Create the audit log route with filters**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const action = sp.get('action')
    const resource = sp.get('resource')
    const adminId = sp.get('adminId')
    const from = sp.get('from')
    const to = sp.get('to')
    const page = parseInt(sp.get('page') || '1')
    const limit = parseInt(sp.get('limit') || '50')

    const where: any = {}
    if (action) where.action = action
    if (resource) where.resource = resource
    if (adminId) where.adminId = adminId
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ])

    const logsWithParsed = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null,
    }))

    const distinctActions = await db.activityLog.findMany({
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    })

    const distinctResources = await db.activityLog.findMany({
      select: { resource: true },
      distinct: ['resource'],
      orderBy: { resource: 'asc' },
    })

    return NextResponse.json({
      logs: logsWithParsed,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        actions: distinctActions.map(a => a.action),
        resources: distinctResources.map(r => r.resource),
      },
    })
  } catch (e) {
    console.error('Audit GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/audit/route.ts
git commit -m "feat: add audit log API route with filters"
```

---

### Task 9: Create AuditTab Component

**Files:**
- Create: `src/app/admin/accounting/AuditTab.tsx`

- [ ] **Create AuditTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter } from 'lucide-react'

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  delete: 'bg-red-100 text-red-700',
  fulfill: 'bg-blue-100 text-blue-700',
  reconcile: 'bg-purple-100 text-purple-700',
  sync: 'bg-amber-100 text-amber-700',
  payment_verified: 'bg-teal-100 text-teal-700',
  payment_rejected: 'bg-orange-100 text-orange-700',
}

export default function AuditTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  function fetchAudit() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (actionFilter) params.set('action', actionFilter)
    if (resourceFilter) params.set('resource', resourceFilter)
    fetch(`/api/admin/accounting/audit?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load audit logs'); setLoading(false) })
  }

  useEffect(() => { fetchAudit() }, [page, actionFilter, resourceFilter])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Actions</option>
          {data?.filters?.actions?.map((a: string) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Resources</option>
          {data?.filters?.resources?.map((r: string) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={fetchAudit} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Filter className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Date</th>
              <th className="p-3 font-medium">Admin</th>
              <th className="p-3 font-medium">Action</th>
              <th className="p-3 font-medium">Resource</th>
              <th className="p-3 font-medium">Resource ID</th>
              <th className="p-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.logs || data.logs.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No audit logs found</td></tr>}
            {data?.logs?.map((log: any) => (
              <tr key={log.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3 font-medium text-navy">{log.adminName || log.adminId?.slice(0, 8) || 'System'}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>{log.action.replace(/_/g, ' ')}</span></td>
                <td className="p-3 text-muted-foreground capitalize">{log.resource}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground">{log.resourceId ? log.resourceId.slice(0, 12) + '...' : '-'}</td>
                <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.details ? JSON.stringify(Object.fromEntries(Object.entries(log.details).filter(([_, v]) => typeof v !== 'object'))) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border">
            <span>{data.total} total logs</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.totalPages || 1, 20) }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded text-xs ${page === i + 1 ? 'bg-navy text-silver' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/AuditTab.tsx
git commit -m "feat: add Audit Log tab with filters"
```

---

### Task 10: Replace Inline SVG RevenueChart with Recharts

**Files:**
- Modify: `src/app/admin/accounting/page.tsx`

- [ ] **Replace `RevenueChart` component with Recharts implementation**

Find the `RevenueChart` function (lines 39-100) and replace it entirely:

```tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const isMonthly = data.length > 0 && data[0].date.length <= 7

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-navy mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => isMonthly ? v.slice(5) : v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
          <Line type="monotone" dataKey="revenue" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3, fill: '#1e3a5f' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Add Expense Donut chart and Payment Bar chart to OverviewTab**

In the OverviewTab, find the grid with the two cards (lines 330-377) and update the first card to use a Recharts PieChart:

Replace the Payment Breakdown card (between lines 331-354):
```tsx
<div className="bg-white rounded-xl border border-border p-5">
  <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
    <CreditCard className="h-4 w-4 text-muted-foreground" />
    Payment Breakdown
  </h3>
  <div className="flex items-center gap-4">
    <ResponsiveContainer width={140} height={140}>
      <PieChart>
        <Pie
          data={[
            { name: 'Cash', value: data.paymentBreakdown?.cash || 0 },
            { name: 'Card', value: data.paymentBreakdown?.card || 0 },
            { name: 'Split', value: data.paymentBreakdown?.split || 0 },
            { name: 'Bank Transfer', value: data.paymentBreakdown?.bank_transfer || 0 },
            { name: 'InstaPay', value: data.paymentBreakdown?.instapay || 0 },
            { name: 'Wallet', value: data.paymentBreakdown?.wallet || 0 },
          ].filter(d => d.value > 0)}
          cx="50%" cy="50%" innerRadius={35} outerRadius={60}
          dataKey="value"
        >
          {CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
      </PieChart>
    </ResponsiveContainer>
    <div className="space-y-1.5 flex-1">
      {[
        { key: 'cash', label: 'Cash', color: '#10b981' },
        { key: 'card', label: 'Card', color: '#3b82f6' },
        { key: 'split', label: 'Split', color: '#8b5cf6' },
        { key: 'bank_transfer', label: 'Bank Transfer', color: '#f59e0b' },
        { key: 'instapay', label: 'InstaPay', color: '#06b6d4' },
        { key: 'wallet', label: 'Wallet', color: '#ec4899' },
      ].map(({ key, label, color }) => (
        <div key={key} className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
          <span className="font-medium text-navy">{formatCurrency(data.paymentBreakdown?.[key] || 0)}</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

Replace the Branch Revenue card (between lines 355-377) to use a Recharts BarChart:
```tsx
<div className="bg-white rounded-xl border border-border p-5">
  <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
    <Building2 className="h-4 w-4 text-muted-foreground" />
    Branch Revenue
  </h3>
  {Object.entries(data.branchRevenue || {}).length === 0 ? (
    <p className="text-sm text-muted-foreground">No data for this period</p>
  ) : (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={Object.entries(data.branchRevenue || {}).map(([name, amount]) => ({ name, revenue: amount }))}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey="revenue" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )}
</div>
```

Also remove the `MiniBar` component (lines 17-24) since it's no longer used after the Recharts conversion. Also remove unused imports (`CalendarDays`, `RefreshCw` if they were there).

- [ ] **Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat: replace inline SVG charts with Recharts (line, pie, bar)"
```

---

### Task 11: Create AR/AP Aging API Route

**Files:**
- Create: `src/app/api/admin/accounting/aging/route.ts`

- [ ] **Create the aging route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

function getAgeBucket(days: number): string {
  if (days <= 30) return '0-30'
  if (days <= 60) return '31-60'
  if (days <= 90) return '61-90'
  return '90+'
}

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const now = new Date()
    const sp = req.nextUrl.searchParams
    const asOfParam = sp.get('asOf') || now.toISOString().slice(0, 10)
    const asOf = new Date(asOfParam)
    asOf.setHours(23, 59, 59, 999)

    // AR: unpaid paid orders that are not reconciled
    const arOrders = await db.order.findMany({
      where: {
        paymentStatus: 'paid',
        reconciledAt: null,
        createdAt: { lte: asOf },
        status: { not: 'cancelled' },
      },
      select: {
        id: true,
        orderNumber: true,
        receiptNumber: true,
        fullName: true,
        totalAmount: true,
        createdAt: true,
        paymentVerifiedAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const arBuckets: Record<string, { count: number; total: number; orders: any[] }> = {
      '0-30': { count: 0, total: 0, orders: [] },
      '31-60': { count: 0, total: 0, orders: [] },
      '61-90': { count: 0, total: 0, orders: [] },
      '90+': { count: 0, total: 0, orders: [] },
    }

    for (const order of arOrders) {
      const refDate = order.paymentVerifiedAt || order.createdAt
      const days = Math.floor((asOf.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24))
      const bucket = getAgeBucket(days)
      if (arBuckets[bucket]) {
        arBuckets[bucket].count++
        arBuckets[bucket].total += order.totalAmount
        if (arBuckets[bucket].orders.length < 10) {
          arBuckets[bucket].orders.push({
            id: order.id,
            orderNumber: order.orderNumber,
            receiptNumber: order.receiptNumber,
            customer: order.fullName,
            amount: order.totalAmount,
            date: order.createdAt,
            days,
          })
        }
      }
    }

    const totalAR = arOrders.reduce((s, o) => s + o.totalAmount, 0)

    // AP: journal entries with credit to AP account (2000) not offset by debits
    const apAccount = await db.account.findUnique({ where: { code: '2000' } })

    let apBuckets: Record<string, { count: number; total: number; items: any[] }> | null = null
    let totalAP = 0

    if (apAccount) {
      const apLines = await db.journalLine.findMany({
        where: {
          accountId: apAccount.id,
          credit: { gt: 0 },
          entry: { date: { lte: asOf } },
        },
        include: {
          entry: { select: { date: true, description: true, reference: true } },
        },
        orderBy: { entry: { date: 'asc' } },
      })

      // For each AP credit, check if there's a corresponding debit to AP
      const apEntries = []
      for (const line of apLines) {
        const offsetDebit = await db.journalLine.findFirst({
          where: {
            accountId: apAccount.id,
            debit: { gt: 0 },
            entryId: line.entryId,
          },
        })
        if (!offsetDebit) {
          apEntries.push(line)
        }
      }

      apBuckets = {
        '0-30': { count: 0, total: 0, items: [] },
        '31-60': { count: 0, total: 0, items: [] },
        '61-90': { count: 0, total: 0, items: [] },
        '90+': { count: 0, total: 0, items: [] },
      }

      for (const line of apEntries) {
        const days = Math.floor((asOf.getTime() - line.entry.date.getTime()) / (1000 * 60 * 60 * 24))
        const bucket = getAgeBucket(days)
        if (apBuckets[bucket]) {
          apBuckets[bucket].count++
          apBuckets[bucket].total += line.credit
          if (apBuckets[bucket].items.length < 10) {
            apBuckets[bucket].items.push({
              description: line.entry.description,
              reference: line.entry.reference,
              amount: line.credit,
              date: line.entry.date,
              days,
            })
          }
        }
      }

      totalAP = apEntries.reduce((s, l) => s + l.credit, 0)
    }

    return NextResponse.json({
      asOfDate: asOf.toISOString(),
      accountsReceivable: {
        buckets: arBuckets,
        total: totalAR,
      },
      accountsPayable: {
        buckets: apBuckets,
        total: totalAP,
      },
    })
  } catch (e) {
    console.error('Aging GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch aging' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/aging/route.ts
git commit -m "feat: add AR/AP aging API route"
```

---

### Task 12: Create AgingTab Component

**Files:**
- Create: `src/app/admin/accounting/AgingTab.tsx`

- [ ] **Create AgingTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Clock, AlertTriangle } from 'lucide-react'
import { formatCurrency } from './page'

const bucketColors: Record<string, string> = {
  '0-30': 'bg-green-100 text-green-700 border-green-200',
  '31-60': 'bg-amber-100 text-amber-700 border-amber-200',
  '61-90': 'bg-orange-100 text-orange-700 border-orange-200',
  '90+': 'bg-red-100 text-red-700 border-red-200',
}

function BucketTable({ title, buckets, total, type }: { title: string; buckets: Record<string, { count: number; total: number; orders?: any[]; items?: any[] }>; total: number; type: 'ar' | 'ap' }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className={`px-4 py-3 ${type === 'ar' ? 'bg-blue-50' : 'bg-amber-50'} border-b border-border`}>
        <h3 className="font-semibold text-navy">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3 font-medium">Bucket</th>
            <th className="p-3 font-medium text-right">Count</th>
            <th className="p-3 font-medium text-right">Total</th>
            <th className="p-3 font-medium">Sample Items</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(buckets).map(([bucket, data]) => (
            <tr key={bucket} className="border-b border-border/50 hover:bg-gray-50">
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${bucketColors[bucket] || ''}`}>
                  {bucket} days
                </span>
              </td>
              <td className="p-3 text-right font-medium text-navy">{data.count}</td>
              <td className={`p-3 text-right font-semibold ${bucket === '90+' ? 'text-red-600' : 'text-navy'}`}>{formatCurrency(data.total)}</td>
              <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                {data.orders?.slice(0, 3).map((o: any) => `#${o.receiptNumber || o.orderNumber?.slice(0, 8)} (${o.days}d)`).join(', ') ||
                 data.items?.slice(0, 3).map((i: any) => `${i.description?.slice(0, 20)} (${i.days}d)`).join(', ') || '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold border-t-2 border-border">
            <td className="p-3 text-navy">Total {type === 'ar' ? 'AR' : 'AP'}</td>
            <td className="p-3 text-right">{Object.values(buckets).reduce((s, b) => s + b.count, 0)}</td>
            <td className="p-3 text-right text-navy">{formatCurrency(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function AgingTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))

  function fetchAging() {
    setLoading(true)
    fetch(`/api/admin/accounting/aging?asOf=${asOf}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load aging'); setLoading(false) })
  }

  useEffect(() => { fetchAging() }, [asOf])

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  function handleExportCSV() {
    const rows: Record<string, any>[] = []
    const arBuckets = data.accountsReceivable?.buckets || {}
    const apBuckets = data.accountsPayable?.buckets || {}
    for (const [bucket, bd] of Object.entries(arBuckets)) {
      rows.push({ Type: 'AR', Bucket: `${bucket} days`, Count: (bd as any).count, Total: (bd as any).total })
    }
    for (const [bucket, bd] of Object.entries(apBuckets)) {
      rows.push({ Type: 'AP', Bucket: `${bucket} days`, Count: (bd as any).count, Total: (bd as any).total })
    }
    const csv = ['Type,Bucket,Count,Total', ...rows.map(r => `"${r.Type}","${r.Bucket}",${r.Count},${r.Total}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aging-report.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of:</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          As of {new Date(data.asOfDate).toLocaleDateString()}
        </div>
      </div>

      {data.accountsReceivable?.total === 0 && data.accountsPayable?.total === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-amber-700 font-medium">No aging data available</p>
          <p className="text-sm text-amber-600 mt-1">AR/AP aging requires paid orders and AP journal entries.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <BucketTable title="Accounts Receivable" buckets={data.accountsReceivable?.buckets || {}} total={data.accountsReceivable?.total || 0} type="ar" />
          <BucketTable title="Accounts Payable" buckets={data.accountsPayable?.buckets || {}} total={data.accountsPayable?.total || 0} type="ap" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Total AR</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(data.accountsReceivable?.total || 0)}</p>
          <p className="text-xs opacity-60 mt-1">Unreconciled paid orders</p>
        </div>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Total AP</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(data.accountsPayable?.total || 0)}</p>
          <p className="text-xs opacity-60 mt-1">Unpaid supplier amounts</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/AgingTab.tsx
git commit -m "feat: add AR/AP Aging tab with bucket visualization"
```

---

### Task 13: Create Tax Report API Route

**Files:**
- Create: `src/app/api/admin/accounting/tax/route.ts`

- [ ] **Create the tax report route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const fromParam = sp.get('from')
    const toParam = sp.get('to')

    const siteSetting = await db.siteSetting.findUnique({ where: { key: 'tax_rate' } })
    const taxRate = siteSetting ? parseFloat(siteSetting.value) / 100 : 0.14

    let from: Date, to: Date
    if (fromParam) {
      from = new Date(fromParam)
      from.setHours(0, 0, 0, 0)
    } else {
      from = new Date(year, 0, 1, 0, 0, 0, 0)
    }
    if (toParam) {
      to = new Date(toParam)
      to.setHours(23, 59, 59, 999)
    } else {
      to = new Date(year, 11, 31, 23, 59, 59, 999)
    }

    const orders = await db.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        status: { not: 'cancelled' },
        paymentStatus: 'paid',
      },
      select: {
        id: true,
        totalAmount: true,
        subtotal: true,
        tax: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const monthly: Record<string, { taxable: number; exempt: number; taxCollected: number; count: number }> = {}
    let totalTaxable = 0
    let totalExempt = 0
    let totalTaxCollected = 0

    for (const order of orders) {
      const month = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`
      if (!monthly[month]) monthly[month] = { taxable: 0, exempt: 0, taxCollected: 0, count: 0 }

      const taxAmount = order.tax || 0
      const taxableAmount = order.subtotal || (order.totalAmount - taxAmount)
      const exemptAmount = 0 // all orders are taxable by default

      monthly[month].taxable += taxableAmount
      monthly[month].taxCollected += taxAmount
      monthly[month].count++
      totalTaxable += taxableAmount
      totalTaxCollected += taxAmount
    }

    totalExempt = totalTaxable > 0 ? 0 : totalTaxable

    const monthlyBreakdown = Object.entries(monthly)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))

    return NextResponse.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      taxRate,
      totalTaxable,
      totalExempt,
      totalTaxCollected,
      taxOwed: totalTaxCollected,
      monthlyBreakdown,
    })
  } catch (e) {
    console.error('Tax GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch tax report' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/tax/route.ts
git commit -m "feat: add tax report API route"
```

---

### Task 14: Create TaxTab Component

**Files:**
- Create: `src/app/admin/accounting/TaxTab.tsx`

- [ ] **Create TaxTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Percent, Landmark } from 'lucide-react'
import { formatCurrency } from './page'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

export default function TaxTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))

  function fetchTax() {
    setLoading(true)
    fetch(`/api/admin/accounting/tax?year=${year}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load tax report'); setLoading(false) })
  }

  useEffect(() => { fetchTax() }, [year])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  function handleExportCSV() {
    const rows = (data.monthlyBreakdown || []).map((m: any) => ({
      Month: m.month,
      'Taxable Sales': m.taxable,
      'Tax Collected': m.taxCollected,
      Orders: m.count,
    }))
    rows.push({ Month: 'Total', 'Taxable Sales': data.totalTaxable, 'Tax Collected': data.totalTaxCollected, Orders: rows.reduce((s: number, r: any) => s + r.Orders, 0) })
    const csv = ['Month,Taxable Sales,Tax Collected,Orders', ...rows.map(r => `"${r.Month}",${r['Taxable Sales']},${r['Tax Collected']},${r.Orders}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tax-report-${year}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tax Rate</p>
          <p className="text-2xl font-bold text-navy flex items-center gap-1"><Percent className="h-5 w-5" />{((data.taxRate || 0) * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Taxable Sales</p>
          <p className="text-2xl font-bold text-navy">{formatCurrency(data.totalTaxable)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tax Exempt</p>
          <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(data.totalExempt)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tax Owed</p>
          <p className="text-2xl font-bold text-amber-600 flex items-center gap-1"><Landmark className="h-5 w-5" />{formatCurrency(data.taxOwed)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Monthly Tax Breakdown</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="taxable" name="Taxable Sales" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="taxCollected" name="Tax Collected" fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Month</th>
              <th className="p-3 font-medium text-right">Orders</th>
              <th className="p-3 font-medium text-right">Taxable Sales</th>
              <th className="p-3 font-medium text-right">Tax Collected</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyBreakdown?.map((m: any) => (
              <tr key={m.month} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{m.month}</td>
                <td className="p-3 text-right text-muted-foreground">{m.count}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(m.taxable)}</td>
                <td className="p-3 text-right font-semibold text-amber-600">{formatCurrency(m.taxCollected)}</td>
              </tr>
            ))}
            {(!data.monthlyBreakdown || data.monthlyBreakdown.length === 0) && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No tax data for {year}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/TaxTab.tsx
git commit -m "feat: add Tax Report tab with monthly breakdown"
```

---

### Task 15: Create Budget API Routes (CRUD + Actual)

**Files:**
- Create: `src/app/api/admin/accounting/budgets/route.ts`
- Create: `src/app/api/admin/accounting/budgets/actual/route.ts`

- [ ] **Create the budgets CRUD route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = sp.get('month') ? parseInt(sp.get('month')!) : undefined

    const where: any = { year }
    if (month) where.month = month

    const budgets = await db.budget.findMany({
      where,
      orderBy: [{ month: 'asc' }, { accountCode: 'asc' }],
    })

    // Group by month
    const byMonth: Record<number, { month: number; budgets: typeof budgets; total: number }> = {}
    for (const b of budgets) {
      if (!byMonth[b.month]) byMonth[b.month] = { month: b.month, budgets: [], total: 0 }
      byMonth[b.month].budgets.push(b)
      byMonth[b.month].total += b.amount
    }

    return NextResponse.json({ budgets, byMonth: Object.values(byMonth).sort((a, b) => a.month - b.month) })
  } catch (e) {
    console.error('Budgets GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch budgets' }, { status: 500 })
  }
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const { accountCode, month, year, amount } = await req.json()
    if (!accountCode || !month || !year || amount === undefined) {
      return NextResponse.json({ error: 'accountCode, month, year, amount required' }, { status: 400 })
    }

    const budget = await db.budget.upsert({
      where: { accountCode_month_year: { accountCode, month, year } },
      update: { amount },
      create: { accountCode, month, year, amount },
    })

    return NextResponse.json({ budget })
  } catch (e) {
    console.error('Budgets POST error:', e)
    return NextResponse.json({ error: 'Failed to save budget' }, { status: 500 })
  }
}, 'accounting')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await db.budget.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Budgets DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete budget' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Create the budget vs actual route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  try {
    const sp = req.nextUrl.searchParams
    const year = parseInt(sp.get('year') || String(new Date().getFullYear()))
    const month = sp.get('month') ? parseInt(sp.get('month')!) : undefined

    const budgets = await db.budget.findMany({
      where: { year },
      orderBy: [{ month: 'asc' }, { accountCode: 'asc' }],
    })

    const accountCodes = [...new Set(budgets.map(b => b.accountCode))]
    const accounts = await db.account.findMany({
      where: { code: { in: accountCodes } },
      select: { id: true, code: true, name: true, type: true },
    })
    const accountMap = new Map(accounts.map(a => [a.code, a]))

    const byMonth: Record<string, { month: number; items: { accountCode: string; accountName: string; budgeted: number; actual: number; variance: number; variancePct: number }[]; totalBudgeted: number; totalActual: number }> = {}

    const months = month ? [month] : Array.from({ length: 12 }, (_, i) => i + 1)

    for (const m of months) {
      const monthBudgets = budgets.filter(b => b.month === m)
      if (monthBudgets.length === 0) continue

      const key = `${year}-${String(m).padStart(2, '0')}`
      const items: any[] = []
      let totalBudgeted = 0
      let totalActual = 0

      for (const b of monthBudgets) {
        const accountInfo = accountMap.get(b.accountCode)
        if (!accountInfo) continue

        const startDate = new Date(year, m - 1, 1, 0, 0, 0, 0)
        const endDate = new Date(year, m, 0, 23, 59, 59, 999)

        const lines = await db.journalLine.findMany({
          where: {
            accountId: accountInfo.id,
            entry: { date: { gte: startDate, lte: endDate } },
          },
          select: { debit: true, credit: true },
        })

        const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
        let actual = totalCredit - totalDebit
        if (accountInfo.type === 'expense') {
          actual = totalDebit - totalCredit
        }

        const variance = b.amount > 0 ? ((actual - b.amount) / b.amount) * 100 : 0

        items.push({
          accountCode: b.accountCode,
          accountName: accountInfo.name,
          budgeted: b.amount,
          actual,
          variance: actual - b.amount,
          variancePct: Math.round(variance * 100) / 100,
        })
        totalBudgeted += b.amount
        totalActual += actual
      }

      byMonth[key] = { month: m, items, totalBudgeted, totalActual }
    }

    const grandTotalBudgeted = Object.values(byMonth).reduce((s, m) => s + m.totalBudgeted, 0)
    const grandTotalActual = Object.values(byMonth).reduce((s, m) => s + m.totalActual, 0)

    return NextResponse.json({
      year,
      byMonth: Object.values(byMonth).sort((a, b) => a.month - b.month),
      grandTotalBudgeted,
      grandTotalActual,
      grandVariance: grandTotalActual - grandTotalBudgeted,
      grandVariancePct: grandTotalBudgeted > 0 ? Math.round(((grandTotalActual - grandTotalBudgeted) / grandTotalBudgeted) * 10000) / 100 : 0,
    })
  } catch (e) {
    console.error('Budget actual GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch budget vs actual' }, { status: 500 })
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/budgets/route.ts src/app/api/admin/accounting/budgets/actual/route.ts
git commit -m "feat: add budget CRUD and budget vs actual API routes"
```

---

### Task 16: Create BudgetTab Component

**Files:**
- Create: `src/app/admin/accounting/BudgetTab.tsx`

- [ ] **Create BudgetTab**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Plus, Trash2, X } from 'lucide-react'
import { formatCurrency } from './page'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BudgetTab() {
  const [budgets, setBudgets] = useState<any>(null)
  const [actual, setActual] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [showAdd, setShowAdd] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  const [newAccountCode, setNewAccountCode] = useState('')
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1))
  const [newAmount, setNewAmount] = useState('')

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/accounting/budgets?year=${year}`).then(r => r.json()),
      fetch(`/api/admin/accounting/budgets/actual?year=${year}`).then(r => r.json()),
      fetch('/api/admin/accounting/accounts').then(r => r.json()),
    ])
      .then(([b, a, accts]) => { setBudgets(b); setActual(a); setAccounts(accts.accounts || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load budget data'); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [year])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  async function handleSaveBudget() {
    if (!newAccountCode || !newMonth || !newAmount) { toast.error('All fields required'); return }
    try {
      const res = await fetch('/api/admin/accounting/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountCode: newAccountCode, month: parseInt(newMonth), year: parseInt(year), amount: parseFloat(newAmount) }),
      })
      if (res.ok) { toast.success('Budget saved'); setShowAdd(false); setNewAccountCode(''); setNewAmount(''); fetchData() }
      else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
  }

  async function handleDeleteBudget(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/budgets?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Budget deleted'); fetchData() }
      else toast.error('Failed to delete')
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>

  const chartData = actual?.byMonth?.map((m: any) => ({
    month: MONTHS[m.month - 1] || `M${m.month}`,
    Budgeted: m.totalBudgeted,
    Actual: m.totalActual,
  })) || []

  function handleExportCSV() {
    if (!actual?.byMonth) return
    const rows: Record<string, any>[] = []
    for (const m of actual.byMonth) {
      rows.push({ Month: MONTHS[m.month - 1], Budgeted: m.totalBudgeted, Actual: m.totalActual, Variance: m.totalActual - m.totalBudgeted })
    }
    rows.push({ Month: 'Total', Budgeted: actual.grandTotalBudgeted, Actual: actual.grandTotalActual, Variance: actual.grandVariance })
    const csv = ['Month,Budgeted,Actual,Variance', ...rows.map(r => `"${r.Month}",${r.Budgeted},${r.Actual},${r.Variance}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `budget-vs-actual-${year}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Budget
        </button>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> CSV
        </button>
        <button onClick={fetchData} className="px-4 py-1.5 bg-gray-100 text-navy rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Budgeted</p>
          <p className="text-2xl font-bold text-navy">{formatCurrency(actual?.grandTotalBudgeted || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Actual</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(actual?.grandTotalActual || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Variance</p>
          <p className={`text-2xl font-bold ${(actual?.grandVariance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(actual?.grandVariance || 0) >= 0 ? '+' : ''}{formatCurrency(actual?.grandVariance || 0)}
            <span className="text-sm ml-1">({(actual?.grandVariancePct || 0) >= 0 ? '+' : ''}{actual?.grandVariancePct || 0}%)</span>
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Budget vs Actual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Budgeted" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {actual?.byMonth?.map((monthData: any) => (
        <div key={monthData.month} className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-navy">{MONTHS[monthData.month - 1]} {year}</h3>
            <span className={`text-xs font-medium ${monthData.totalActual >= monthData.totalBudgeted ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthData.totalActual)} / {formatCurrency(monthData.totalBudgeted)}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Budgeted</th><th className="p-3 font-medium text-right">Actual</th><th className="p-3 font-medium text-right">Variance</th><th className="p-3 font-medium text-right">%</th></tr></thead>
            <tbody>
              {monthData.items.map((item: any) => (
                <tr key={item.accountCode} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{item.accountName}</td>
                  <td className="p-3 text-right text-muted-foreground">{formatCurrency(item.budgeted)}</td>
                  <td className="p-3 text-right font-medium text-navy">{formatCurrency(item.actual)}</td>
                  <td className={`p-3 text-right font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}</td>
                  <td className={`p-3 text-right text-xs font-medium ${item.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.variancePct >= 0 ? '+' : ''}{item.variancePct}%</td>
                </tr>
              ))}
              {monthData.items.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No budgets set for this month</td></tr>}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">Total</td>
                <td className="p-3 text-right text-navy">{formatCurrency(monthData.totalBudgeted)}</td>
                <td className="p-3 text-right text-blue-600">{formatCurrency(monthData.totalActual)}</td>
                <td className={`p-3 text-right ${monthData.totalActual - monthData.totalBudgeted >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthData.totalActual - monthData.totalBudgeted >= 0 ? '+' : ''}{formatCurrency(monthData.totalActual - monthData.totalBudgeted)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {(!actual?.byMonth || actual.byMonth.length === 0) && (
        <div className="bg-white rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
          No budgets set for {year}. Click "Add Budget" to get started.
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">Add Budget</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Account</label>
                <select value={newAccountCode} onChange={e => setNewAccountCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select account</option>
                  {accounts.map((a: any) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Month</label>
                <select value={newMonth} onChange={e => setNewMonth(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Budgeted Amount</label>
                <input type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-navy transition-colors">Cancel</button>
              <button onClick={handleSaveBudget} className="flex-1 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}

      {budgets?.byMonth?.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">All Budgets</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium">Month</th><th className="p-3 font-medium text-right">Amount</th><th className="p-3 font-medium">Actions</th></tr></thead>
            <tbody>
              {budgets.byMonth.flatMap((m: any) =>
                m.budgets.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{b.accountCode}</td>
                    <td className="p-3 text-muted-foreground">{MONTHS[b.month - 1]}</td>
                    <td className="p-3 text-right font-medium text-navy">{formatCurrency(b.amount)}</td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteBudget(b.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/BudgetTab.tsx
git commit -m "feat: add Budget vs Actual tab with CRUD and chart"
```

---

### Task 17: Wire Budget Data into Overview API

**Files:**
- Modify: `src/app/api/admin/accounting/overview/route.ts`

- [ ] **Add budget vs actual comparison to overview response**

In the overview route, after the `result` object is constructed (before line 196), add:

```ts
// Budget vs Actual
const budgetYear = start.getFullYear()
const budgetMonth = start.getMonth() + 1
const budgets = await db.budget.findMany({ where: { year: budgetYear, month: budgetMonth } })
let totalBudgeted = 0
let totalActual = 0
if (budgets.length > 0) {
  const accountCodes = budgets.map(b => b.accountCode)
  const budgetAccounts = await db.account.findMany({ where: { code: { in: accountCodes } }, select: { id: true, code: true, type: true } })
  const accountByCode = new Map(budgetAccounts.map(a => [a.code, a]))
  totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0)

  for (const b of budgets) {
    const acc = accountByCode.get(b.accountCode)
    if (!acc) continue
    const lines = await db.journalLine.findMany({
      where: {
        accountId: acc.id,
        entry: { date: { gte: start, lte: end } },
      },
      select: { debit: true, credit: true },
    })
    const debit = lines.reduce((s, l) => s + l.debit, 0)
    const credit = lines.reduce((s, l) => s + l.credit, 0)
    if (acc.type === 'expense') totalActual += debit - credit
    else totalActual += credit - debit
  }
}

result.budgetComparison = {
  budgeted: totalBudgeted,
  actual: totalActual,
  variance: totalActual - totalBudgeted,
  variancePct: totalBudgeted > 0 ? Math.round(((totalActual - totalBudgeted) / totalBudgeted) * 10000) / 100 : 0,
}
```

Also import the Budget model (no extra import needed - it's already `db.budget`).

- [ ] **Display budget comparison in OverviewTab stats**

In the OverviewTab, after the stat cards grid, add a budget comparison section:

```tsx
{data.budgetComparison && data.budgetComparison.budgeted > 0 && (
  <div className="bg-white rounded-xl border border-border p-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget vs Actual</p>
      <span className={`text-xs font-medium ${data.budgetComparison.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
        {data.budgetComparison.variance >= 0 ? '+' : ''}{data.budgetComparison.variancePct}%
      </span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-muted-foreground">Actual</span>
          <span className="font-medium text-navy">{formatCurrency(data.budgetComparison.actual)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((data.budgetComparison.actual / data.budgetComparison.budgeted) * 100, 100)}%` }} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Budget</p>
        <p className="text-sm font-medium text-navy">{formatCurrency(data.budgetComparison.budgeted)}</p>
      </div>
    </div>
  </div>
)}
```

This goes inside the OverviewTab JSX, after the stat cards grid.

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/overview/route.ts src/app/admin/accounting/page.tsx
git commit -m "feat: wire budget vs actual into overview API and display"
```

---

### Task 18: Create PDF Export Utility and Wire Export Buttons

**Files:**
- Create: `src/lib/pdf-export.ts`
- Modify: `src/app/admin/accounting/ProfitLossTab.tsx` — add PDF button
- Modify: `src/app/admin/accounting/BalanceSheetTab.tsx` — add PDF button
- Modify: `src/app/admin/accounting/TrialBalanceTab.tsx` — add PDF button

- [ ] **Create the PDF export utility**

```ts
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { SiteSetting } from '@prisma/client'

interface PdfOptions {
  title: string
  subtitle?: string
  columns: string[]
  rows: (string | number)[][]
  footers?: { label: string; value: string }[]
}

let companyInfo: { name: string; address?: string; phone?: string; email?: string } | null = null

async function loadCompanyInfo(): Promise<{ name: string; address?: string; phone?: string; email?: string }> {
  if (companyInfo) return companyInfo
  try {
    const res = await fetch('/api/admin/settings')
    if (res.ok) {
      const settings = await res.json()
      companyInfo = {
        name: settings.find((s: any) => s.key === 'site_name')?.value || 'Silver Sun Jewelry',
        address: settings.find((s: any) => s.key === 'site_address')?.value || '',
        phone: settings.find((s: any) => s.key === 'site_phone')?.value || '',
        email: settings.find((s: any) => s.key === 'site_email')?.value || '',
      }
    }
  } catch {}
  if (!companyInfo) companyInfo = { name: 'Silver Sun Jewelry' }
  return companyInfo
}

export async function generatePdf(opts: PdfOptions): Promise<void> {
  const info = await loadCompanyInfo()
  const doc = new jsPDF('p', 'mm', 'a4')

  const pageWidth = doc.internal.pageSize.getWidth()

  // Header
  doc.setFontSize(18)
  doc.setTextColor(30, 58, 95)
  doc.text(info.name, pageWidth / 2, 20, { align: 'center' })

  if (info.address) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(info.address, pageWidth / 2, 26, { align: 'center' })
  }

  if (info.phone || info.email) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text([info.phone || '', info.email || ''].filter(Boolean).join(' | '), pageWidth / 2, 31, { align: 'center' })
  }

  // Divider
  doc.setDrawColor(200, 200, 200)
  doc.line(14, 36, pageWidth - 14, 36)

  // Title
  doc.setFontSize(14)
  doc.setTextColor(30, 58, 95)
  doc.text(opts.title, 14, 44)

  if (opts.subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(opts.subtitle, 14, 50)
  }

  // Table
  const startY = opts.subtitle ? 55 : 50
  ;(doc as any).autoTable({
    head: [opts.columns],
    body: opts.rows,
    startY,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    footStyles: { fillColor: [240, 242, 245], fontStyle: 'bold' },
  })

  // Footers
  if (opts.footers && opts.footers.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(10)
    let fy = finalY
    for (const f of opts.footers) {
      doc.text(f.label, 14, fy)
      doc.setTextColor(30, 58, 95)
      doc.setFont('Helvetica', 'bold')
      doc.text(f.value, pageWidth - 14, fy, { align: 'right' })
      doc.setFont('Helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      fy += 7
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text(`Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' })
  }

  doc.save(`${opts.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}
```

- [ ] **Add PDF export button to ProfitLossTab**

In the button group, after the CSV button, add:
```tsx
import { generatePdf } from '@/lib/pdf-export'

// In the button bar:
<button
  onClick={async () => {
    const rows = [
      ...data.incomeItems.map((i: any) => ['Income', i.name, formatCurrency(i.balance)]),
      ...data.expenseItems.map((e: any) => ['Expense', e.name, formatCurrency(e.balance)]),
    ]
    await generatePdf({
      title: 'Profit & Loss Statement',
      subtitle: `${data.period === 'year' ? 'Year' : data.period} ending ${new Date(data.dateRange?.end).toLocaleDateString()}`,
      columns: ['Type', 'Account', 'Amount'],
      rows,
      footers: [
        { label: 'Total Income', value: formatCurrency(data.totalIncome) },
        { label: 'Total Expenses', value: formatCurrency(data.totalExpenses) },
        { label: `Net ${data.netProfit >= 0 ? 'Profit' : 'Loss'}`, value: formatCurrency(Math.abs(data.netProfit)) },
      ],
    })
  }}
  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
>
  <Download className="h-4 w-4" /> PDF
</button>
```

- [ ] **Add PDF export button to BalanceSheetTab**

Add import and button alongside CSV:
```tsx
<button
  onClick={async () => {
    const rows = []
    for (const [type, items] of Object.entries(data.groups || {})) {
      for (const item of items as any[]) {
        rows.push([type.charAt(0).toUpperCase() + type.slice(1), item.name, formatCurrency(item.balance)])
      }
    }
    await generatePdf({
      title: 'Balance Sheet',
      subtitle: `As of ${new Date(data.asOfDate).toLocaleDateString()}`,
      columns: ['Type', 'Account', 'Balance'],
      rows,
      footers: [
        { label: 'Total Assets', value: formatCurrency(data.totalAssets) },
        { label: 'Total Liabilities', value: formatCurrency(data.totalLiabilities) },
        { label: 'Total Equity', value: formatCurrency(data.totalEquity) },
      ],
    })
  }}
  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
>
  <Download className="h-4 w-4" /> PDF
</button>
```

- [ ] **Add PDF export button to TrialBalanceTab**

In `TrialBalanceTab.tsx`, add the import and a PDF export button in the UI:

```tsx
import { Download } from 'lucide-react'
import { generatePdf } from '@/lib/pdf-export'

// Add a button at the top of the returned JSX:
<div className="flex justify-end mb-4">
  <button
    onClick={async () => {
      const rows = data.accounts.map((acc: any) => [acc.code, acc.name, acc.type, formatCurrency(acc.totalDebit), formatCurrency(acc.totalCredit), formatCurrency(acc.balance)])
      await generatePdf({
        title: 'Trial Balance',
        columns: ['Code', 'Account', 'Type', 'Debit', 'Credit', 'Balance'],
        rows,
        footers: [
          { label: 'Grand Total Debit', value: formatCurrency(data.grandTotalDebit) },
          { label: 'Grand Total Credit', value: formatCurrency(data.grandTotalCredit) },
        ],
      })
    }}
    className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
  >
    <Download className="h-4 w-4" /> Export PDF
  </button>
</div>
```

- [ ] **Commit**

```bash
git add src/lib/pdf-export.ts src/app/admin/accounting/ProfitLossTab.tsx src/app/admin/accounting/BalanceSheetTab.tsx src/app/admin/accounting/TrialBalanceTab.tsx
git commit -m "feat: add client-side PDF export for P&L, Balance Sheet, Trial Balance"
```

---

### Task 19: Update page.tsx with All New Tabs

**Files:**
- Modify: `src/app/admin/accounting/page.tsx`

- [ ] **Add new tab imports and entries**

Add these imports at the top alongside existing imports:
```tsx
import ProfitLossTab from './ProfitLossTab'
import BalanceSheetTab from './BalanceSheetTab'
import AuditTab from './AuditTab'
import AgingTab from './AgingTab'
import TaxTab from './TaxTab'
import BudgetTab from './BudgetTab'
```

Update the tab bar array to include the new tabs:
```tsx
{(['overview', 'journal', 'accounts', 'trial-balance', 'pl', 'balance-sheet', 'aging', 'tax', 'budget', 'audit', 'orders', 'branches', 'expenses', 'reports'] as const).map(t => (
```

Update the tab render block in the ErrorBoundary:
```tsx
<ErrorBoundary>
  {tab === 'overview' && <OverviewTab data={overviewData} loading={overviewLoading} period={period} compareEnabled={false} customStart={customStart} customEnd={customEnd} />}
  {tab === 'journal' && <JournalTab />}
  {tab === 'accounts' && <AccountsTab />}
  {tab === 'trial-balance' && <TrialBalanceTab />}
  {tab === 'pl' && <ProfitLossTab />}
  {tab === 'balance-sheet' && <BalanceSheetTab />}
  {tab === 'aging' && <AgingTab />}
  {tab === 'tax' && <TaxTab />}
  {tab === 'budget' && <BudgetTab />}
  {tab === 'audit' && <AuditTab />}
  {tab === 'orders' && <OrdersTab />}
  {tab === 'branches' && <BranchesTab />}
  {tab === 'expenses' && <ExpensesTab refreshKey={refreshKey} />}
  {tab === 'reports' && <ReportsTab />}
</ErrorBoundary>
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/page.tsx
git commit -m "feat: add all deep-dive tabs to accounting page"
```

---

### Task 20: Build and Fix Issues

**Files:**
- All modified and new files

- [ ] **Build the project and fix any TypeScript errors**

```bash
cd C:\Users\obai\Desktop\website
npx prisma generate
npm run build
```

Fix any TypeScript errors that arise:
- Missing `React` imports in client components (if not using the automatic JSX transform)
- `AdminInfo` type imports in the audit logging changes
- Any incorrect path references

Common fixes needed:
- In the expense POST/DELETE handlers, you'll need to import `AdminInfo` from `@/lib/admin-permissions`
- The `ctx` parameter type should be `{ params: any; admin: AdminInfo }`
- In the reconcile route, ensure `ctx.admin` is accessed correctly (might need to destructure from the second argument)

- [ ] **Commit final fixes**

```bash
git add .
git commit -m "chore: fix build errors after accounting deep-dive changes"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- Task 3-4: P&L Statement ✓
- Task 5-6: Balance Sheet ✓
- Task 7-9: Audit Logging ✓
- Task 10: Charts (Recharts) ✓
- Task 11-12: AR/AP Aging ✓
- Task 13-14: Tax Reports ✓
- Task 15-16: Budget vs Actual ✓
- Task 17: Budget in overview ✓
- Task 18: PDF Export ✓
- Task 19: Tab integration ✓

**2. No placeholders** — all code is complete, no TODOs or TBDs.

**3. Type consistency** — all components use the same `formatCurrency` from `page.tsx`, all API routes use `withAdmin('accounting')`, all tabs follow the same `'use client'` + `useState/useEffect` pattern.
