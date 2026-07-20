---
name: ecommerce-accounting
description: Use when working with order reconciliation, journal entries, financial reports, payment accounting, inventory valuation, tax calculations, bank reconciliation, COGS tracking, P&L/balance sheet/cash flow reports, multi-payment split accounting, or refund journal entries in this e-commerce project.
---

# E-Commerce Accounting

## Chart of Accounts
Accounts defined in `prisma/seed-accounts.ts` — run seed before accounting operations.

**Assets (1000-1999):** Cash(1000), Bank(1100), AR(1200), Inventory(1300)
**Liabilities (2000-2999):** AP(2000), Sales Tax Payable(2100)
**Equity (3000-3999):** Owner's Equity(3000), Retained Earnings(3100)
**Income (4000-4999):** Sales Revenue(4000), Sales Returns(4100)
**Expenses (5000-5999):** COGS(5000), Salaries(5100), Rent(5200), Utilities(5300), Supplies(5400), Other(5500)

## Accounting Engine (`src/lib/accounting.ts`)

The engine enforces double-entry balance: totalDebit MUST equal totalCredit.

**Key functions:**
- `createJournalEntry()` — low-level, accepts lines array
- `createSaleJournalEntry()` — debit Cash/Bank, credit Sales Revenue
- `createRefundJournalEntry()` — debit Sales Returns, credit Cash/Bank
- `createExpenseJournalEntry()` — debit expense account, credit Cash/Bank
- `createReconciliationJournalEntry()` — debit Bank, credit AR

Account codes are HARDCODED in the `ACCOUNTS` object — do not change without updating seed data.

## Valid Enum Values

**Order status:** `pending`, `processing`, `shipped`, `delivered`, `cancelled`
**Payment method:** `cash`, `card`, `split` (partial cash+card), `bank_transfer`, `instapay`, `wallet`
**Payment status:** `pending` (COD/manual), `paid` (card/paypal), `awaiting_verification` (manual methods), `refunded`
**Refund method:** `cash`, `card`, `store_credit`, `bank_transfer`, `instapay`, `wallet`, `no_refund`

**Important:** There is NO `cod` payment method. COD orders use `paymentMethod: 'cash'` with `paymentStatus: 'pending'`.

## Order Reconciliation Flow

**When reconciling:** Code first checks `order.paymentMethod`:
- `bank_transfer`: Creates BOTH `createSaleJournalEntry` (Bank->Revenue) AND `createReconciliationJournalEntry` (Bank->AR). This double-counts — see gaps below.
- All others (cash, card, split, instapay, wallet): Only `createSaleJournalEntry` (Cash->Revenue).

**Current gaps (from baseline analysis):**
1. Journal entries are NOT auto-created on order placement — only on manual reconcile
2. COGS journal entry is never created (estimate uses 60% of revenue)
3. Refund entries are not created automatically when returns are processed
4. Split payments (cash+card) ignore the `cashAmount`/`cardAmount` fields
5. COD orders debit Cash(1000) but cash hasn't been collected yet
6. Errors in journal creation are silently caught — caller gets `{ ok: true }`

## Payment Method Handling

Valid payment methods: `cash`, `card`, `split`, `bank_transfer`, `instapay`, `wallet` (from schema line 145).

| Method | Debit Account | Notes |
|--------|------|-------|
| `cash` | Cash(1000) | Direct cash sale. For COD (paymentStatus=pending), should use AR(1200) until cash collected |
| `card` | Cash(1000) | Uses Cash account (card processor, not bank account) |
| `bank_transfer` | Bank(1100) + AR(1200) | Creates sale + reconciliation entries |
| `split` | Falls to Cash(1000) | Ignores `cashAmount`/`cardAmount` split |
| `instapay` / `wallet` | Cash(1000) | Treated as cash |

**When implementing split payment support:** Use both Cash(1000) for `cashAmount` and Bank(1100) for `cardAmount`.

## Refund & Return Accounting

`createRefundJournalEntry()` always credits Cash/Bank based on `paymentMethod`. It does NOT check `order.reconciledAt` to determine if AR should be credited instead.

**Correct refund logic based on reconciliation state:**
- If `reconciledAt != null` → cash already collected → credit Cash(1000) or Bank(1100)
- If `reconciledAt == null` → still in AR → credit AR(1200) with matching entry

## Financial Reports

All in `src/app/api/admin/accounting/`:

| Report | File | Logic |
|--------|------|-------|
| **P&L** | `/pl/route.ts` | Income accounts - Expense accounts, monthly comparison |
| **Balance Sheet** | `/balance-sheet/route.ts` | Assets = Liabilities + Equity, verifies balance |
| **Cash Flow** | `/cash-flow/route.ts` | Direct method: Operating+Investing+Financing |
| **Trial Balance** | `/trial-balance/route.ts` | All accounts with debit/credit totals |
| **Inventory Valuation** | `/inventory-valuation/route.ts` | Weighted average: `stock * unitCost` |
| **Aging** | `/aging/route.ts` | AR aging report |
| **Tax Report** | `/tax/route.ts` | Monthly tax collected breakdown |
| **Financial Ratios** | `/ratios/route.ts` | Profitability, Liquidity, Efficiency |
| **Budget vs Actual** | `/budgets/actual/route.ts` | Budget target comparison |
| **Accounts Payable** | `/bills/aging/route.ts` | Bill aging report |

## Tax

`src/lib/tax.ts` — `getApplicableTaxRate()` falls back: region-specific -> country-wide -> EG default -> null. `calculateTax()` = `(subtotal + shipping) * (rate / 100)`.

Order creation currently hardcodes 18% tax. The `TaxRate` model and `getApplicableTaxRate` are NOT used in `POST /api/orders`.

## Bank Reconciliation

Flow: CSV import (`/bank-accounts/[id]/import`) -> auto-match (`/bank-accounts/[id]/match`) -> manual match (`/transactions/[txId]/match`). Creates reconciliation journal entries.

## Common Mistakes

- **Silent catch in reconcile route** — always propagate or return an error response; never let accounting errors go unnoticed
- **Using wrong account for COD** — COD should go through AR(1200), not Cash(1000), until payment is collected
- **Not verifying double-entry balance** — `createJournalEntry` does this automatically, but custom calls may skip it
- **Missing COGS journal entry** — COGS(5000) is never automatically created; implement on status->delivered
- **Hardcoded account codes** — `accounting.ts` uses hardcoded codes that MUST match seed data; change both together
- **Credit vs debit confusion** — Debit increases assets/expenses, Credit increases liabilities/equity/income
