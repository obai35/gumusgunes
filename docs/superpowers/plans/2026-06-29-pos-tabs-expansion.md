# POS Tabs Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Add Orders search, Records (manual orders + expenses), and Hall Sale tabs to the POS.

**Architecture:** Prisma schema additions → API routes → Frontend tab components → Integration into POS page orchestrator.

**Tech Stack:** Next.js 16 App Router, Prisma 6, SQLite, TypeScript, Tailwind CSS v4

---

### Task 1: Prisma schema — add Supplier, Expense models; modify Order and Shift

**Files:**
- Modify: `prisma/schema.prisma`

**Changes:**
1. Add Supplier model
2. Add Expense model
3. Add `bank_transfer`, `instapay`, `wallet` to Order.paymentMethod options (documentation only — SQLite doesn't enforce enum)
4. Add `totalBankTransfer`, `totalInstapay`, `totalWallet`, `totalExpenses` to Shift

```prisma
model Supplier {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  email     String?
  address   String?
  notes     String?
  createdAt DateTime  @default(now())
  expenses  Expense[]
}

model Expense {
  id            String    @id @default(cuid())
  shiftId       String
  shift         Shift     @relation(fields: [shiftId], references: [id])
  supplierId    String?
  supplier      Supplier? @relation(fields: [supplierId], references: [id])
  amount        Float
  paymentMethod String
  description   String
  invoiceNumber String?
  notes         String?
  createdAt     DateTime  @default(now())
}
```

Add to Shift model:
```
  totalBankTransfer Float @default(0)
  totalInstapay     Float @default(0)
  totalWallet       Float @default(0)
  totalExpenses     Float @default(0)
```

Then push the schema:
```bash
npx prisma db push
```

Commit with message "feat(db): add Supplier and Expense models, expand payment methods"

---

### Task 2: Supplier API routes

**Files:**
- Create: `src/app/api/admin/pos/suppliers/route.ts`

GET: List/search suppliers by name
POST: Create supplier

```ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || ''
  const suppliers = await prisma.supplier.findMany({
    where: search ? { name: { contains: search } } : {},
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(suppliers)
}

export async function POST(req: Request) {
  try {
    const { name, phone, email, address, notes } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const supplier = await prisma.supplier.create({ data: { name, phone, email, address, notes } })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
}
```

Commit with message "feat(pos): add supplier API routes"

---

### Task 3: Expense API routes

**Files:**
- Create: `src/app/api/admin/pos/expenses/route.ts`

GET: List expenses for a shift
POST: Create expense and update shift totals

```ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  const shiftId = req.nextUrl.searchParams.get('shiftId')
  if (!shiftId) return NextResponse.json({ error: 'shiftId required' }, { status: 400 })
  const expenses = await prisma.expense.findMany({
    where: { shiftId },
    include: { supplier: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(expenses)
}

export async function POST(req: Request) {
  try {
    const { shiftId, supplierId, amount, paymentMethod, description, invoiceNumber, notes } = await req.json()
    if (!shiftId || !amount || !paymentMethod || !description) {
      return NextResponse.json({ error: 'shiftId, amount, paymentMethod, description required' }, { status: 400 })
    }
    const expense = await prisma.$transaction(async (tx) => {
      const e = await tx.expense.create({
        data: { shiftId, supplierId, amount, paymentMethod, description, invoiceNumber, notes },
      })
      await tx.shift.update({
        where: { id: shiftId },
        data: {
          totalExpenses: { increment: amount },
          ...(paymentMethod === 'cash' ? { totalCash: { increment: -amount } } : {}),
        },
      })
      return e
    })
    return NextResponse.json(expense)
  } catch {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
```

Commit with message "feat(pos): add expense API routes"

---

### Task 4: Orders search and manual order API

**Files:**
- Create: `src/app/api/admin/pos/orders/search/route.ts` (GET — search)
- Create: `src/app/api/admin/pos/orders/manual/route.ts` (POST — create manual order)

**search/route.ts:**
GET `?q=&from=&to=&branchId=`
Search by: receiptNumber, orderNumber, email (customer name)
Filter by date range
Include shift.branch info

**manual/route.ts:**
POST — Create a manual order with any payment method
- Accept: items (productId, quantity, price), paymentMethod, notes, shiftId
- Create order with status='confirmed', paymentStatus='paid'
- Update shift totals based on payment method
- Generate orderNumber and receiptNumber

Commit with message "feat(pos): add order search and manual order APIs"

---

### Task 5: Shifts history and hall sale API

**Files:**
- Create: `src/app/api/admin/pos/shifts/history/route.ts` (GET)
- Create: `src/app/api/admin/pos/shifts/hall-sale/route.ts` (GET)

**history/route.ts:**
GET `?branchId=`
Returns shifts for branch ordered by startedAt desc, with orderCount and totals.

**hall-sale/route.ts:**
GET `?shiftId=`
Returns comprehensive report:
- shift details (startingCash, endingCash, totals)
- incomeByMethod: { cash, card, bank_transfer, instapay, wallet }
- expensesByMethod: { cash, card, bank_transfer, instapay, wallet }
- totalIncome, totalExpenses
- expectedCash, actualEndingCash, difference

Commit with message "feat(pos): add shift history and hall sale APIs"

---

### Task 6: Modify checkout and close shift APIs

**Files:**
- Modify: `src/app/api/admin/pos/checkout/route.ts`
- Modify: `src/app/api/admin/pos/shifts/close/route.ts`
- Modify: `src/app/api/admin/pos/shifts/summary/route.ts`

**checkout:** Accept `bank_transfer`, `instapay`, `wallet` as payment methods. Update shift totals accordingly.

**close/route.ts:** On close, calculate totalBankTransfer, totalInstapay, totalWallet from orders. Include totalExpenses.

**summary/route.ts:** Include new payment method splits and expenses in the summary response.

Commit with message "feat(pos): update checkout and shift APIs for new payment methods"

---

### Task 7: Create tab navigation and layout update

**Files:**
- Modify: `src/app/pos/page.tsx`
- Modify: `src/app/pos/components/PosLayout.tsx`

Add a tab bar with tabs: POS, Orders, Records, Hall Sale.
Pass the active tab and change handler to PosLayout.
Each tab renders its own view below the header.

Update the `view` state to: `'pos' | 'orders' | 'records' | 'hall-sale'`

Commit with message "feat(pos): add tab navigation to POS layout"

---

### Task 8: Orders search tab component

**Files:**
- Create: `src/app/pos/components/OrdersTab.tsx`

Search form with: receipt number, order number, customer name, date range
Results table with: receipt#, customer, total, payment method, date, actions
Click row → show order detail modal/drawer with items
Reprint receipt action (reuse ReceiptView)

Commit with message "feat(pos): add orders search tab"

---

### Task 9: Records tab component (manual orders + expenses)

**Files:**
- Create: `src/app/pos/components/RecordsTab.tsx`

Two sub-tabs: Manual Order and Expense

**Manual Order:** Product selector (reuse search), quantity input, price override, payment method selector (all methods), notes field, submit button.

**Expense:** Supplier selector (search/create inline), description, amount, payment method, invoice number, notes.

Commit with message "feat(pos): add records tab with manual orders and expenses"

---

### Task 10: Hall Sale tab component

**Files:**
- Create: `src/app/pos/components/HallSaleTab.tsx`

Report view showing:
- Shift info header (start/end time)
- Income table by payment method
- Expense table by payment method
- Summary: total income, total expenses, net
- Cash position: expected cash calculation, actual ending cash, difference
- Print button for the report

Commit with message "feat(pos): add hall sale tab"

---

### Task 11: Integrate all tabs into page.tsx

**Files:**
- Modify: `src/app/pos/page.tsx`

Wire up all four tabs:
- Import and render OrdersTab, RecordsTab, HallSaleTab
- Conditionally render based on `view` state (same pattern as assessment)
- Tab bar at the top

Commit with message "feat(pos): integrate all tabs into POS page"
