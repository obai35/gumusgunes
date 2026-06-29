# Excel Export & Order Returns/Edits Design

## Overview

Two features for the admin panel:
1. **Excel Export** — download accounting data (orders, branches, reports) as styled `.xlsx` files
2. **Order Returns & Edits** — process full/partial returns with restocking, edit order items and customer details, print return receipts for POS

---

## 1. Excel Export

### Library
- `exceljs` — supports styling (bold headers, currency format, column widths, frozen rows)

### API Routes
| Method | Route | Description |
|---|---|---|
| `GET` | `/api/admin/accounting/export/orders?search=&status=&paymentStatus=` | Export filtered orders as .xlsx |
| `GET` | `/api/admin/accounting/export/branches?period=day\|week\|month` | Export branch breakdown as .xlsx |
| `GET` | `/api/admin/accounting/export/reports?type=daily\|weekly\|monthly` | Export period reports as .xlsx |

Each endpoint:
- Sets `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Sets `Content-Disposition: attachment; filename="orders-YYYY-MM-DD.xlsx"`
- Returns the binary buffer

### UI Changes (Accounting Page)
- **Orders tab**: "Export Excel" button next to the filter button
- **Branches tab**: "Export Excel" button next to period toggle
- **Reports tab**: "Export Excel" button next to type toggle
- All buttons read current filters/period/type and pass them as params

### Excel Styling
- Header row: bold, navy background, white text, frozen row
- Columns: auto-width, currency cells formatted as `$#,##0.00`
- Sheet name matches data type (Orders, Branches, Reports)

---

## 2. Schema Changes

### New `Return` model
```prisma
model Return {
  id            String       @id @default(cuid())
  orderId       String
  order         Order        @relation(fields: [orderId], references: [id])
  returnNumber  String       @unique
  reason        String       // customer_change, defective, wrong_item, damaged, other
  refundMethod  String       // cash, store_credit, no_refund
  refundAmount  Float
  notes         String?
  restocked     Boolean      @default(false)
  processedById String
  processedBy   Admin        @relation(fields: [processedById], references: [id])
  createdAt     DateTime     @default(now())
  items         ReturnItem[]
}
```

### New `ReturnItem` model
```prisma
model ReturnItem {
  id           String   @id @default(cuid())
  returnId     String
  return       Return   @relation(fields: [returnId], references: [id], onDelete: Cascade)
  productId    String
  product      Product  @relation(fields: [productId], references: [id])
  quantity     Int
  refundAmount Float
}
```

### Order model additions
- `editHistory` — JSON string storing array of edits `[{ field, oldValue, newValue, editedBy, editedAt }]`
- `refundedAmount` — Float, total amount refunded across all returns

---

## 3. API Routes — Returns & Edits

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/admin/orders/[id]/return` | Create a return (body: items[], reason, refundMethod, notes). Restocks inventory, updates order refundedAmount. Returns the Return object. |
| `PUT` | `/api/admin/orders/[id]` | Edit order fields. Body supports: items[] (id, productId, quantity), customer fields (fullName, phone, address, city, etc.). Recalculates totals, adjusts stock diffs, appends to editHistory. |
| `GET` | `/api/admin/orders/[id]/returns` | List all returns for an order with items and product info |

### Return flow
1. Admin selects items + quantities to return
2. Picks reason from dropdown (customer_change, defective, wrong_item, damaged, other)
3. Picks refund method (cash, store_credit, no_refund)
4. On submit: creates Return + ReturnItems, restocks products (inventory log type `RETURN`), updates order.refundedAmount
5. If POS order: show "Print Return Receipt" button

### Edit flow
1. Admin clicks "Edit Order" on order detail page
2. Modal shows current items as editable rows (qty input, remove button)
3. Also editable: fullName, phone, address, city, notes
4. On save: calculates stock diffs (old qty vs new qty, removed items get full restock), updates order totals, appends edit to editHistory

---

## 4. Return Receipt (POS only)

Printable receipt generated after a POS return:
- Header: "RETURN RECEIPT" centered, store name, date
- Return #, original Receipt #
- Items table: product name, qty returned, refund amount
- Total refund, refund method
- Footer fields:
  - `Phone: _________________`
  - `Signature: _________________`
- "Processed by: [admin name]"

Triggered via `window.print()` after return is created.

---

## 5. UI Changes

### Accounting Page
- Overview: add `pendingRefunds` to overview API, display in stat card
- Orders: "Export Excel" button + "Returned" status filter option
- Branches: "Export Excel" button
- Reports: "Export Excel" button

### Admin Orders Page (`/admin/orders/[id]`)
- Add **"Returns" section** below order details, showing past returns table
- Add **"Process Return" button** — opens modal to select items, reason, refund method
- Add **"Edit Order" button** — opens modal for editing items/customer info
- Edit history timeline below order summary

### POS
- After checkout, if return is created, "Print Return Receipt" button appears (only for POS orders)

---

## 6. Files to Create/Modify

### New files
- `src/app/api/admin/accounting/export/orders/route.ts` — export orders to xlsx
- `src/app/api/admin/accounting/export/branches/route.ts` — export branches to xlsx
- `src/app/api/admin/accounting/export/reports/route.ts` — export reports to xlsx
- `src/app/api/admin/orders/[id]/return/route.ts` — create return
- `src/app/api/admin/orders/[id]/returns/route.ts` — list returns
- `src/app/api/admin/orders/[id]/route.ts` — edit order (PUT)

### Modified files
- `prisma/schema.prisma` — add Return, ReturnItem models, editHistory + refundedAmount on Order
- `src/app/admin/accounting/page.tsx` — export buttons + pendingRefunds display
- `src/app/api/admin/accounting/overview/route.ts` — add pendingRefunds to response
- `src/app/admin/orders/[id]/page.tsx` — add returns section, process return, edit order, edit history
- `src/app/pos/components/ReturnReceipt.tsx` — new printable receipt component

---

## 7. Error Handling
- Excel export: if no data, return empty workbook with header row only (not 404)
- Returns: validate items belong to the order, validate quantities don't exceed original, validate order isn't already fully returned
- Edits: validate stock availability for increased quantities, prevent edits on cancelled orders
- All routes return 400 with descriptive messages on validation failure, 500 on unexpected errors
