# Implementation Plan: Accounting Phases 2–7

## Execution Order

```
Phase 2 ──→ Phase 3 ──→ Phase 4 ──→ Phase 5 ──→ Phase 6 ──→ Phase 7
   │            │            │                        │
   │            │       Prisma: add FX fields    add ScheduledReport model
   │       Prisma: add      + tax accounts         + cron runner
   │       costPrice        + split sale lines
   │
   │
Phase 2 can run without migrations ── just hooks into existing routes
```

## Task Breakdown

### Phase 2 — Auto-Accounting (no migration)
- [ ] 2.1 Create `src/lib/auto-accounting.ts` — `autoAccountOrderPayment(order)`, `autoAccountReturn(ret)`, `autoAccountExpense(expense)`
- [ ] 2.2 Hook into `POST /api/orders` — after paid card/PayPal, call `autoAccountOrderPayment`
- [ ] 2.3 Hook into Stripe webhook `payment_intent.succeeded` — call `autoAccountOrderPayment`
- [ ] 2.4 Hook into `POST /api/admin/orders/[id]/return` — call `autoAccountReturn`
- [ ] 2.5 Hook into `POST /api/admin/accounting/expenses` — call `autoAccountExpense`
- [ ] 2.6 Hook into `POST /api/admin/orders/verify-payment` — call `autoAccountOrderPayment`
- [ ] 2.7 Update sync route to use same logic
- [ ] 2.8 Tests

### Phase 3 — Real COGS (prisma migration + logic)
- [ ] 3.1 Prisma: add `costPrice Float?` to Product
- [ ] 3.2 Prisma: add `actualCost Float?` to OrderItem (snapshot of cost at time of sale)
- [ ] 3.3 Create `src/lib/cogs.ts` — `calculateCOGS`, `createCOGSJournalEntry`, `updateWeightedAverageCost`
- [ ] 3.4 Hook into purchase order receipt — update product costPrice
- [ ] 3.5 Hook into fulfillment (order status → delivered) — record COGS entry
- [ ] 3.6 Update inventory-valuation route — use real costPrice
- [ ] 3.7 Tests

### Phase 4 — Multi-Currency + Tax (prisma migration + logic)
- [ ] 4.1 Prisma: add `currency String @default("EGP")`, `exchangeRate Float @default(1)`, `fxGainLoss Float?` to JournalEntry
- [ ] 4.2 Add new default accounts (1600, 2200, 6600, 6700) in seed
- [ ] 4.3 Create `src/lib/tax-accounting.ts` — tax liability splitting on sale/refund
- [ ] 4.4 Update `createSaleJournalEntry` — split revenue into revenue + tax payable
- [ ] 4.5 Update `createRefundJournalEntry` — reverse tax payable
- [ ] 4.6 Create `src/lib/currency.ts` — FX conversion, gain/loss calculation
- [ ] 4.7 Update tax report route — use ledger-based tax liability
- [ ] 4.8 Tests

### Phase 5 — Audit Trail + Approvals (prisma migration + logic)
- [ ] 5.1 Prisma: add `status`, `approvedById`, `approvedAt`, `rejectedReason`, `reversesId` to JournalEntry
- [ ] 5.2 Create `src/lib/approval.ts` — approve, reject, reverse entry
- [ ] 5.3 New route: `POST /api/admin/accounting/journal/[id]/approve`
- [ ] 5.4 New route: `POST /api/admin/accounting/journal/[id]/reject`
- [ ] 5.5 New route: `POST /api/admin/accounting/journal/[id]/reverse`
- [ ] 5.6 Update all reports to filter by approved entries (or include draft with flag)
- [ ] 5.7 Enhanced audit: before/after JSON snapshots on order edits
- [ ] 5.8 Tests

### Phase 6 — BI Reports (frontend + API)
- [ ] 6.1 Prisma: add ScheduledReport model
- [ ] 6.2 Interactive drill-down P&L — click line → transaction list
- [ ] 6.3 Scheduled reports: CRUD API + cron route + email delivery
- [ ] 6.4 Enhanced dashboard: cash position gauge, expense treemap, top products
- [ ] 6.5 Month-over-month, year-over-year comparison toggles
- [ ] 6.6 Tests

### Phase 7 — System Integration (API + patterns)
- [ ] 7.1 Bank feed API adapter pattern (CIB/QNB/NBE)
- [ ] 7.2 Auto-import + smart matching service
- [ ] 7.3 Payroll: Employee model + payroll run + entries
- [ ] 7.4 POS auto-accounting on shift close — summary entries
- [ ] 7.5 Tests
