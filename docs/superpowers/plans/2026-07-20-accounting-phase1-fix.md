# Accounting Phase 1 — Fix Core Bugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 known bugs (COD→AR, split payments, refunds, double-counting, error swallowing) and add type-safe error handling + validation + tests.

**Architecture:** Pure functions for validation + account resolution extracted from DB-calling functions so they're testable without mocking. `AccountingError` class for typed error propagation. Reconcile route reordered so journal entries come before `reconciledAt`.

**Tech Stack:** TypeScript, Vitest, Prisma (mocked in tests), Next.js API routes

---

### Task 1: AccountingError Class + Validation + Account Resolution Table

**Files:**
- Modify: `src/lib/accounting.ts:1-35`
- Test: `src/lib/accounting.test.ts`

- [ ] **Step 1: Add AccountingError class**

Edit `src/lib/accounting.ts` — add after the imports:

```typescript
export class AccountingError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_ACCOUNT' | 'UNBALANCED_ENTRY' | 'INVALID_AMOUNT' | 'DUPLICATE_ENTRY'
  ) {
    super(message)
    this.name = 'AccountingError'
  }
}
```

- [ ] **Step 2: Add `PAYMENT_METHOD_TO_ASSET` map and `getDebitAccount` helper**

Add after `ACCOUNTS`:

```typescript
const PAYMENT_METHOD_TO_ASSET: Record<string, string> = {
  cash: '1000',
  card: '1000',
  bank_transfer: '1100',
  instapay: '1000',
  wallet: '1000',
  cod: '1200',
}

function getDebitAccount(method: string): string {
  if (method === 'split') {
    throw new AccountingError('Split payments use cashAmount/cardAmount fields', 'INVALID_AMOUNT')
  }
  const account = PAYMENT_METHOD_TO_ASSET[method]
  if (!account) {
    throw new AccountingError(`Unknown payment method: ${method}`, 'INVALID_ACCOUNT')
  }
  return account
}
```

- [ ] **Step 3: Add `validateEntry` function**

Add after `getDebitAccount`:

```typescript
async function validateEntry(lines: { accountCode: string; debit?: number; credit?: number }[]) {
  for (const l of lines) {
    if ((l.debit ?? 0) < 0 || (l.credit ?? 0) < 0) {
      throw new AccountingError('Negative amounts not allowed', 'INVALID_AMOUNT')
    }
  }
  const totalDebit = lines.reduce((s, l) => s + (l.debit ?? 0), 0)
  const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0)
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    throw new AccountingError(
      `Unbalanced entry: debits (${totalDebit}) ≠ credits (${totalCredit})`,
      'UNBALANCED_ENTRY'
    )
  }
}
```

- [ ] **Step 4: Wire validation into `createJournalEntry`**

Edit `createJournalEntry` — add `await validateEntry(data.lines)` right after the `const lines` mapping:

```typescript
export async function createJournalEntry(data: {
  date: Date
  description: string
  reference?: string
  type: 'sale' | 'refund' | 'expense' | 'reconciliation' | 'opening'
  orderId?: string
  expenseId?: string
  lines: { accountCode: string; debit?: number; credit?: number }[]
}) {
  await validateEntry(data.lines)
  // ... rest unchanged
}
```

- [ ] **Step 5: Run existing tests to confirm nothing broke**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: "No test files found" (no test exists yet) — that's fine

### Task 2: Fix COD Sale + Refund Entries

**Files:**
- Modify: `src/lib/accounting.ts:72-112`
- Test: `src/lib/accounting.test.ts`

- [ ] **Step 1: Write test file skeleton with mocks**

