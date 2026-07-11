# Accounting Phase 1 — Double-Entry Foundation

## Goal

Transform the existing cash-basis accounting page into a double-entry bookkeeping system with auto-generated journal entries from orders and expenses, a chart of accounts, general ledger view, and trial balance.

## New Prisma Models

### Account

Represents a single account in the chart of accounts.

| Field      | Type     | Notes                                |
|------------|----------|--------------------------------------|
| id         | String   | @id @default(cuid())                 |
| code       | String   | @unique, e.g. "1000", "1100"         |
| name       | String   | e.g. "Cash", "Accounts Receivable"   |
| nameAr     | String?  | Arabic name                          |
| type       | String   | asset, liability, equity, income, expense |
| parentId   | String?  | Self-relation for hierarchy          |
| isActive   | Boolean  | @default(true)                       |
| createdAt  | DateTime | @default(now())                      |

### JournalEntry

A journal entry header.

| Field       | Type     | Notes                               |
|-------------|----------|-------------------------------------|
| id          | String   | @id @default(cuid())                |
| date        | DateTime |                                     |
| description | String   |                                     |
| reference   | String?  | Link to source (order #, expense #) |
| type        | String   | sale, refund, expense, reconciliation, opening |
| orderId     | String?  | Relation to Order                   |
| expenseId   | String?  | Relation to Expense                 |
| createdAt   | DateTime | @default(now())                     |
| lines       | JournalLine[] |                               |

### JournalLine

A single debit/credit line in a journal entry.

| Field    | Type     | Notes                       |
|----------|----------|----------------------------|
| id       | String   | @id @default(cuid())       |
| entryId  | String   | FK to JournalEntry          |
| accountId| String   | FK to Account               |
| debit    | Float    | @default(0)                 |
| credit   | Float    | @default(0)                 |
| entry    | JournalEntry | @relation(fields: [entryId], references: [id]) |
| account  | Account  | @relation(fields: [accountId], references: [id]) |

Constraints: each JournalEntry must have balanced lines (sum of debits = sum of credits).

## Seeded Chart of Accounts

### Assets (1xxx)
- 1000 Cash
- 1100 Bank
- 1200 Accounts Receivable (for pending/prepaid orders)
- 1300 Inventory

### Liabilities (2xxx)
- 2000 Accounts Payable
- 2100 Sales Tax Payable

### Equity (3xxx)
- 3000 Owner's Equity
- 3100 Retained Earnings

### Income (4xxx)
- 4000 Sales Revenue
- 4100 Sales Returns & Allowances

### Expenses (5xxx)
- 5000 Cost of Goods Sold
- 5100 Salaries & Wages
- 5200 Rent
- 5300 Utilities
- 5400 Supplies
- 5500 Other Expenses

## Auto-Generation Rules

### Order Paid (paymentStatus = 'paid')
```
Debit  Cash (or Bank)          ← totalAmount
Credit Sales Revenue           ← totalAmount
```
And for inventory:
```
Debit  COGS                    ← cost of goods
Credit Inventory               ← cost of goods
```

### Order with Split Payment
```
Debit  Cash                    ← cashAmount
Debit  Card/Bank               ← cardAmount
Credit Sales Revenue           ← totalAmount
```

### Order Refunded (refundedAmount > 0)
```
Debit  Sales Returns           ← refundedAmount
Credit Cash (or Bank)          ← refundedAmount
```

### Expense Recorded
```
Debit  appropriate Expense account   ← amount
Credit Cash (or Bank)                ← amount
```

### Payment Reconciled (pending → paid via bank transfer)
```
Debit  Bank                    ← amount
Credit Accounts Receivable     ← amount
```

## New API Routes

### /api/admin/accounting/accounts
- `GET` - List all accounts with current balances (calculated from journal lines)
- `POST` - Create a new account (admin override for custom accounts)

### /api/admin/accounting/journal
- `GET` - List journal entries with lines, filterable by date range, account, type

### /api/admin/accounting/trial-balance
- `GET` - all accounts with debit/credit totals and net balance

### Auto-generation hooks
- Modify existing `POST /api/admin/accounting/expenses` to also create journal entries
- Add a sync endpoint: `POST /api/admin/accounting/sync` to retroactively create journal entries for existing orders/expenses

## New UI Tabs

Replace the current tab bar with:

| Tab | Component | Description |
|-----|-----------|-------------|
| Dashboard | `OverviewTab` | Enhanced with cash position, AR/AP totals |
| Journal Entries | `JournalTab` | Table of all entries with expandable lines |
| Chart of Accounts | `AccountsTab` | Tree view with balances |
| Trial Balance | `TrialBalanceTab` | Debit/credit columns per account |
| Orders | `OrdersTab` | Same as current |
| Branches | `BranchesTab` | Same as current |
| Expenses | `ExpensesTab` | Same as current, now with auto journal link |
| Reports | `ReportsTab` | Enhanced with P&L and Balance Sheet (Phase 2) |

## Data Flow

```
Order/Expense created
  → trigger journal entry generation
    → create JournalEntry + JournalLine records
      → Account balances (computed) reflect new entries
        → P&L, Balance Sheet read from account balances
```

Journal entry generation happens synchronously within the existing request handler (after the order/expense is saved). No background jobs needed for Phase 1.

## Existing Files to Modify

- `prisma/schema.prisma` - add Account, JournalEntry, JournalLine models
- `src/app/api/admin/accounting/expenses/route.ts` - add journal entry creation after expense save
- `src/app/api/admin/accounting/overview/route.ts` - add cash position, AR/AP to response
- `src/app/admin/accounting/page.tsx` - add Journal, Accounts, Trial Balance tabs

## New Files to Create

- `src/lib/accounting.ts` - journal entry generation helpers
- `src/app/api/admin/accounting/accounts/route.ts`
- `src/app/api/admin/accounting/journal/route.ts`
- `src/app/api/admin/accounting/trial-balance/route.ts`
- `prisma/seed-accounts.ts` - seed the chart of accounts
