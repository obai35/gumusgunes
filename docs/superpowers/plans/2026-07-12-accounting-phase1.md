# Accounting Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add double-entry bookkeeping foundation: chart of accounts, auto-generated journal entries from orders/expenses, general ledger view, and trial balance.

**Architecture:** Three new Prisma models (Account, JournalEntry, JournalLine); a lib module for journal generation logic; new API routes for accounts, journal, trial-balance; modifications to existing expense/order routes to auto-create journal entries; four new UI tabs.

**Tech Stack:** Next.js 16, Prisma ORM, PostgreSQL (Neon), React, Tailwind

---

### Task 1: Add Prisma Models

**Files:**
- Modify: `prisma/schema.prisma` — add Account, JournalEntry, JournalLine models

- [ ] **Add models to schema.prisma**

Insert before the closing `}` of the schema file (before `enum` blocks):

```prisma
model Account {
  id        String   @id @default(cuid())
  code      String   @unique
  name      String
  nameAr    String?
  type      String   // asset, liability, equity, income, expense
  parentId  String?
  parent    Account?  @relation("AccountHierarchy", fields: [parentId], references: [id])
  children  Account[] @relation("AccountHierarchy")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  journalLines JournalLine[]
}

model JournalEntry {
  id          String        @id @default(cuid())
  date        DateTime      @default(now())
  description String
  reference   String?
  type        String        // sale, refund, expense, reconciliation, opening
  orderId     String?
  expenseId   String?
  createdAt   DateTime      @default(now())
  lines       JournalLine[]
}

model JournalLine {
  id        String       @id @default(cuid())
  entryId   String
  accountId String
  debit     Float        @default(0)
  credit    Float        @default(0)
  entry     JournalEntry @relation(fields: [entryId], references: [id], onDelete: Cascade)
  account   Account      @relation(fields: [accountId], references: [id])
}
```

- [ ] **Run Prisma migrate**

```bash
cd C:\Users\obai\Desktop\website
npx prisma migrate dev --name add-accounting-models
```

- [ ] **Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Account, JournalEntry, JournalLine models"
```

---

### Task 2: Seed Chart of Accounts

**Files:**
- Create: `prisma/seed-accounts.ts`

- [ ] **Create seed script**

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const accounts = [
  // Assets
  { code: '1000', name: 'Cash', nameAr: 'نقدي', type: 'asset' },
  { code: '1100', name: 'Bank', nameAr: 'بنك', type: 'asset' },
  { code: '1200', name: 'Accounts Receivable', nameAr: 'حسابات مدينة', type: 'asset' },
  { code: '1300', name: 'Inventory', nameAr: 'المخزون', type: 'asset' },
  // Liabilities
  { code: '2000', name: 'Accounts Payable', nameAr: 'حسابات دائنة', type: 'liability' },
  { code: '2100', name: 'Sales Tax Payable', nameAr: 'ضريبة المبيعات المستحقة', type: 'liability' },
  // Equity
  { code: '3000', name: "Owner's Equity", nameAr: 'حقوق الملكية', type: 'equity' },
  { code: '3100', name: 'Retained Earnings', nameAr: 'الأرباح المحتجزة', type: 'equity' },
  // Income
  { code: '4000', name: 'Sales Revenue', nameAr: 'إيرادات المبيعات', type: 'income' },
  { code: '4100', name: 'Sales Returns & Allowances', nameAr: 'مرتجعات المبيعات', type: 'income' },
  // Expenses
  { code: '5000', name: 'Cost of Goods Sold', nameAr: 'تكلفة البضاعة المباعة', type: 'expense' },
  { code: '5100', name: 'Salaries & Wages', nameAr: 'الرواتب والأجور', type: 'expense' },
  { code: '5200', name: 'Rent', nameAr: 'الإيجار', type: 'expense' },
  { code: '5300', name: 'Utilities', nameAr: 'المرافق', type: 'expense' },
  { code: '5400', name: 'Supplies', nameAr: 'المستلزمات', type: 'expense' },
  { code: '5500', name: 'Other Expenses', nameAr: 'مصروفات أخرى', type: 'expense' },
]

async function main() {
  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { code: acc.code },
      update: { name: acc.name, nameAr: acc.nameAr, type: acc.type },
      create: acc,
    })
  }
  console.log(`Seeded ${accounts.length} accounts`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Run the seed**

```bash
cd C:\Users\obai\Desktop\website
npx tsx prisma/seed-accounts.ts
```

- [ ] **Commit**

```bash
git add prisma/seed-accounts.ts
git commit -m "feat: seed standard chart of accounts"
```

---

### Task 3: Accounting Lib — Journal Entry Generation

**Files:**
- Create: `src/lib/accounting.ts`

- [ ] **Create journal generation helpers**

```ts
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