Create `src/lib/accounting.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import {
  createSaleJournalEntry,
  createRefundJournalEntry,
  createJournalEntry,
  AccountingError,
} from './accounting'

const mockAccount = vi.fn()
const mockCreateEntry = vi.fn()

vi.mock('@/lib/db', () => ({
  db: {
    account: {
      findUnique: (args: any) => mockAccount(args),
    },
    journalEntry: {
      create: (args: any) => mockCreateEntry(args),
    },
  },
}))

const accounts: Record<string, { id: string; code: string }> = {
  '1000': { id: 'a-cash', code: '1000' },
  '1100': { id: 'a-bank', code: '1100' },
  '1200': { id: 'a-ar', code: '1200' },
  '4000': { id: 'a-rev', code: '4000' },
  '4100': { id: 'a-ret', code: '4100' },
  '5000': { id: 'a-cogs', code: '5000' },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAccount.mockImplementation(({ where: { code } }: { where: { code: string } }) =>
    Promise.resolve(accounts[code] ?? null)
  )
  mockCreateEntry.mockImplementation(({ data }: any) =>
    Promise.resolve({ id: 'entry-1', ...data, lines: { create: data.lines } })
  )
})
```

- [ ] **Step 2: Write failing test — COD sale debits AR**

Add to `accounting.test.ts`:

