# Admin Panel & POS System — Design Doc

## Overview

Add a full admin panel and in-store POS (Point of Sale) system to the Gümüş Güneş jewelry e-commerce site. The admin panel lives at `/admin/*` and uses next-auth for authentication.

## Schema Changes

### New Models

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String   // bcrypt hash
  role      String   @default("admin") // admin, superadmin
  createdAt DateTime @default(now())
}

model InventoryLog {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  type      String   // "in" | "out" | "adjustment" | "sale"
  quantity  Int
  note      String?
  orderId   String?  // link to Order if from POS sale
  createdAt DateTime @default(now())
}

model Discount {
  id         String   @id @default(cuid())
  code       String   @unique
  type       String   // "percentage" | "fixed"
  value      Float
  minOrder   Float?
  maxUses    Int?
  usedCount  Int      @default(0)
  isActive   Boolean  @default(true)
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
}
```

### Order Model Additions

Add to existing `Order` model:
- `discountId String?` (relation to Discount)
- `discountAmount Float?`
- `paymentStatus String @default("pending")` // pending, paid, refunded
- `processedById String?` (relation to Admin)

## Auth

- **next-auth** with `CredentialsProvider`
- Admin logs in at `/admin/login` with email + password
- Passwords hashed with bcrypt
- Middleware protects `/admin/*` routes (except `/admin/login`)

## Routes

| Route | Description |
|-------|-------------|
| `/admin/login` | Login form |
| `/admin` | Dashboard — stats, recent orders, low stock alerts, revenue chart |
| `/admin/orders` | Order data table with filters |
| `/admin/orders/[id]` | Order detail with status management |
| `/admin/products` | Product data table |
| `/admin/products/new` | Add product form |
| `/admin/products/[id]/edit` | Edit product form |
| `/admin/inventory` | Inventory log table + manual adjustment form |
| `/admin/pos` | POS checkout interface |
| `/admin/discounts` | Discount code management |

## Admin Layout

- Sidebar with navigation links to each section
- Active state highlighting
- Header with admin name and logout
- Responsive — sidebar collapses on mobile

## Dashboard

- Stat cards: orders today, revenue (week), low stock count, pending orders
- Recent orders table (last 10)
- Low stock products list (stock < 5)
- Weekly revenue bar chart (recharts)

## Order Management

- DataTable with: order number, customer, date, total, status, payment
- Filters: status, date range, search (order number / email)
- Detail page: customer info, items, shipping address
- Status update: dropdown (pending → processing → shipped → delivered)
- Payment status update
- Notes display

## Product Management

- DataTable: name, SKU, category, price, stock, active status
- Inline toggle switches for isActive, isFeatured, isNew, isBestseller
- Add/Edit form with all product fields
- Image URL management
- Soft delete (toggle isActive)

## POS System

- Product search by name or SKU
- Add to cart with quantity
- Cart summary with line totals
- Discount code lookup and application
- Customer info form (name, email, phone)
- Payment method selection (cash, card)
- Complete sale: creates Order, deducts stock, logs InventoryLog
- Success confirmation

## Inventory Management

- Log table: date, product, type, quantity, note
- Manual stock adjustment form
- Low stock filter view

## Implementation Order

1. Schema migration + seed admin user
2. next-auth credentials provider + /admin/login
3. Middleware protection
4. Admin layout with sidebar
5. Dashboard page
6. Order management (list + detail)
7. Product management (table + forms)
8. POS system
9. Inventory log + adjustments
10. Discount code management
