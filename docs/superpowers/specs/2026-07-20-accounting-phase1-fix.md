# Accounting Phase 1 — Fix Core Bugs & Solidify Foundation

**Date:** 2026-07-20
**Status:** Draft
**Build Order:** Step 1 of 7 (sequential)

## Objective

Fix 5 known bugs in the accounting engine and add type-safe error handling, proper validation, and unit tests to create a solid foundation for subsequent features (auto-accounting, real COGS, audit trail, BI, tax).

## Scope

Only `src/lib/accounting.ts` and the reconcile API route. No UI changes. No new features. No changes to COGS estimation (deferred to Phase 3).

## Bugs

| ID | Description | File | Severity |
|----|------------|------|----------|
| B1 | COD orders debit Cash (1000) instead of Accounts Receivable (1200) | `accounting.ts:80` | High |
| B2 | Split payments ignored — `cashAmount`/`cardAmount` unused | `accounting.ts:80-90` | High |
| B3 | Refunds for COD orders credit Cash instead of AR | `accounting.ts:100` | High |
| B4 | All expenses map to `other` (5500) — no category routing | `accounting.ts:122` | Medium |
| B5 | Reconcile route double-counts bank_transfer (sale + reconciliation entries) | `reconcile/route.ts:18-24` | Medium |

## Changes

### 1. Account Resolution Table

Replace ad-hoc if/else with a central mapping:

```typescript
const PAYMENT_METHOD_TO_ASSET: Record<string, string> = {
  cash: '1000',
  card: '1000',
  bank_transfer: '1100',
  instapay: '1000',
  wallet: '1000',
  cod: '1200',       // ← FIX B1, B3
  split: null,       // handled specially
}
```

New helper function:

```typescript
function getDebitAccount(method: string): string
```

### 2. Split Payment Support (FIX B2)

`createSaleJournalEntry` signature updated — the `cashAmount`/`cardAmount` fields already exist on the Order model but are unused. When `paymentMethod === 'split'`, generate one debit line per payment method:

```
(Dr) Cash (1000): cashAmount
(Dr) Card (1000): cardAmount
(Cr) Sales Revenue (4000): totalAmount
```

For single-payment methods, behavior is unchanged but uses the account table.

### 3. Refund Account Resolution (FIX B3)

`createRefundJournalEntry` uses the same account table. For COD, the refund entry becomes:

```
(Dr) Sales Returns (4100): refundedAmount
(Cr) AR (1200): refundedAmount    ← instead of Cash
```

### 4. Error Handling (FIX B5 + foundation)

Introduce `AccountingError` class:

```typescript
class AccountingError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_ACCOUNT' | 'UNBALANCED_ENTRY' | 'INVALID_AMOUNT' | 'DUPLICATE_ENTRY'
  ) { super(message) }
}
```

`createJournalEntry` validates:
- Debits === Credits (throws `UNBALANCED_ENTRY`)
- All amounts > 0 (throws `INVALID_AMOUNT`)
- All account codes exist (throws `INVALID_ACCOUNT`)

The reconcile route propagates these errors instead of silently catching.

### 5. Reconcile Route Fix (FIX B5)

For `bank_transfer` orders: the sale entry already debits Bank. The reconcile action only marks `reconciledAt`, and if a bank_transfer is not already journalized, only creates the sale entry (no separate reconciliation entry).

For COD orders: reconcile creates the collection entry:
```
(Dr) Cash (1000): amount
(Cr) AR (1200): amount
```

**Important:** The reconcile route currently marks `reconciledAt` BEFORE creating journal entries. If entry creation fails, the order is left as reconciled with no journal entry. Fix: create journal entries BEFORE marking reconciled.

### 6. Split Payment Validation

When `paymentMethod === 'split'`, validate that `cashAmount + cardAmount === totalAmount`. If mismatch, throw `AccountingError('INVALID_AMOUNT')`.

### 6. Tests

New file: `src/lib/accounting.test.ts`

| Test | Validates |
|------|-----------|
| COD sale debits AR | `createSaleJournalEntry({ paymentMethod: 'cod' })` line 0 account = 1200 |
| Cash sale debits Cash | `createSaleJournalEntry({ paymentMethod: 'cash' })` line 0 account = 1000 |
| Bank transfer debits Bank | `createSaleJournalEntry({ paymentMethod: 'bank_transfer' })` line 0 account = 1100 |
| Split generates 2 debit lines | 2 lines, sums to totalAmount |
| Refund for COD credits AR | `createRefundJournalEntry({ paymentMethod: 'cod' })` credit line account = 1200 |
| Unbalanced entry throws | Mismatched debits/credits throws AccountingError |
| Zero amount throws | `createJournalEntry` with 0 amount throws |
| Validation passes on balanced entry | No throw on valid entry |

Tests use `vitest` (project standard — confirmed by `src/lib/api-error.test.ts`). They mock `db` using `vi.mock('@/lib/db')` so no real database calls. This tests the full `createSaleJournalEntry`, `createRefundJournalEntry`, and `createJournalEntry` functions with mocked Prisma.

## File Changes

| File | Change |
|------|--------|
| `src/lib/accounting.ts` | Add account table, split support, AccountingError, validation |
| `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts` | Fix double-count, propagate errors |
| `src/lib/accounting.test.ts` | New — unit tests |

## Non-Goals

- No UI changes (the reconcile button stays the same)
- No COGS estimation changes (deferred to Phase 3)
- No auto-accounting hooks (deferred to Phase 2)
- No audit trail (deferred to Phase 5)
