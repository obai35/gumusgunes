# Accounting System Drift Registry

**Audit Date:** 2026-07-29  
**Codebase:** Gümüş Güneş — Silver Sun Jewelry E-Commerce  
**Scope:** Accounting module — double-entry, manufacturing, consolidation, purchasing, fixed assets, depreciation, payroll, budgets, FPNA, bank reconciliation

---

## View 1: By Finding (Master List)

| # | Finding | Files | Type | Severity | Status |
|---|---|---|---|---|---|
| F1 | **JournalEntry.type schema/usage mismatch** | `prisma/schema.prisma:1325`, `src/lib/accounting.ts:142` | Doc/code mismatch | Cosmetic | Open |
| F2 | **storeId defaults to empty string** | `src/lib/accounting.ts:168` | Logic mismatch | Critical | Open |
| F3 | **Global DB vs Store-scoped DB inconsistency** | `src/lib/cogs.ts:30`, `src/lib/cogs.ts:57`, `src/lib/auto-accounting.ts:23,115,134`, `src/lib/purchasing.ts:1` vs. all route handlers | Cross-service pattern drift | High | Open |
| F4 | **Fire-and-forget COGS (no await)** | `src/app/api/orders/update-status/route.ts:39` | Logic mismatch | High | Open |
| F5 | **Duplicate entry-creation paths without atomic guards** | `src/lib/auto-accounting.ts`, `src/app/api/admin/accounting/sync/route.ts`, `src/app/api/admin/accounting/orders/[id]/fulfill/route.ts`, order-status route | Duplicate implementation | Moderate | Open |
| F6 | **No Prisma transaction isolation in journal creation** | `src/lib/accounting.ts:150-179` | Logic mismatch | Moderate | Open |
| F7 | **Expense account mapping is fragile keyword-match** | `src/lib/accounting.ts:96-102` | Logic mismatch | Moderate | Open |
| F8 | **Refund uses proportional tax, no link to original sale** | `src/lib/accounting.ts:244-274` | Logic mismatch | Moderate | Open |
| F9 | **Bill/Purchase journal entries use wrong `type`** | `src/lib/purchasing.ts:33,55,136` | Logic mismatch | Moderate | Open |
| F10 | **Manufacturing hardcodes WIP/FG account codes** | `src/lib/manufacturing.ts:103-104` | Logic mismatch | Moderate | Open |
| F11 | **Overhead calculation hardcoded at 20%** | `src/lib/manufacturing.ts:86` | Logic mismatch | Moderate | Open |
| F12 | **Consolidation/IC entries use wrong `type`** | `src/lib/consolidation.ts:52,105` | Logic mismatch | Moderate | Open |
| F13 | **Auto-accounting uses global db instead of storeDb** | `src/lib/auto-accounting.ts:1,23,57,70,91,96,115,134` | Logic mismatch | High | Open |
| F14 | **P&L and Balance Sheet load all lines into memory** | `src/app/api/admin/accounting/pl/route.ts:47-52`, `src/app/api/admin/accounting/balance-sheet/route.ts:14-23` | Performance | Moderate | Open |
| F15 | **Asset disposal uses `depreciation` type, not `asset-acquisition`** | `src/lib/depreciation.ts:162` | Logic mismatch | Cosmetic | Open |
| F16 | **`recordCOGS` doesn't use store-scoped DB** | `src/lib/cogs.ts:30,39,58,98` | Logic mismatch | High | Open |
| F17 | **Ratios double-counts expenses (COGS in both COGS and expenses)** | `src/app/api/admin/accounting/ratios/route.ts:16-19` | Logic mismatch | Critical | Open |
| F18 | **Shift-close creates journal entry without storeId** | `src/app/api/admin/accounting/shift-close/route.ts:42` | Logic mismatch | High | Open |
| F19 | **Reconciliation route can create sale entry for non-sale orders** | `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts` (fires createSaleJournalEntry) | Logic mismatch | Moderate | Open |
| F20 | **`applyStatusFilter` imported but no approval filter applied** | `src/app/api/admin/accounting/pl/route.ts:5` | Dead code | Cosmetic | Open |

---

## View 2: By File Era