```typescript
describe('createSaleJournalEntry', () => {
  it('debits Accounts Receivable for COD orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-1',
      totalAmount: 500,
      paymentMethod: 'cod',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-ar')
    expect(debitLine.debit).toBe(500)
  })

  it('debits Cash for cash orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-2',
      totalAmount: 300,
      paymentMethod: 'cash',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-cash')
  })

  it('debits Bank for bank_transfer orders', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-3',
      totalAmount: 1000,
      paymentMethod: 'bank_transfer',
      cashAmount: null,
      cardAmount: null,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-bank')
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: Tests fail because `createSaleJournalEntry` still debits Cash for COD

- [ ] **Step 4: Update `createSaleJournalEntry` to use account table**

Replace the existing function:

```typescript
export async function createSaleJournalEntry(order: {
  id: string
  totalAmount: number
  cashAmount?: number | null
  cardAmount?: number | null
  paymentMethod: string
  createdAt: Date
}) {
  const debitAccount = getDebitAccount(order.paymentMethod)
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
```

- [ ] **Step 5: Run test to confirm it passes**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: All 3 tests pass

- [ ] **Step 6: Write failing test — COD refund credits AR**

```typescript
describe('createRefundJournalEntry', () => {
  it('credits Accounts Receivable for COD refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-1',
      refundedAmount: 200,
      paymentMethod: 'cod',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-ar')
    expect(creditLine.credit).toBe(200)
  })

  it('credits Cash for cash refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-2',
      refundedAmount: 100,
      paymentMethod: 'cash',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-cash')
  })
})
```

- [ ] **Step 7: Update `createRefundJournalEntry` to use account table**

Replace the existing function:

```typescript
export async function createRefundJournalEntry(order: {
  id: string
  refundedAmount: number
  paymentMethod: string
  createdAt: Date
}) {
  const creditAccount = getDebitAccount(order.paymentMethod)
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
```

- [ ] **Step 8: Run test to confirm it passes**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: All 5 tests pass

- [ ] **Step 9: Commit**

```bash
git add src/lib/accounting.ts src/lib/accounting.test.ts
git commit -m "fix(accounting): COD debits AR, refactor to account resolution table

- Add AccountingError class for typed error propagation
- Add PAYMENT_METHOD_TO_ASSET map for centralized account resolution
- Add validateEntry that checks debits=credits and positive amounts
- Fix createSaleJournalEntry: COD→AR(1200) instead of Cash(1000)
- Fix createRefundJournalEntry: use same account table
- Add unit tests with mocked Prisma"
```

### Task 3: Split Payment Support

**Files:**
- Modify: `src/lib/accounting.ts:72-92`
- Modify: `src/lib/accounting.test.ts`

- [ ] **Step 1: Write failing test — split payment creates 2 debit lines**

```typescript
describe('split payments', () => {
  it('creates debit lines for each payment method in a split', async () => {
    const entry = await createSaleJournalEntry({
      id: 'order-split',
      totalAmount: 1000,
      paymentMethod: 'split',
      cashAmount: 400,
      cardAmount: 600,
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLines = lines.filter((l: any) => l.debit > 0)
    expect(debitLines).toHaveLength(2)
    expect(debitLines[0].debit + debitLines[1].debit).toBe(1000)
  })

  it('rejects split without cashAmount and cardAmount', async () => {
    await expect(
      createSaleJournalEntry({
        id: 'order-bad-split',
        totalAmount: 1000,
        paymentMethod: 'split',
        cashAmount: null,
        cardAmount: null,
        createdAt: new Date(),
      })
    ).rejects.toThrow(AccountingError)
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: New tests fail

- [ ] **Step 3: Implement split payment handling in `createSaleJournalEntry`**

Replace the function:

```typescript
export async function createSaleJournalEntry(order: {
  id: string
  totalAmount: number
  cashAmount?: number | null
  cardAmount?: number | null
  paymentMethod: string
  createdAt: Date
}) {
  if (order.paymentMethod === 'split') {
    const hasCash = order.cashAmount != null && order.cashAmount > 0
    const hasCard = order.cardAmount != null && order.cardAmount > 0
    const splitTotal = (order.cashAmount ?? 0) + (order.cardAmount ?? 0)
    if (!hasCash && !hasCard) {
      throw new AccountingError('Split payment must specify cashAmount or cardAmount', 'INVALID_AMOUNT')
    }
    if (Math.abs(splitTotal - order.totalAmount) > 0.01) {
      throw new AccountingError(
        `Split amounts (${splitTotal}) do not match total (${order.totalAmount})`,
        'INVALID_AMOUNT'
      )
    }
    const lines: { accountCode: string; debit?: number; credit?: number }[] = []
    if (hasCash) lines.push({ accountCode: ACCOUNTS.cash, debit: order.cashAmount! })
    if (hasCard) lines.push({ accountCode: ACCOUNTS.cash, debit: order.cardAmount! })
    lines.push({ accountCode: ACCOUNTS.salesRevenue, credit: order.totalAmount })
    return createJournalEntry({
      date: order.createdAt,
      description: `Sale #${order.id.slice(0, 8)}`,
      reference: order.id,
      type: 'sale',
      orderId: order.id,
      lines,
    })
  }
  const debitAccount = getDebitAccount(order.paymentMethod)
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
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/accounting.ts src/lib/accounting.test.ts
git commit -m "feat(accounting): split payment support with validation

- createSaleJournalEntry handles paymentMethod=split
- Validates cashAmount + cardAmount == totalAmount
- Generates multi-line debit entries per payment method
- Throws AccountingError for invalid split data"
```

### Task 4: Expense Category Routing (B4)

**Files:**
- Modify: `src/lib/accounting.ts:114-135`

- [ ] **Step 1: Add expense keyword mapping**

Add after `getDebitAccount`:

```typescript
const EXPENSE_KEYWORDS: Record<string, string> = {
  salaries: '5100',
  rent: '5200',
  utilities: '5300',
  supplies: '5400',
}

function getExpenseAccount(description: string): string {
  const lower = description.toLowerCase()
  for (const [keyword, code] of Object.entries(EXPENSE_KEYWORDS)) {
    if (lower.includes(keyword)) return code
  }
  return ACCOUNTS.expenses.other
}
```

- [ ] **Step 2: Update `createExpenseJournalEntry`**

Replace the line `const debitAccount = ACCOUNTS.expenses.other`:

```typescript
export async function createExpenseJournalEntry(expense: {
  id: string
  amount: number
  paymentMethod: string
  description: string
  createdAt: Date
}) {
  const creditAccount = expense.paymentMethod === 'bank_transfer' ? ACCOUNTS.bank : ACCOUNTS.cash
  const debitAccount = getExpenseAccount(expense.description)

  return createJournalEntry({ ... })
}
```

- [ ] **Step 3: Write failing test**

Add to test file:

```typescript
describe('createExpenseJournalEntry', () => {
  it('routes salaries expense to salaries account', async () => {
    const { createExpenseJournalEntry } = await import('./accounting')
    const entry = await createExpenseJournalEntry({
      id: 'exp-1',
      amount: 5000,
      paymentMethod: 'cash',
      description: 'Monthly salaries for staff',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-cash') // expense debit accounts not in mock — skip for now
  })
})
```

Actually — expense account IDs (`5100`, `5200`, etc.) are NOT in the mock `accounts` map. The test would fail at account lookup. Let me adjust:

- [ ] **Step 2b: Add expense accounts to test mock**

Edit the `accounts` map in the test file — add after `'5000'`:

```typescript
  '5100': { id: 'a-salaries', code: '5100' },
  '5200': { id: 'a-rent', code: '5200' },
  '5300': { id: 'a-utils', code: '5300' },
  '5400': { id: 'a-supplies', code: '5400' },
  '5500': { id: 'a-other', code: '5500' },
```

- [ ] **Step 3: Write failing test (revised)**

```typescript
describe('createExpenseJournalEntry', () => {
  it('routes salaries expense to salaries account', async () => {
    const { createExpenseJournalEntry } = await import('./accounting')
    const entry = await createExpenseJournalEntry({
      id: 'exp-1',
      amount: 5000,
      paymentMethod: 'cash',
      description: 'Monthly salaries for staff',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-salaries')
  })

  it('routes rent expense to rent account', async () => {
    const { createExpenseJournalEntry } = await import('./accounting')
    const entry = await createExpenseJournalEntry({
      id: 'exp-2',
      amount: 2000,
      paymentMethod: 'bank_transfer',
      description: 'Office rent payment',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-rent')
  })

  it('falls back to other for unknown expense types', async () => {
    const { createExpenseJournalEntry } = await import('./accounting')
    const entry = await createExpenseJournalEntry({
      id: 'exp-3',
      amount: 500,
      paymentMethod: 'cash',
      description: 'Miscellaneous purchase',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const debitLine = lines.find((l: any) => l.debit > 0)
    expect(debitLine.accountId).toBe('a-other')
  })
})
```

- [ ] **Step 4: Run test to confirm it passes**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: All tests pass (or latest fail until step 2 is done — but we already did step 2)

Note: `createExpenseJournalEntry` is already exported from `accounting.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/accounting.ts src/lib/accounting.test.ts
git commit -m "feat(accounting): expense keyword routing instead of all-other

- Add EXPENSE_KEYWORDS map with salaries/rent/utilities/supplies
- Add getExpenseAccount helper for keyword matching
- Update createExpenseJournalEntry to use routed accounts
- Fall back to other (5500) for unmatched descriptions"
```

### Task 5: Fix Reconcile Route

**Files:**
- Modify: `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts`

- [ ] **Step 1: Read current reconcile route**

Already read — 42 lines. Key problems:
1. `reconciledAt` set BEFORE journal entries (line 13-16)
2. For `bank_transfer`: creates BOTH sale entry AND reconciliation entry — double-counts Bank
3. For COD: only creates sale entry (debits AR), never creates collection entry
4. All errors silently caught in `try/catch`

- [ ] **Step 2: Rewrite reconcile route**

Replace the entire file:

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin, AdminInfo } from '@/lib/admin-permissions'
import {
  createSaleJournalEntry,
  createReconciliationJournalEntry,
  AccountingError,
} from '@/lib/accounting'
import { logAudit } from '@/lib/audit'

export const POST = withAdmin(async (req: Request, { params, admin }: { params: Promise<{ id: string }>; admin: AdminInfo }) => {
  const { id } = await params
  const order = await db.order.findUnique({ where: { id } })
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  try {
    if (order.paymentMethod === 'bank_transfer') {
      await createSaleJournalEntry({
        ...order,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
      })
    } else if (order.paymentMethod === 'cod') {
      await createSaleJournalEntry({
        ...order,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
      })
      await createReconciliationJournalEntry(order)
    } else {
      await createSaleJournalEntry({
        ...order,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        cashAmount: null,
        cardAmount: null,
      })
    }

    const updated = await db.order.update({
      where: { id },
      data: { reconciledAt: new Date() },
    })

    try {
      await logAudit({
        adminId: admin.id,
        action: 'reconcile',
        resource: 'order',
        resourceId: id,
        details: { orderNumber: updated.orderNumber, totalAmount: updated.totalAmount },
      })
    } catch {}

    return NextResponse.json({ ok: true, order: updated })
  } catch (e) {
    const message = e instanceof AccountingError ? e.message : 'Failed to reconcile order'
    return NextResponse.json({ error: message }, { status: e instanceof AccountingError ? 400 : 500 })
  }
}, 'accounting')
```

Key changes:
1. Journal entries created BEFORE `reconciledAt` update
2. `bank_transfer`: only creates sale entry (no duplicate reconciliation entry)
3. `cod`: creates sale entry (Dr AR, Cr Revenue) THEN reconciliation entry (Dr Cash, Cr AR)
4. All other methods: single sale entry as before
5. `AccountingError` propagates with 400 status; other errors with 500
6. Audit log still wrapped in try/catch (non-critical)

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/accounting/orders/\[id\]/reconcile/route.ts
git commit -m "fix(accounting): reconcile route journal-before-status, fix double-count

- Create journal entries BEFORE marking reconciledAt
- bank_transfer: only create sale entry, not duplicate reconciliation entry
- COD: create sale entry (Dr AR, Cr Revenue) + collection entry (Dr Cash, Cr AR)
- Propagate AccountingError with 400 status instead of silent catch"
```

### Task 6: Validation + Edge Case Tests

**Files:**
- Modify: `src/lib/accounting.test.ts`

- [ ] **Step 1: Write validation tests**

Add to `accounting.test.ts`:

```typescript
describe('createJournalEntry validation', () => {
  it('rejects unbalanced entries', async () => {
    await expect(
      createJournalEntry({
        date: new Date(),
        description: 'Test',
        type: 'sale',
        lines: [
          { accountCode: '1000', debit: 100 },
          { accountCode: '4000', credit: 99 },
        ],
      })
    ).rejects.toThrow(AccountingError)
  })

  it('rejects negative amounts', async () => {
    await expect(
      createJournalEntry({
        date: new Date(),
        description: 'Test',
        type: 'sale',
        lines: [
          { accountCode: '1000', debit: -50 },
          { accountCode: '4000', credit: -50 },
        ],
      })
    ).rejects.toThrow(AccountingError)
  })

  it('accepts valid balanced entry', async () => {
    const entry = await createJournalEntry({
      date: new Date(),
      description: 'Test',
      type: 'sale',
      lines: [
        { accountCode: '1000', debit: 100 },
        { accountCode: '4000', credit: 100 },
      ],
    })
    expect(entry.id).toBe('entry-1')
  })
})

describe('createSaleJournalEntry edge cases', () => {
  it('rejects unknown payment method', async () => {
    await expect(
      createSaleJournalEntry({
        id: 'order-bad',
        totalAmount: 100,
        paymentMethod: 'bitcoin',
        cashAmount: null,
        cardAmount: null,
        createdAt: new Date(),
      })
    ).rejects.toThrow(AccountingError)
  })

  it('handles instapay and wallet payment methods', async () => {
    for (const method of ['instapay', 'wallet']) {
      mockCreateEntry.mockClear()
      mockAccount.mockClear()
      const entry = await createSaleJournalEntry({
        id: `order-${method}`,
        totalAmount: 100,
        paymentMethod: method,
        cashAmount: null,
        cardAmount: null,
        createdAt: new Date(),
      })
      const lines = entry.lines.create
      const debitLine = lines.find((l: any) => l.debit > 0)
      expect(debitLine.accountId).toBe('a-cash')
    }
  })
})

describe('createRefundJournalEntry edge cases', () => {
  it('credits Bank for bank_transfer refunds', async () => {
    const entry = await createRefundJournalEntry({
      id: 'order-bt',
      refundedAmount: 150,
      paymentMethod: 'bank_transfer',
      createdAt: new Date(),
    })
    const lines = entry.lines.create
    const creditLine = lines.find((l: any) => l.credit > 0)
    expect(creditLine.accountId).toBe('a-bank')
  })
})
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run src/lib/accounting.test.ts`
Expected: All tests pass

- [ ] **Step 3: Commit**

```bash
git add src/lib/accounting.test.ts
git commit -m "test(accounting): validation, edge cases, all payment methods

- Unbalanced entry rejected
- Negative amounts rejected
- Valid entry accepted
- Unknown payment method rejected
- instapay/wallet map to Cash
- bank_transfer refund credits Bank"
```

### Task 7: Final Verification

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass (including existing tests)

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Push**

```bash
git push
```
