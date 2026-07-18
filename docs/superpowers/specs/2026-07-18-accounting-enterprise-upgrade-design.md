# Accounting — Enterprise Upgrade

## Goal

Transform the existing accounting tab into a professional-grade accounting tool competitive with QuickBooks/Xero — covering financial reporting, bank reconciliation, invoicing/payables, inventory valuation, and visual polish.

## Execution Strategy — Two Parallel Tracks

```
Track 1 (Reports & Banking)        Track 2 (Invoicing & Inventory)
┌──────────────────────────┐       ┌────────────────────────────┐
│ Cash Flow Statement      │       │ Customer Invoices          │
│ Financial Ratios         │       │ Supplier Bills / AP        │
│ Dashboard Drill-downs    │       │ Inventory Valuation        │
│ Bank Reconciliation      │       │ COGS Reconciliation        │
│ Export Polish            │       │                            │
└──────────┬───────────────┘       └──────────┬─────────────────┘
           └──────────────┬───────────────────┘
                          ▼
                 Phase E: Merge & Polish
                 ┌──────────────────────┐
                 │ Multi-currency       │
                 │ Custom Reports       │
                 │ Global Visual Polish │
                 └──────────────────────┘
```

Track 1 and Track 2 are independent — no shared data model changes. They can be built and deployed in parallel. Phase E depends on both being stable.

---

## Track 1 — Financial Reports & Bank Reconciliation

### 1.1 Cash Flow Statement

**New API route:** `GET /api/admin/accounting/cash-flow`

Query params: `period` (day/week/month/year/custom), `start`, `end`, `method` (direct/indirect)

**Response shape:**
```json
{
  "period": "month",
  "dateRange": { "start": "...", "end": "..." },
  "method": "direct",
  "operating": {
    "cashReceipts": 50000,
    "cashPayments": 32000,
    "netOperating": 18000,
    "items": [
      { "label": "Cash from Sales", "amount": 50000 },
      { "label": "Cash Paid for Expenses", "amount": -32000 }
    ]
  },
  "investing": {
    "netInvesting": -5000,
    "items": []
  },
  "financing": {
    "netFinancing": 0,
    "items": []
  },
  "netCashFlow": 13000,
  "openingCash": 25000,
  "closingCash": 38000
}
```

**Data source:** Journal entries filtered by date + cash/bank account codes. Cash receipts = credit lines on cash accounts. Cash payments = debit lines on cash accounts.

**New UI tab:** "Cash Flow" tab in the accounting page. Import `CashFlowTab` from `./CashFlowTab.tsx`.

`CashFlowTab.tsx`: Period selector, method toggle (direct/indirect), statement table with collapsible sections, export CSV/PDF.

### 1.2 Financial Ratios

**New API route:** `GET /api/admin/accounting/ratios`

Query params: `period`, `date`

**Response shape:**
```json
{
  "profitability": {
    "grossMargin": { "value": 0.45, "label": "Gross Margin", "benchmark": 0.4 },
    "netMargin": { "value": 0.12, "label": "Net Margin", "benchmark": 0.1 },
    "roa": { "value": 0.08, "label": "Return on Assets" }
  },
  "liquidity": {
    "currentRatio": { "value": 1.8, "label": "Current Ratio", "benchmark": 2.0 },
    "quickRatio": { "value": 1.2, "label": "Quick Ratio", "benchmark": 1.0 }
  },
  "efficiency": {
    "assetTurnover": { "value": 2.1, "label": "Asset Turnover" },
    "inventoryTurnover": { "value": 6.5, "label": "Inventory Turnover" }
  }
}
```

**New UI:** Add "Ratios" section in the Overview tab, below the revenue chart. Show ratio cards with benchmark comparisons (green if meeting/receeding benchmark, red if below).

### 1.3 Dashboard Drill-downs

**Overview tab enhancements:**
- Each stat card becomes clickable → expands detail panel below it
- Revenue chart: click a data point → shows orders for that day
- Payment breakdown: click a segment → filtered order list
- Branch revenue: click a bar → branch detail panel

**Implementation:** Add `useState` for drill-down state. When a card/bar/segment is clicked, set drill-down state and render a `DrillDownPanel` component below the active area. The panel fetches detail data from existing API routes.

### 1.4 Bank Reconciliation

**New Prisma model:**
```prisma
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
```

**New API routes:**
- `GET/POST /api/admin/accounting/bank-accounts` — list/create bank accounts
- `GET /api/admin/accounting/bank-accounts/[id]/transactions` — list transactions
- `POST /api/admin/accounting/bank-accounts/[id]/import` — upload CSV/OFX to import bank transactions
- `POST /api/admin/accounting/bank-accounts/[id]/match` — auto-match suggestions
- `POST /api/admin/accounting/bank-accounts/[id]/transactions/[txId]/match` — manually match to a journal entry
- `GET /api/admin/accounting/bank-accounts/[id]/reconciliation` — reconciliation report

**New UI tab:** "Reconciliation" tab in accounting page.