| Era | Approx. Date | Dominant Pattern | Files Following It |
|---|---|---|---|
| **Era 1 (Core)** | Earliest | Global `db`, `createJournalEntry` with inline `ACCOUNTS`, fewer entry types | `src/lib/accounting.ts`, `src/lib/auto-accounting.ts` |
| **Era 2 (Multi-Store)** | Later | `storeDb(storeId)`, route-level store scoping, `withAdmin` wrapper | All route handlers in `src/app/api/admin/accounting/*/`, `src/lib/manufacturing.ts`, `src/lib/depreciation.ts`, `src/lib/purchasing.ts` |
| **Era 3 (Manufacturing)** | After multi-store | Hardcoded account codes, 20% overhead rule | `src/lib/manufacturing.ts`, production-order routes |
| **Era 4 (Consolidation/Fixed Assets)** | Latest | `createJournalEntry` with new types, store-scoped but with type drift | `src/lib/consolidation.ts`, `src/lib/depreciation.ts` |
| **Era 5 (FPNA/BI)** | Most recent | Financial analysis with aggregation | `src/app/api/admin/accounting/fpna/*/`, `src/app/api/admin/accounting/bi/` |

### Era Boundary Observations

- **Era 1 → Era 2**: Library code (`auto-accounting.ts`, `cogs.ts`) was never migrated to use `storeDb`. This is the most prominent drift — **Era 1 code still uses global `db`** while Era 2+ code consistently uses `storeDb(admin.storeId)`.
- **Era 3 → Era 4**: New `type` values were added (e.g., `'depreciation'`, `'asset-acquisition'`, `'purchasing'`, `'interCompany'`, `'consolidation'`) but older code (purchasing, consolidation) uses wrong types from earlier eras.
- **Era 5**: The FPNA and BI routes use their own aggregation patterns independent of the existing financial statement routes.

---

## View 3: By Responsibility

| Responsibility | Implementations Found | Are They Consistent? |
|---|---|---|
| **Sale journal entry** | `createSaleJournalEntry()` in `accounting.ts`, called from sync route, auto-accounting, fulfill route | Partial — existence checks differ (some use `findFirst` on `orderId+type`, others skip) |
| **COGS recording** | `recordCOGS()` in `cogs.ts`, called from fulfill route, sync route, order-status update | No — order-status uses fire-and-forget, fulfill route sequences it after `recordActualCost`, sync checks existence first |
| **Store-scoping** | Library functions use `db` direct; API routes use `storeDb(storeId)` | No — libraries were never migrated |
| **Expense classification** | Keyword match in `accounting.ts`, manual via route | Single impl but fragile |
| **Financial statements** | `pl/route.ts`, `balance-sheet/route.ts`, `cash-flow/route.ts`, `ratios/route.ts` + FPNA routes | Partial — P&L and Balance Sheet load everything in-memory; ratios recalculates cogs |
| **Journal entry types** | 13+ types used across code | No — Prisma comment, actual TS type, and runtime usage all disagree |
| **Fixed asset accounting** | `depreciation.ts` handles acquisition, depreciation, disposal | Yes (single impl) but disposal uses wrong journal type |
| **Tax tracking** | Inline in sale/refund (accounting.ts) + separate tax routes | Yes |
| **Reconciliation** | `reconcile/route.ts` + individual order reconcile route | Partial — different paths for POS shift close vs manual reconcile |

---

## View 4: By Risk Priority

### Critical — Fix This Sprint

**F17: Ratios double-counts COGS in expenses calculation**
```
FILE(S): src/app/api/admin/accounting/ratios/route.ts
TYPE: Logic mismatch (double-counting)
PATTERN FOUND: Line 17-19 queries COGS (account 5000) separately, but line 20-23 also includes
  COGS in expenses query (accounts starting with '5'). So `totalExpenses` includes COGS twice,
  and `netIncome = totalRevenue - totalCogs - totalExpenses` subtracts COGS twice.
RISK: Net income, net margin, ROA, and all ratios derived from net income are doubly penalized.
  Gross margin calculation is independent (line 48) and correct.
SEVERITY: Critical (financial reports wrong)
LIKELY ORIGIN: Two separate edit sessions — one added COGS tracking, another added the
  totalExpenses query without accounting for the overlap.
SUGGESTED FIX DIRECTION: Exclude COGS account (5000) from the expenses query, or exclude
  `totalCogs` from the `netIncome` formula. The two should not overlap.
```