type AccountCodes = {
  cash: string
  bank: string
  ar: string
  inventory: string
  salesRevenue: string
  salesReturns: string
  cogs: string
  expenses: Record<string, string>
}

const ACCOUNTS: AccountCodes = {
  cash: '1000',
  bank: '1100',
  ar: '1200',
  inventory: '1300',
  salesRevenue: '4000',
  salesReturns: '4100',
  cogs: '5000',
  expenses: {
    salaries: '5100',
    rent: '5200',
    utilities: '5300',
    supplies: '5400',
    other: '5500',
  },
}

async function getAccountId(code: string): Promise<string> {
  const account = await db.account.findUnique({ where: { code } })
  if (!account) throw new Error(`Account not found: ${code}`)
  return account.id
}

export async function createJournalEntry(data: {
  date: Date
  description: string
  reference?: string
  type: 'sale' | 'refund' | 'expense' | 'reconciliation' | 'opening'
  orderId?: string
  expenseId?: string
  lines: { accountCode: string; debit?: number; credit?: number }[]
}) {
  const accountIds = await Promise.all(data.lines.map(l => getAccountId(l.accountCode)))
  const lines = data.lines.map((l, i) => ({
    accountId: accountIds[i],
    debit: l.debit || 0,
    credit: l.credit || 0,
  }))

  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)

  const entry = await db.journalEntry.create({
    data: {
      date: data.date,
      description: data.description,
      reference: data.reference,
      type: data.type,
      orderId: data.orderId,
      expenseId: data.expenseId,
      lines: { create: lines },
    },
    include: { lines: { include: { account: true } } },
  })

  return entry
}

export async function createSaleJournalEntry(order: {
  id: string
  totalAmount: number
  cashAmount?: number | null
  cardAmount?: number | null
  paymentMethod: string
  createdAt: Date
}) {
  const debitAccount = order.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  return createJournalEntry({
    date: order.createdAt,
    description: `Sale #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'sale',
    orderId: order.id,
    lines: [
      { accountCode: debitAccount, debit: order.totalAmount },
      { accountCode: ACCOUNTS.salesRevenue, credit: order.totalAmount },
    ],
  })
}

export async function createRefundJournalEntry(order: {
  id: string
  refundedAmount: number
  paymentMethod: string
  createdAt: Date
}) {
  const creditAccount = order.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  return createJournalEntry({
    date: order.createdAt,
    description: `Refund for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'refund',
    orderId: order.id,
    lines: [
      { accountCode: ACCOUNTS.salesReturns, debit: order.refundedAmount },
      { accountCode: creditAccount, credit: order.refundedAmount },
    ],
  })
}

export async function createExpenseJournalEntry(expense: {
  id: string
  amount: number
  paymentMethod: string
  description: string
  createdAt: Date
}) {
  const creditAccount = expense.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  const debitAccount = ACCOUNTS.expenses.other

  return createJournalEntry({
    date: expense.createdAt,
    description: expense.description,
    reference: expense.id,
    type: 'expense',
    expenseId: expense.id,
    lines: [
      { accountCode: debitAccount, debit: expense.amount },
      { accountCode: creditAccount, credit: expense.amount },
    ],
  })
}
```

- [ ] **Commit**

```bash
git add src/lib/accounting.ts
git commit -m "feat: journal entry generation helpers"
```

---

### Task 4: Auto-Generate Journal on Expense Creation

**Files:**
- Modify: `src/app/api/admin/accounting/expenses/route.ts`

- [ ] **Add journal entry creation after expense is created**

In the POST handler, after `prisma.expense.create`, add:

```ts
import { createExpenseJournalEntry } from '@/lib/accounting'

