# POS Tabs Expansion — Design

Date: 2026-06-29

## Overview

Add four tabs to the POS system: POS (existing), Orders (search), Records (manual orders + expenses), and Hall Sale (shift report). Requires new data models (Supplier, Expense), expanded payment methods, and new API routes.

## Data Model

### New: Supplier

Stores supplier/vendor information for store purchases.

- id, name, phone, email?, address?, notes?, createdAt
- Relation: expenses[]

### New: Expense

Records store purchases (supplies, maintenance, etc.) linked to a shift.

- id, shiftId, supplierId?, amount, paymentMethod, description, invoiceNumber?, notes?, createdAt
- Relations: shift, supplier

### Modified: Order

Expand `paymentMethod` to support: cash, card, split, bank_transfer, instapay, wallet

### Modified: Shift

Add aggregate fields for new payment methods and expenses:
- totalBankTransfer (Float, default 0)
- totalInstapay (Float, default 0)
- totalWallet (Float, default 0)
- totalExpenses (Float, default 0)

## API Routes

### New Routes

- `GET /api/admin/pos/orders/search` — Search orders by receipt#, order#, name, date range
- `GET /api/admin/pos/orders/:id` — Get order details with items
- `POST /api/admin/pos/orders/manual` — Create a manual order (with any payment method)
- `GET /api/admin/pos/suppliers` — List suppliers, search by name
- `POST /api/admin/pos/suppliers` — Create a supplier
- `GET /api/admin/pos/expenses?shiftId=X` — List expenses for a shift
- `POST /api/admin/pos/expenses` — Create an expense
- `GET /api/admin/pos/shifts/history?branchId=X` — List all shifts for a branch
- `GET /api/admin/pos/shifts/hall-sale?shiftId=X` — Full hall sale report (income + expenses by method)

### Modified Routes

- `POST /api/admin/pos/checkout` — Accept new payment methods (bank_transfer, instapay, wallet)
- `POST /api/admin/pos/shifts/close` — Update new aggregate fields
- `GET /api/admin/pos/shifts/summary` — Include new payment method totals + expenses

## POS Tabs

### Tab 1: POS (unchanged)
Main selling interface.

### Tab 2: Orders
- Search by: receipt number, order number, customer name
- Date range filter (from/to)
- Results: table with receipt#, customer, total, payment method, date, actions
- Click row → view order details with items
- Action: reprint receipt

### Tab 3: Records
- **Sub-tab: Manual Order** — Select products, set quantity/price, choose any payment method, add notes
- **Sub-tab: Expense** — Select/create supplier, description, amount, payment method, invoice number, notes

### Tab 4: Hall Sale
Full shift report:
- Starting cash
- Income breakdown: cash, card, bank transfer, instapay, wallet (each as a row)
- Total income
- Expense breakdown by payment method
- Total expenses
- Net cash position:
  - Expected cash = Starting cash + Cash income - Cash expenses
  - Actual ending cash (from shift close)
  - Difference