**F2: storeId defaults to empty string**
```
FILE(S): src/lib/accounting.ts (line 168)
TYPE: Logic mismatch (data integrity)
PATTERN FOUND: `storeId: data.storeId ?? ''` — if caller omits storeId, it writes an empty string
  instead of either requiring it or deriving it from context.
RISK: Journal entries without a valid storeId are created. Since JournalEntry.storeId is required
  and relates to Store, this creates orphaned records with no store association.
SEVERITY: Critical (data integrity)
LIKELY ORIGIN: Original implementation didn't enforce storeId. Later multi-store additions
  pass storeId explicitly via callers, but the function itself doesn't enforce it.
SUGGESTED FIX DIRECTION: Make storeId required in the function signature, or throw if it's empty.
```

### High — Fix This Sprint

**F3 + F13 + F16: Library code uses global db instead of store-scoped db**
```
FILES: src/lib/cogs.ts, src/lib/auto-accounting.ts, src/lib/purchasing.ts
TYPE: Cross-service pattern drift
PATTERN FOUND: Three library modules use `import { db } from '@/lib/db'` directly instead of
  accepting a storeId and using `storeDb(storeId)`. API routes (which are the callers) all use
  store-scoped DB via `storeDb(admin.storeId)`.
RISK: In a multi-store deployment, journal entries for Store A could be recorded in Store B's
  general ledger if a route handler calls these functions without proper scoping.
SEVERITY: High (multi-tenant data leakage)
LIKELY ORIGIN: These library modules were written before the multi-store pattern was introduced.
SUGGESTED FIX DIRECTION: Refactor all three libraries to accept a `storeId` parameter and use
  `storeDb(storeId)` internally, OR ensure all callers pass it explicitly.
```

**F4: Fire-and-forget COGS recording**
```
FILE(S): src/app/api/orders/update-status/route.ts (line 39)
TYPE: Logic mismatch (silent failure)
PATTERN FOUND: `recordCOGS(orderId).catch(console.error)` — the promise is fired without await.
RISK: If the COGS recording fails, the API response already returned success to the caller.
  The error is silently swallowed by `.catch(console.error)` with no alerting or retry.
SEVERITY: High (silent data loss)
LIKELY ORIGIN: The route was written to not block the response, but proper queue/retry wasn't added.
SUGGESTED FIX DIRECTION: Either await the call (and handle failure via the route's error handler),
  or enqueue it in a proper background job system instead of fire-and-forget.
```

**F18: Shift-close creates journal entry without storeId**
```
FILE(S): src/app/api/admin/accounting/shift-close/route.ts (line 42)
TYPE: Logic mismatch
PATTERN FOUND: Calls `createJournalEntry` without passing `storeId`.
RISK: Inherits the empty-string storeId bug from F2, creating orphaned journal entries.
SEVERITY: High (data integrity)
SUGGESTED FIX DIRECTION: Pass `storeId: admin.storeId` in the journal entry call.
```

### Moderate — Fix This Sprint (if time) or Next Sprint

**F5: Duplicate entry-creation paths without atomic guards**
```
FILES: Multiple (see finding table)
PATTERN FOUND: auto-accounting, sync route, fulfillment route, and order-status route all
  can create journal entries for the same order. Most check for existing entries, but the
  check-and-create is not atomic (no DB transaction or unique constraint).
RISK: Concurrent calls could both pass the existence check and create duplicate entries.
SUGGESTED FIX DIRECTION: Add a unique constraint on [orderId, type] or [orderId, type, storeId]
  at the DB level, and wrap check+create in a Prisma transaction.
```

**F6: No Prisma transaction isolation in journal creation**
```
FILE(S): src/lib/accounting.ts (lines 150-179)
PATTERN FOUND: Account lookup (Promise.all), line creation, and entry creation are not wrapped
  in a Prisma $transaction. If the process fails between `lines` mapping and `journalEntry.create`,
  partial data isn't rolled back.
RISK: Incomplete journal entries under concurrent load or process failure.
SUGGESTED FIX DIRECTION: Wrap the entire create flow in `db.$transaction(...)`.
```