`ReconciliationTab.tsx`:
- Bank account selector (dropdown)
- Import button (upload CSV)
- Two-column layout: left = bank transactions, right = journal entries
- Auto-match suggestions highlighted in green
- Manual match drag/select
- Reconciliation summary: opening balance, cleared, outstanding, difference
- "Mark Reconciled" button when difference = 0

### 1.5 Export Polish

- CSV exports: add proper date formatting, number formatting with commas, RTL-safe for Arabic
- PDF exports: add company logo, page numbers, better layout
- Add Excel (.xlsx) export to ALL tabs that only have CSV currently
- Standardize export buttons across all tabs (green = CSV, red = PDF, blue = Excel)

---

## Track 2 — Invoicing & Inventory Valuation

### 2.1 Customer Invoices

**New Prisma model:**
```prisma
model Invoice {
  id              String     @id @default(cuid())
  invoiceNumber   String     @unique
  orderId         String?
  order           Order?     @relation(fields: [orderId], references: [id])
  customerName    String
  customerEmail   String?
  customerPhone   String?
  customerAddress String?
  items           InvoiceItem[]
  subtotal        Float
  tax             Float      @default(0)
  shipping        Float      @default(0)
  total           Float
  status          String     @default("draft") // draft, sent, paid, overdue, cancelled
  issuedAt        DateTime   @default(now())
  dueAt           DateTime?
  paidAt          DateTime?
  notes           String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([status])
  @@index([customerEmail])
}

model InvoiceItem {
  id        String  @id @default(cuid())
  invoiceId String
  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  productId String?
  product   Product? @relation(fields: [productId], references: [id])
  name      String
  quantity  Int
  unitPrice Float
  total     Float
}
```

**New API routes:**
- `GET /api/admin/accounting/invoices` — list with filters (status, date range, customer)
- `POST /api/admin/accounting/invoices` — create invoice (from scratch or from order)
- `GET /api/admin/accounting/invoices/[id]` — single invoice detail
- `PATCH /api/admin/accounting/invoices/[id]` — update status (send, mark paid, cancel)
- `DELETE /api/admin/accounting/invoices/[id]` — delete draft
- `GET /api/admin/accounting/invoices/next-number` — get next invoice number

**New UI tab:** "Invoices" tab in accounting page.

`InvoicesTab.tsx`:
- Filter bar: status, date range, customer search
- Table: invoice#, customer, total, status, issued date, due date, actions
- Status badges with colors (draft=gray, sent=blue, paid=green, overdue=red, cancelled=slate)
- Row click → invoice detail drawer
- "Create Invoice" button → modal with customer select, line items, totals
- "Generate from Order" option in the invoice creation modal
- Send invoice (mark as sent), Mark Paid, Cancel actions
- Export to CSV/PDF

### 2.2 Supplier Bills / AP Management

**New Prisma model:**
```prisma
model Bill {
  id              String      @id @default(cuid())
  billNumber      String      @unique
  supplierId      String?
  supplier        Supplier?   @relation(fields: [supplierId], references: [id])
  supplierName    String
  items           BillItem[]
  subtotal        Float
  tax             Float       @default(0)
  total           Float
  status          String      @default("pending") // pending, approved, paid, overdue, cancelled
  issuedAt        DateTime    @default(now())
  dueAt           DateTime?
  paidAt          DateTime?
  paymentMethod   String?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([status])
  @@index([supplierId])
}

model BillItem {
  id        String  @id @default(cuid())
  billId    String
  bill      Bill    @relation(fields: [billId], references: [id], onDelete: Cascade)
  name      String
  quantity  Int
  unitPrice Float
  total     Float
}
```

**New API routes:**
- `GET /api/admin/accounting/bills` — list with filters
- `POST /api/admin/accounting/bills` — create bill
- `GET /api/admin/accounting/bills/[id]` — single bill detail
- `PATCH /api/admin/accounting/bills/[id]` — update status (approve, pay, cancel)
- `DELETE /api/admin/accounting/bills/[id]` — delete pending bill
- `GET /api/admin/accounting/bills/aging` — AP aging report

**New UI tab:** "Bills" tab in accounting page near the existing expenses tab.

`BillsTab.tsx`: Mirror of InvoicesTab but for payables — list, create, detail, status management, aging view, export.

### 2.3 Inventory Valuation

**No new models needed.** Uses existing `OrderItem`, `Return`, `Product`, and `JournalEntry` models.

**New API routes:**
- `GET /api/admin/accounting/inventory-valuation` — valuation report

**Query params:** `date` (as-of date), `method` (fifo/weighted)

**Response shape:**
```json
{
  "asOfDate": "2026-07-18",
  "method": "fifo",
  "totalProducts": 150,
  "totalValue": 450000,
  "totalCOGS": 320000,
  "items": [
    {
      "sku": "PROD-001",
      "name": "Product Name",
      "quantity": 50,
      "unitCost": 150,
      "totalValue": 7500
    }
  ]
}
```

**Data source:** 
- Product quantities from inventory/stock data
- COGS from journal lines linked to the COGS account (5000)
- Unit cost = total COGS for a product / quantity sold (weighted average)

**New UI tab:** "Inventory Valuation" tab.