// Inside POST handler, after the expense is created:
try {
  await createExpenseJournalEntry(created)
} catch (journalErr) {
  console.error('Failed to create journal entry for expense:', journalErr)
}
```

Full POST handler after modification:

```ts
export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    // ... validation ...
    const created = await prisma.expense.create({ data: { ... } })
    try {
      await createExpenseJournalEntry(created)
    } catch (journalErr) {
      console.error('Failed to create journal entry for expense:', journalErr)
    }
    return NextResponse.json({ ok: true, expense: created })
  } catch (err) {
    return handleApiError(err, 'accounting-expenses-create')
  }
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/expenses/route.ts
git commit -m "feat: auto-generate journal entries on expense creation"
```

---

### Task 5: Auto-Generate Journal on Order Paid/Reconciled

**Files:**
- Modify: `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts`
- Modify: `src/lib/accounting.ts` — add reconciliation journal helper

- [ ] **Add reconciliation journal helper to accounting.ts**

```ts
export async function createReconciliationJournalEntry(order: {
  id: string
  totalAmount: number
  createdAt: Date
}) {
  return createJournalEntry({
    date: new Date(),
    description: `Payment reconciled for #${order.id.slice(0, 8)}`,
    reference: order.id,
    type: 'reconciliation',
    orderId: order.id,
    lines: [
      { accountCode: ACCOUNTS.bank, debit: order.totalAmount },
      { accountCode: ACCOUNTS.ar, credit: order.totalAmount },
    ],
  })
}
```

- [ ] **Modify reconcile route to create journal entry**

In `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts`, after `prisma.order.update`, add:

```ts
import { createSaleJournalEntry, createReconciliationJournalEntry } from '@/lib/accounting'

// After setting reconciledAt:
if (order.paymentMethod === 'bank_transfer') {
  try {
    await createSaleJournalEntry({ ...order, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod, cashAmount: null, cardAmount: null })
    await createReconciliationJournalEntry(order)
  } catch (err) {
    console.error('Failed to create journal entry for reconciliation:', err)
  }
} else {
  try {
    await createSaleJournalEntry({ ...order, totalAmount: order.totalAmount, paymentMethod: order.paymentMethod, cashAmount: null, cardAmount: null })
  } catch (err) {
    console.error('Failed to create journal entry for sale:', err)
  }
}
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/orders/\[id\]/reconcile/route.ts src/lib/accounting.ts
git commit -m "feat: auto-generate journal entries on order reconcile"
```

---

### Task 6: Accounts API Route

**Files:**
- Create: `src/app/api/admin/accounting/accounts/route.ts`

- [ ] **Create GET account list with balances and POST create**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { z } from 'zod'

const AccountSchema = z.object({
  code: z.string().regex(/^\d{4}$/, 'Code must be 4 digits'),
  name: z.string().min(1),
  nameAr: z.string().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  parentId: z.string().optional(),
})

export const GET = withAdmin(async () => {
  const accounts = await db.account.findMany({
    orderBy: { code: 'asc' },
    include: {
      journalLines: {
        select: { debit: true, credit: true },
      },
    },
  })

  const accountsWithBalance = accounts.map((acc) => {
    const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
    let balance = totalDebit - totalCredit
    // For liability/equity/income accounts, credit is positive
    if (['liability', 'equity', 'income'].includes(acc.type)) {
      balance = totalCredit - totalDebit
    }
    const { journalLines, ...rest } = acc
    return { ...rest, balance }
  })

  return NextResponse.json({ accounts: accountsWithBalance })
}, 'accounting')

export const POST = withAdmin(async (req: NextRequest) => {
  const body = await req.json()
  const parsed = AccountSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const existing = await db.account.findUnique({ where: { code: parsed.data.code } })
  if (existing) return NextResponse.json({ error: 'Account code already exists' }, { status: 400 })
  const account = await db.account.create({ data: parsed.data })
  return NextResponse.json({ account })
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/accounts/route.ts
git commit -m "feat: accounts API route with balances"
```