**F9: Bill/Purchase journal entries use wrong `type`**
```
FILE(S): src/lib/purchasing.ts (lines 33, 55, 136)
PATTERN FOUND: All three functions use `type: 'expense'` instead of `type: 'purchasing'`.
RISK: When filtering journal entries by type, purchase-related entries are misclassified as
  expenses. This distorts P&L reports that group by type.
SUGGESTED FIX DIRECTION: Change to `type: 'purchasing'`, which is already supported by
  createJournalEntry's type union.
```

**F10: Manufacturing hardcodes WIP/FG account codes**
```
FILE(S): src/lib/manufacturing.ts (lines 103-104)
PATTERN FOUND: Account codes 1320 (WIP) and 1330 (FG) are hardcoded strings rather than
  defined in the ACCOUNTS constant and configurable.
RISK: These accounts don't exist in the ACCOUNTS config, so they're invisible. If the chart
  of accounts is customized, these entries silently go to the wrong accounts.
SUGGESTED FIX DIRECTION: Add wip and finishedGoods to the ACCOUNTS config and reference them.
```

**F11: Overhead calculation hardcoded at 20%**
```
FILE(S): src/lib/manufacturing.ts (line 86)
PATTERN FOUND: Overhead is `totalLabor * 0.2` with no configuration mechanism.
RISK: This is a business assumption that may not hold across all products or stores.
SUGGESTED FIX DIRECTION: Pull overhead rate from work center or product config, or make it
  a parameter.
```

**F12: Consolidation/IC entries use wrong `type`**
```
FILE(S): src/lib/consolidation.ts (lines 52, 105)
PATTERN FOUND: Uses `type: 'reconciliation'` instead of `type: 'interCompany'` / `type: 'consolidation'`.
RISK: Can't distinguish consolidation entries from bank reconciliation entries in reports.
SUGGESTED FIX DIRECTION: Use `type: 'interCompany'` for IC transactions and `type: 'consolidation'`
  for the consolidation elimination entry.
```

**F7: Expense account mapping is fragile keyword-match**
```
FILE(S): src/lib/accounting.ts (lines 96-102)
PATTERN FOUND: Maps descriptions like "rent for office" to rent account via `description.includes('rent')`.
RISK: Ambiguous or multi-keyword descriptions get misclassified. No user override is possible
  per entry — once the keyword matches, the account is locked.
SUGGESTED FIX DIRECTION: Allow expense creation routes to pass an explicit account code override,
  and use keyword matching only as fallback.
```

**F14: P&L and Balance Sheet load all lines into memory**
```
FILES: pl/route.ts, balance-sheet/route.ts
PATTERN FOUND: Both routes fetch all accounts and their full journal lines, then sum
  in JavaScript. For large datasets this is memory-intensive and slow.
RISK: Performance degradation as data grows.
SUGGESTED FIX DIRECTION: Use Prisma `aggregate` with `_sum` (as the ratios route already does)
  instead of loading all lines.
```

**F19: Reconciliation route creates sale entry for COD orders**
```
FILE(S): src/app/api/admin/accounting/orders/[id]/reconcile/route.ts
PATTERN FOUND: Fires createSaleJournalEntry for COD orders during reconciliation,
  but the sync/auto-accounting routes may also create the same sale entry.
RISK: Duplicate sale entries for COD orders that go through both auto-accounting and reconciliation.
SUGGESTED FIX DIRECTION: Guard with existence check (already partially done) and use correct type.
```

### Cosmetic — Batch with Other Cleanup

**F1: JournalEntry.type schema comment outdated**
```
FILE(S): prisma/schema.prisma:1325
FIX: Update comment to list all 13+ types used in practice.
```

**F15: Asset disposal uses `depreciation` type**
```
FILE(S): src/lib/depreciation.ts:162
FIX: Change to `type: 'asset-acquisition'` or a dedicated `'disposal'` type.
```

**F20: Unused `applyStatusFilter` import**
```
FILE(S): src/app/api/admin/accounting/pl/route.ts:5
FIX: Remove unused import.
```

---

## State-Existence Assumptions Across Event Handlers

### Checked — No Issue Found

