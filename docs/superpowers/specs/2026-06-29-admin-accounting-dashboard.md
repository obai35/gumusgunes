# Admin Accounting Dashboard

**Goal:** Add a dedicated accounting tab to the admin panel for viewing orders across all branches, closing orders (fulfillment + payment reconciliation), tracking branch performance, and viewing time-based reports.

## Data Model Changes

Add to Order model:
- `reconciledAt DateTime?` — when payment was reconciled by accountant
- `fulfilledAt DateTime?` — when order was marked delivered/fulfilled

## API Routes

| Endpoint | Purpose |
|----------|---------|
| `GET /api/admin/accounting/overview` | Summary: today's revenue, pending orders, unreconciled payments, open shifts per branch |
| `GET /api/admin/accounting/orders` | All orders with branch info, filters: status, paymentStatus, branchId, dateFrom, dateTo, search |
| `POST /api/admin/accounting/orders/[id]/fulfill` | Mark order as delivered (status→delivered, set fulfilledAt) |
| `POST /api/admin/accounting/orders/[id]/reconcile` | Mark payment as reconciled (set reconciledAt) |
| `GET /api/admin/accounting/branches` | Branch performance: revenue, orderCount, payment method splits. Query: period (day/week/month) |
| `GET /api/admin/accounting/reports` | Time-based summaries. Query: type (daily/weekly/monthly), from, to |

## UI

### Admin Sidebar
Add "Accounting" link with Receipt icon between "Orders" and "Receipts".

### Page Structure
Single page at `/admin/accounting` with sub-tabs:

**Overview:**
- Summary cards: Today's Revenue, Pending Orders, Unreconciled, Open Shifts
- Recent orders list
- Quick stats

**Orders:**
- Search & filter bar (status, payment status, branch, date range, text search)
- Orders table: receipt#, branch, customer, total, status, payment, date, actions
- Row click → order detail drawer with items
- Action buttons: Mark Delivered, Reconcile Payment

**Branches:**
- Period selector: Day | Week | Month
- Branch cards: name, revenue, order count, cash/card/other breakdown
- Revenue comparison between branches

**Reports:**
- Time period selector (daily/weekly/monthly)
- Table: period, total revenue, order count, avg order value
- Summary totals