---

### Task 7: Journal API Route

**Files:**
- Create: `src/app/api/admin/accounting/journal/route.ts`

- [ ] **Create GET journal entries with filters**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const type = searchParams.get('type')
  const accountId = searchParams.get('accountId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }
  if (type) where.type = type
  if (accountId) {
    where.lines = { some: { accountId } }
  }

  const [entries, total] = await Promise.all([
    db.journalEntry.findMany({
      where,
      include: {
        lines: { include: { account: true } },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.journalEntry.count({ where }),
  ])

  return NextResponse.json({ entries, total, page, totalPages: Math.ceil(total / limit) })
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/journal/route.ts
git commit -m "feat: journal entries API route with filters"
```

---

### Task 8: Trial Balance API Route

**Files:**
- Create: `src/app/api/admin/accounting/trial-balance/route.ts`

- [ ] **Create GET trial balance**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: any = {}
  if (from || to) {
    dateFilter.date = {}
    if (from) dateFilter.date.gte = new Date(from)
    if (to) dateFilter.date.lte = new Date(to)
  }

  const accounts = await db.account.findMany({
    orderBy: { code: 'asc' },
    include: {
      journalLines: {
        where: dateFilter.date ? { entry: dateFilter } : undefined,
        select: { debit: true, credit: true },
      },
    },
  })

  const lines = accounts.map((acc) => {
    const totalDebit = acc.journalLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = acc.journalLines.reduce((s, l) => s + l.credit, 0)
    let balance = totalDebit - totalCredit
    if (['liability', 'equity', 'income'].includes(acc.type)) {
      balance = totalCredit - totalDebit
    }
    const { journalLines, ...rest } = acc
    return { ...rest, totalDebit, totalCredit, balance }
  })

  const grandTotalDebit = lines.reduce((s, l) => s + l.totalDebit, 0)
  const grandTotalCredit = lines.reduce((s, l) => s + l.totalCredit, 0)

  return NextResponse.json({ accounts: lines, grandTotalDebit, grandTotalCredit })
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/trial-balance/route.ts
git commit -m "feat: trial balance API route"
```

---

### Task 9: Add Accounting Permission and Sync Endpoint

**Files:**
- Create: `src/app/api/admin/accounting/sync/route.ts`
- Modify: `src/lib/admin-permissions.ts` — if not already, add 'accounting' to ALL_PERMISSIONS

- [ ] **Check if 'accounting' is in ALL_PERMISSIONS**

Read `src/lib/admin-permissions.ts`. If `'accounting'` is not in the `ALL_PERMISSIONS` array, add it.

- [ ] **Create sync endpoint for retroactive journal generation**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'
import { createSaleJournalEntry, createExpenseJournalEntry } from '@/lib/accounting'

export const POST = withAdmin(async () => {
  const results = { orders: 0, expenses: 0, errors: 0 }

  // Sync orders that are paid but have no journal entry
  const orders = await db.order.findMany({
    where: {
      paymentStatus: 'paid',
      journalEntries: { none: { type: 'sale' } },
    },
  })
  for (const order of orders) {
    try {
      await createSaleJournalEntry(order)
      results.orders++
    } catch (err) {
      console.error(`Failed to create journal for order ${order.id}:`, err)
      results.errors++
    }
  }

  // Sync expenses that have no journal entry
  const expenses = await db.expense.findMany({
    where: {
      journalEntries: { none: { type: 'expense' } },
    },
  })
  for (const expense of expenses) {
    try {
      await createExpenseJournalEntry(expense)
      results.expenses++
    } catch (err) {
      console.error(`Failed to create journal for expense ${expense.id}:`, err)
      results.errors++
    }
  }

  return NextResponse.json({ ok: true, synced: results })
}, 'accounting')
```

- [ ] **Commit**

```bash
git add src/app/api/admin/accounting/sync/route.ts
git commit -m "feat: sync endpoint for retroactive journal entry generation"
```

---

### Task 10: Update Accounting Page UI — New Tabs

**Files:**
- Modify: `src/app/admin/accounting/page.tsx`

This is the largest UI task. Add three new tab components: JournalTab, AccountsTab (chart of accounts), TrialBalanceTab. The full page.tsx is ~1050 lines already — split into separate component files to keep it manageable.

- [ ] **Create `src/app/admin/accounting/JournalTab.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './page'  // extract formatCurrency or re-define

export default function JournalTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  function fetchJournal() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/admin/accounting/journal?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load journal'); setLoading(false) })
  }

  useEffect(() => { fetchJournal() }, [page, typeFilter])

  const typeColors: Record<string, string> = {
    sale: 'bg-green-100 text-green-700',
    refund: 'bg-red-100 text-red-700',
    expense: 'bg-orange-100 text-orange-700',
    reconciliation: 'bg-blue-100 text-blue-700',
    opening: 'bg-purple-100 text-purple-700',
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Types</option>
          <option value="sale">Sales</option>
          <option value="refund">Refunds</option>
          <option value="expense">Expenses</option>
          <option value="reconciliation">Reconciliations</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Reference</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Account</th>
                <th className="p-3 font-medium text-right">Debit</th>
                <th className="p-3 font-medium text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.entries || data.entries.length === 0) && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No journal entries yet</td></tr>
              )}
              {data?.entries?.map((entry: any) => (
                entry.lines.map((line: any, i: number) => (
                  <tr key={`${entry.id}-${i}`} className="border-b border-border/50 hover:bg-gray-50">
                    {i === 0 && (
                      <>
                        <td className="p-3 text-xs text-muted-foreground" rowSpan={entry.lines.length}>
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium text-navy" rowSpan={entry.lines.length}>
                          {entry.description}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground font-mono" rowSpan={entry.lines.length}>
                          {entry.reference ? `#${entry.reference.slice(0, 8)}` : '-'}
                        </td>
                        <td className="p-3" rowSpan={entry.lines.length}>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[entry.type] || ''}`}>{entry.type}</span>
                        </td>
                      </>
                    )}
                    <td className="p-3 text-muted-foreground">{line.account?.name || line.accountId}</td>
                    <td className="p-3 text-right font-medium text-green-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                    <td className="p-3 text-right font-medium text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Create `src/app/admin/accounting/AccountsTab.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './page'

const typeColors: Record<string, string> = {
  asset: 'text-green-600', liability: 'text-blue-600',
  equity: 'text-purple-600', income: 'text-emerald-600', expense: 'text-orange-600',
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounting/accounts')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load accounts'); setLoading(false) })
  }, [])

  const grouped = accounts.reduce((acc: any, a: any) => {
    if (!acc[a.type]) acc[a.type] = []
    acc[a.type].push(a)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div className="space-y-6">
      {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
        <div key={type} className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border">
            <h3 className="font-semibold text-navy capitalize">{type}s</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border">
                <th className="p-3 font-medium">Code</th>
                <th className="p-3 font-medium">Name</th>
                <th className="p-3 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(grouped[type] || []).map((acc: any) => (
                <tr key={acc.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 text-xs font-mono text-muted-foreground">{acc.code}</td>
                  <td className="p-3 font-medium text-navy">{acc.name}</td>
                  <td className={`p-3 text-right font-semibold ${typeColors[type]}`}>
                    {acc.balance >= 0 ? formatCurrency(acc.balance) : `(${formatCurrency(Math.abs(acc.balance))})`}
                  </td>
                </tr>
              ))}
              {(grouped[type] || []).length === 0 && (
                <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No accounts</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Create `src/app/admin/accounting/TrialBalanceTab.tsx`**

```tsx
'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './page'

export default function TrialBalanceTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounting/trial-balance')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load trial balance'); setLoading(false) })
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  const typeColors: Record<string, string> = {
    asset: 'text-green-600', liability: 'text-blue-600',
    equity: 'text-purple-600', income: 'text-emerald-600', expense: 'text-orange-600',
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">Code</th>
            <th className="p-3 font-medium">Account</th>
            <th className="p-3 font-medium">Type</th>
            <th className="p-3 font-medium text-right">Debit</th>
            <th className="p-3 font-medium text-right">Credit</th>
            <th className="p-3 font-medium text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {data?.accounts?.map((acc: any) => (
            <tr key={acc.id} className="border-b border-border/50 hover:bg-gray-50">
              <td className="p-3 text-xs font-mono text-muted-foreground">{acc.code}</td>
              <td className="p-3 font-medium text-navy">{acc.name}</td>
              <td className={`p-3 text-xs font-medium capitalize ${typeColors[acc.type]}`}>{acc.type}</td>
              <td className="p-3 text-right text-green-600">{acc.totalDebit > 0 ? formatCurrency(acc.totalDebit) : '-'}</td>
              <td className="p-3 text-right text-red-600">{acc.totalCredit > 0 ? formatCurrency(acc.totalCredit) : '-'}</td>
              <td className={`p-3 text-right font-semibold ${typeColors[acc.type]}`}>{formatCurrency(acc.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-navy border-t-2 border-border">
            <td colSpan={3} className="p-3 text-right">Totals</td>
            <td className="p-3 text-right text-green-600">{formatCurrency(data?.grandTotalDebit || 0)}</td>
            <td className="p-3 text-right text-red-600">{formatCurrency(data?.grandTotalCredit || 0)}</td>
            <td className="p-3 text-right" />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
```

- [ ] **Modify `page.tsx` — update tab navigation and add new imports**

Read the current `page.tsx`. Add the three new imports at the top:

```tsx
import JournalTab from './JournalTab'
import AccountsTab from './AccountsTab'
import TrialBalanceTab from './TrialBalanceTab'
```

Update the tab bar to include the new tabs:

```tsx
;(['dashboard', 'journal', 'accounts', 'trial-balance', 'orders', 'branches', 'expenses', 'reports'] as const).map(t => (
```

Update the tab render area:

```tsx
<ErrorBoundary>
  {tab === 'dashboard' && <OverviewTab ... />}
  {tab === 'journal' && <JournalTab />}
  {tab === 'accounts' && <AccountsTab />}
  {tab === 'trial-balance' && <TrialBalanceTab />}
  {tab === 'orders' && <OrdersTab />}
  {tab === 'branches' && <BranchesTab />}
  {tab === 'expenses' && <ExpensesTab ... />}
  {tab === 'reports' && <ReportsTab />}
</ErrorBoundary>
```

Make sure `formatCurrency` is exported from page.tsx or moved to a shared utility. If page.tsx doesn't export it, add `export` before the function:

```tsx
export function formatCurrency(v: number | undefined | null) { return v != null ? `E£${v.toFixed(2)}` : 'E£0.00' }
```

- [ ] **Commit**

```bash
git add src/app/admin/accounting/
git commit -m "feat: add Journal, Accounts, and Trial Balance tabs to accounting page"
```

---

### Task 11: Run Sync and Verify

- [ ] **Build the project**

```bash
cd C:\Users\obai\Desktop\website
npm run build
```

Fix any TypeScript errors.

- [ ] **Run the sync endpoint to retroactively create journal entries**

```bash
curl -X POST https://gumusgunes.vercel.app/api/admin/accounting/sync
```

Or via the admin panel's API tester.

- [ ] **Verify journal entries exist**

Check the journal endpoint returns entries.

- [ ] **Deploy to Vercel**

```bash
cd C:\Users\obai\Desktop\website
vercel deploy --prod
```