| Handler | Reads State It Didn't Create | Creator | Guarantee |
|---|---|---|---|
| `autoAccountOrderPayment` | Order (by orderId) | Order creation route | Explicit `findUnique` before use |
| `autoAccountReturn` | Return + Order (by returnId) | Return creation route | Explicit `findUnique` (includes order relation) |
| `autoAccountExpense` | Expense (by expenseId) | Expense creation route | Explicit `findUnique` before use |
| `recordCOGS` | Order (by orderId) | Order creation + fulfillment | Explicit `findUnique` before use |
| `createSaleJournalEntry` | Account codes | Bootstrap/seed | Existence check via `getAccountId` (throws if missing) |
| `createReconciliationJournalEntry` | Order (by id) | Caller (reconcile route) | Route does `findUnique` before calling |

### Flagged — State-Existence Not Guaranteed

**SE-F1: Sync route assumes orders exist with payment data**
```
HANDLER: sync/route.ts POST
STATE READ: Order + Expense records via sdb.order.findMany, sdb.expense.findMany
CREATOR: Order creation, payment processing
GUARANTEE: None — the sync route queries all paid orders and creates entries for those without
  existing journal entries. If an order is cancelled after payment, this route might still
  create a sale entry because it only filters by `paymentStatus: 'paid'`, not by order status.
```

**SE-F2: Order fulfillment records COGS but doesn't check if original sale entry existed**
```
HANDLER: orders/[id]/fulfill/route.ts
STATE READ: Order items with actualCost
CREATOR: Order creation (for the order), recordActualCost (for actualCost)
GUARANTEE: Records actual cost and COGS in sequence, but if the sale journal entry for this
  order hasn't been created yet (auto-accounting async), the COGS entry references accounts
  that aren't yet balanced against revenue for this order.
RISK: COGS may be recorded before revenue for the same order, causing temporary balance sheet
  distortion (though both will eventually exist).
```

---

## Unit/Representation Consistency Check

### Checked — No Issue Found

| Value | Created/Stored As | Downstream Uses | Consistent? |
|---|---|---|---|
| `order.totalAmount` | Float (app currency, EGP) | Sale, refund, reconcile entries | Yes |
| `product.price` | Float (selling price) | Order total calc, inventory valuation | Yes |
| `product.costPrice` | Float (unit purchase cost) | COGS calc, inventory valuation, BOM cost | Yes |
| `expense.amount` | Float (app currency) | Journal entry debit | Yes |
| `journalLine.debit` / `credit` | Float | P&L, Balance Sheet, Ratios — all use JS reduction | Yes |

### Flagged — Potential Mismatch

**UR-F1: Ratios route uses different aggregation than P&L/BS**
```
VALUE: totalRevenue, totalCogs, totalExpenses
CREATED/STORED: In journal lines as debits/credits per account code
RATIOS ROUTE: Uses Prisma `_sum.credit` / `_sum.debit` directly on account code prefix
P&L ROUTE: Loads all lines and computes balance = credit - debit per account
BALANCE SHEET: Loads all lines and computes balance = debit - credit for assets,
  credit - debit for liabilities/equity
OUTCOME: Ratios route only sums positive-side values (credits for revenue, debits for
  expenses/COGS) and ignores contra entries. This is likely correct for normal accounts,
  but would miss contra entries (e.g., sales returns reducing revenue via debit to 4000).
RISK: If a contra account exists (4100 Sales Returns), ratios won't account for it,
  overstating revenue and all derived metrics.
```

---

## Summary Statistics

| Metric | Value |
|---|---|
| Accounting API routes | 70+ |
| Accounting library modules | 7 (`accounting.ts`, `auto-accounting.ts`, `cogs.ts`, `consolidation.ts`, `depreciation.ts`, `manufacturing.ts`, `purchasing.ts`) |
| Total findings | 20 |
| Critical | 2 |
| High | 4 |
| Moderate | 11 |
| Cosmetic | 3 |
| Most common drift type | **Logic mismatch (12 findings)** — half involve wrong journal `type`, store scoping, or missing parameters |
| Biggest systematic issue | **Era 1 library code never migrated to multi-store pattern** (affects 3 library modules, 6+ call sites) |
| Most impactful bug | **F17: Ratios double-counts COGS** — directly distorts net income and all profitability ratios |
