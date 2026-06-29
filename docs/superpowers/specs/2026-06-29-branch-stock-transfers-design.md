# Branch Stock Transfers Design

## Overview

Add per-branch inventory tracking with stock transfers between warehouse and branches. POS checkout deducts from branch stock instead of global stock. Admin UI for transfers, branch stock viewing, and transfer history.

---

## 1. Schema Changes

### New `BranchStock` model
```prisma
model BranchStock {
  id        String   @id @default(cuid())
  branchId  String
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  quantity  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([branchId, productId])
}
```

### New `StockTransfer` model
```prisma
model StockTransfer {
  id          String   @id @default(cuid())
  fromType    String   // warehouse, branch
  fromId      String?  // branchId if fromType=branch
  toType      String   // warehouse, branch
  toId        String?  // branchId if toType=branch
  productId   String
  product     Product  @relation(fields: [productId], references: [id])
  quantity    Int
  note        String?
  createdById String
  createdBy   Admin    @relation(fields: [createdById], references: [id])
  createdAt   DateTime @default(now())
}
```

### Existing model additions
- **Branch**: add `stocks BranchStock[]`
- **Product**: add `stocks BranchStock[]` and `transfers StockTransfer[]`

---

## 2. API Routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/admin/stock-transfers` | Create transfer (body: { fromType, fromId?, toType, toId?, items: [{productId, quantity}], note? }) |
| `GET` | `/api/admin/stock-transfers?branchId=X` | List transfer history (optional branch filter) |
| `GET` | `/api/admin/branch-stock?branchId=X` | Get branch stock with product info (name, sku, price) |
| `GET` | `/api/admin/branch-stock/all` | Get all branch stock with branch+product info (for dashboard) |

### Transfer flow (POST)
1. Validates source has enough stock
2. Runs in `$transaction`:
   - If fromType=warehouse: decrement `Product.stock`
   - If fromType=branch: decrement `BranchStock.quantity` (or create with negative if doesn't exist)
   - If toType=warehouse: increment `Product.stock`
   - If toType=branch: upsert `BranchStock` (increment quantity)
   - Create `StockTransfer` log entry
   - Create `InventoryLog` entry with type `TRANSFER`

---

## 3. POS Checkout Modification

When creating a POS order (has `shiftId`):
- Validate stock against `BranchStock` (not `Product.stock`)
- Deduct from `BranchStock` (not `Product.stock`)
- Decrement `BranchStock.quantity` for each item
- If `BranchStock` would go negative, reject the order

When creating a website order (no `shiftId`):
- Keep existing behavior: validate and deduct from `Product.stock`

---

## 4. UI — New Admin Page (`/admin/stock-transfers`)

### Tab 1: New Transfer
- Source dropdown: "Warehouse (Main Stock)" + list of branches
- Destination dropdown: list of branches + "Warehouse (Main Stock)"
- Product selector: search/select products, add to transfer list
- Transfer list: rows with product name, current source stock, quantity input, remove button
- Note field
- Submit button — validates, shows preview, executes

### Tab 2: Branch Stock
- Branch selector dropdown
- Table: product name, SKU, current stock at branch, main stock (warehouse)
- Search/filter by product name or SKU
- "Transfer to Branch" quick action button per row

### Tab 3: Transfer History
- Date range filter, branch filter
- Table: date, from → to, product, quantity, note, admin
- Paginated

---

## 5. Sidebar & Links

Add "Stock Transfers" to admin sidebar with `ArrowLeftRight` icon

---

## 6. Error Handling
- Transfer: validate source stock ≥ transfer quantity
- Transfer: validate fromId exists if fromType=branch
- Transfer: validate toId exists if toType=branch
- Transfer: prevent warehouse→warehouse or branch→same-branch
- POS: if `BranchStock` has insufficient stock, return 400 with message

---

## 7. Files to Create/Modify

### New files
- `src/app/api/admin/stock-transfers/route.ts` — POST create, GET list
- `src/app/api/admin/branch-stock/route.ts` — GET by branch, GET all
- `src/app/admin/stock-transfers/page.tsx` — main page with 3 tabs
- `src/app/admin/stock-transfers/NewTransfer.tsx` — transfer form component
- `src/app/admin/stock-transfers/BranchStockView.tsx` — branch stock table
- `src/app/admin/stock-transfers/TransferHistory.tsx` — history list

### Modified files
- `prisma/schema.prisma` — add BranchStock, StockTransfer models
- `src/app/api/admin/pos/checkout/route.ts` — deduct from BranchStock instead of Product.stock for POS orders
- `src/components/admin/Sidebar.tsx` — add Stock Transfers link