`InventoryValuationTab.tsx`:
- As-of date selector
- Valuation method selector (weighted avg / FIFO)
- Summary card: total products, total value, avg unit cost
- Table: SKU, name, quantity, unit cost, total value
- Export CSV/PDF
- COGS reconciliation card: total sales vs total COGS vs gross margin

### 2.4 COGS Reconciliation

Add a reconciliation card to Inventory Valuation tab and Overview tab:
- Total sales revenue for period
- Total COGS from journal entries
- Calculated gross margin
- Compare against expected COGS (sum of product costs × quantities sold)
- Flag discrepancies > 5%

---

## Phase E — Merge & Polish

### 3.1 Multi-currency

- Add `currency` field to `Order`, `Invoice`, `Bill`, `Expense`, `BankAccount` models
- Add `exchangeRate` field to `JournalEntry`
- Add base currency setting (default EGP)
- Currency selector on overview and financial reports
- Conversion at display time using stored exchange rates

### 3.2 Custom Report Builder

- New API: `POST /api/admin/accounting/custom-report`
- Request body defines: metrics, dimensions, date range, filters
- Response: aggregated data
- UI: metric/dimension pickers, date range, preview table, export
- Saved reports: `GET/POST/DELETE /api/admin/accounting/saved-reports`

### 3.3 Global Visual Polish

Across ALL tabs:
- Consistent card spacing, typography, color usage
- Loading skeletons matching final layout shapes
- Empty states with illustrations and action buttons
- Error states with retry buttons (not just toasts)
- Responsive design for tablet screens
- Keyboard navigation for tables (arrow keys, enter to select)
- Column sorting and resize for all data tables
- Sticky headers on scrollable tables
- Row hover highlight consistency
- Number formatting: comma-separated thousands, fixed decimals
- Date formatting: consistent locale-aware format

---

## Implementation Order

### Step 1 (parallel):
- **Track 1.1–1.3:** Cash flow API + UI, ratios API + UI, dashboard drill-downs
- **Track 2.1–2.2:** Invoices API + UI, Bills API + UI

### Step 2 (parallel):
- **Track 1.4:** Bank reconciliation models, API, UI
- **Track 2.3–2.4:** Inventory valuation API + UI, COGS reconciliation

### Step 3:
- **Phase E:** Multi-currency, custom reports, visual polish

### Step 4:
- Integration testing across all features
- Performance testing on report APIs (add indexes where needed)

---

## Data Flow Changes

### Invoice → Journal Entry
When an invoice is marked as paid, auto-generate a journal entry:
```
Debit  Cash (or Bank)     ← amount
Credit Accounts Receivable ← amount
```

### Bill → Journal Entry
When a bill is marked as paid, auto-generate:
```
Debit  appropriate Expense account   ← amount
Credit Cash (or Bank)                ← amount
```

### Bank Transaction → Journal Entry Match
When matched, link `BankTransaction.matchedEntryId` to the `JournalEntry`. The matched entry's lines are displayed inline in the reconciliation UI.

---

## Existing Files to Modify

- `prisma/schema.prisma` — add BankTransaction, BankAccount, Invoice, InvoiceItem, Bill, BillItem models
- `src/app/admin/accounting/page.tsx` — add new tab imports, tab entries, and switch cases for: Cash Flow, Reconciliation, Invoices, Bills, Inventory Valuation
- `src/app/admin/accounting/ProfitLossTab.tsx` — add Excel export, standardize export buttons
- `src/app/admin/accounting/BalanceSheetTab.tsx` — add Excel export, standardize export buttons
- `src/app/admin/accounting/OverviewTab` (inline in page.tsx) — add drill-downs, ratios section
- `src/lib/accounting.ts` — add invoice/bill journal entry generation functions
- `src/app/api/admin/accounting/overview/route.ts` — add ratio calculations to response

## New Files to Create

```
src/app/api/admin/accounting/cash-flow/route.ts
src/app/api/admin/accounting/ratios/route.ts
src/app/api/admin/accounting/bank-accounts/route.ts
src/app/api/admin/accounting/bank-accounts/[id]/transactions/route.ts
src/app/api/admin/accounting/bank-accounts/[id]/import/route.ts
src/app/api/admin/accounting/bank-accounts/[id]/match/route.ts
src/app/api/admin/accounting/bank-accounts/[id]/reconciliation/route.ts
src/app/api/admin/accounting/bank-accounts/[id]/transactions/[txId]/match/route.ts
src/app/api/admin/accounting/invoices/route.ts
src/app/api/admin/accounting/invoices/[id]/route.ts
src/app/api/admin/accounting/invoices/next-number/route.ts
src/app/api/admin/accounting/bills/route.ts
src/app/api/admin/accounting/bills/[id]/route.ts
src/app/api/admin/accounting/bills/aging/route.ts
src/app/api/admin/accounting/inventory-valuation/route.ts
src/app/admin/accounting/CashFlowTab.tsx
src/app/admin/accounting/ReconciliationTab.tsx
src/app/admin/accounting/InvoicesTab.tsx
src/app/admin/accounting/BillsTab.tsx
src/app/admin/accounting/InventoryValuationTab.tsx
```
