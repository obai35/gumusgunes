# Accounting Engine — Phases 2–7

## Phase 2: Auto-Accounting
Automatically create journal entries when money-move events happen, removing the manual "Reconcile" step.

**Events to hook:**
1. `Order.paymentStatus → 'paid'` → create sale entry (debit asset, credit revenue)
2. `Return` created → create refund entry (debit sales returns, credit asset)
3. `Expense` created → create expense entry (debit expense account, credit cash/bank)
4. `Order.status → 'delivered'` → if paid, ensure sale entry exists
5. `Order.status → 'cancelled'` → if payment was captured, create reversing entry

**Implementation:**
- New module: `src/lib/auto-accounting.ts` with hook functions
- Inject calls into existing routes: order create/update-status, return, expense
- Add `Order.paymentStatus` → `paid` trigger webhook in Stripe webhook handler
- keep manual reconcile as override for edge cases
- Batch: allow admin to retro-run for historical orders

## Phase 3: Real COGS
Track actual unit cost per product and record COGS on fulfillment.

**Changes:**
- Add `costPrice` field to Product model (prisma migration)
- On purchase order receipt, calculate new weighted-average cost
- Record COGS journal entry when order fulfilled (status → delivered)
- Remove the `p.price * 0.6` fallback in inventory valuation
- New function: `calculateCOGS(orderItems)` in accounting.ts
- Inventory valuation route: use real costPrice, fallback to weighted avg from purchase orders

## Phase 4: Multi-Currency + Tax Liability
Handle transactions in non-EGP currencies and automate tax accounting.

**Currency:**
- Normalize all journal entries to base currency (EGP)
- Record `currency`, `exchangeRate`, `fxGainLoss` on journal entries
- Auto-calculate FX gain/loss on payment vs recognition
- New accounts: 1600 (Currency Translation Reserve), 6600 (FX Gain), 6700 (FX Loss)

**Tax:**
- Tax liability account: 2200 (Sales Tax Payable)
- On sale entries: split revenue into sales revenue + tax payable
- On refund entries: reverse tax payable
- Tax report: use actual tax liability from ledger, not recalculated from orders
- Support multiple tax rates from TaxRate model

## Phase 5: Audit Trail + Approval Workflows
Make journal entries immutable once approved, with full audit trail.

**Approval:**
- Add `status` (draft/pending/approved/rejected) and `approvedById`, `approvedAt` to JournalEntry
- New route: POST approve/reject journal entry
- Only approved entries affect financial reports
- Draft entries visible only to accounting admins
- Rejection requires comment

**Enhanced Audit:**
- Snapshots: before/after JSON diff on order/entry edits
- Immutable: approved entries cannot be deleted, only reversed
- New reversal entry type: links back to original entry

## Phase 6: BI Reports
Interactive reports with drill-down, export, and scheduling.

**Drill-down P&L:**
- Click income/expense line → see transaction detail
- Period comparison (month-over-month, year-over-year)
- Interactive date range selector

**Scheduled Reports:**
- New model: ScheduledReport (cron, recipients, format, report type)
- Node-cron or Vercel Cron Jobs for delivery
- Email PDF/CSV reports daily/weekly/monthly

**Enhanced Dashboard:**
- Real-time cash position
- Revenue vs target gauge
- Expense breakdown treemap
- Top 10 products by margin
- Customer concentration risk

## Phase 7: System Integration
Connect accounting to external systems.

**Bank Feed API:**
- Open Banking / Fintech API integration (Egyptian banks: CIB, QNB, NBE)
- Auto-import bank transactions daily
- AI matching: suggest journal entry matches based on description/amount
- Two-way sync: approved entries → bank reconciliation

**Payroll Module:**
- Employee model (name, salary, bank account, tax ID)
- Monthly payroll run: calculate salaries, deductions, taxes
- Create salary expense + bank transfer journal entries
- Payroll reports

**POS Auto-Accounting:**
- Shift close → auto-create summary journal entries
- Cash/card/bank transfer splits reflected correctly
- Shift discrepancy handling
