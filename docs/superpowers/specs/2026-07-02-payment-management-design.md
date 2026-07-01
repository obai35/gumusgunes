# Payment Management System — Design

## Goal
Replace scattered env vars and hardcoded payment config with a centralized admin-managed system. Add server-side payment verification for security.

## Architecture

### 1. Database Model

```prisma
model PaymentMethod {
  id            String   @id @default(cuid())
  code          String   @unique   // 'card', 'paypal', 'transfer', 'cod', 'instapay', 'vodafone-cash', 'orange-cash', 'etisalat-wallet', 'fawry'
  name          String             // English display name
  nameAr        String?            // Arabic display name
  description   String?
  descriptionAr String?
  isActive      Boolean  @default(true)
  sortOrder     Int      @default(0)   // Display order in checkout
  config        String   @default("{}") // AES-encrypted JSON string
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Config JSON (encrypted) per method

| Method | Config Fields |
|--------|--------------|
| `card` | `{ "publishableKey": "...", "secretKey": "...", "webhookSecret": "..." }` |
| `paypal` | `{ "clientId": "...", "clientSecret": "...", "sandbox": true }` |
| `transfer` | `{ "bankName": "...", "bankNameAr": "...", "iban": "...", "referenceInstructions": "...", "referenceInstructionsAr": "..." }` |
| `cod` | `{ "handlingFee": 2 }` |
| `instapay` | `{ "phone": "...", "qrUrl": "...", "qrUrlAr": "..." }` |
| `vodafone-cash` | `{ "number": "..." }` |
| `orange-cash` | `{ "number": "..." }` |
| `etisalat-wallet` | `{ "number": "..." }` |
| `fawry` | `{ "reference": "..." }` |

### 2. Encryption

A utility in `src/lib/encryption.ts`:
- `encrypt(text: string): string` — AES-256-GCM encrypt with `ENCRYPTION_KEY` env var
- `decrypt(encrypted: string): string` — decrypt
- The `ENCRYPTION_KEY` env var must be 32 hex chars (256-bit)
- Only `config` field is encrypted; other fields (name, isActive) are plaintext

### 3. Admin Page — `/admin/payments`

Two-tab layout following the existing admin pattern.

**Tab 1 — Settings:**
- Table of all 9 payment methods
- Columns: sort order number, name, code, active toggle, "Configure" button
- Clicking Configure opens an inline form/modal with method-specific fields
- Validation: required fields per method type
- Save updates the DB (config gets encrypted before storage)

**Tab 2 — Verification:**
- List of orders where `paymentStatus = 'awaiting_verification'`
- Shows: order number, customer, amount, payment method, reference/note entered by customer, date
- Actions: **Approve** (POST /api/admin/payments/verify) → marks as paid
- Actions: **Reject** (POST /api/admin/payments/reject) → prompts for reason, marks as rejected
- Also shows summary counts: pending verification, verified today, rejected

### 4. API Routes

#### Public endpoints
- `GET /api/payment-methods` — returns active methods (sorted by sortOrder) with decrypted config
- `POST /api/orders` — enhanced verification (see Security below)

#### Admin endpoints
- `GET /api/admin/payment-methods` — list all methods with decrypted config
- `PUT /api/admin/payment-methods/[id]` — update name, isActive, sortOrder, config (config encrypted before save)
- `GET /api/admin/payments/verifications` — list orders awaiting verification + stats
- `POST /api/admin/payments/verify` — body: `{ orderId }` → marks paymentStatus='paid', status='processing', records admin who verified
- `POST /api/admin/payments/reject` — body: `{ orderId, reason }` → marks paymentStatus='rejected', appends reason to notes

### 5. Security — Server-Side Payment Verification

#### Stripe (card)
On order creation (`POST /api/orders`):
1. Retrieve PaymentIntent from Stripe using `stripePaymentIntentId`
2. Verify `status === 'succeeded'`
3. If yes → create order with paymentStatus='paid'
4. If no → create order with paymentStatus='pending', await webhook
5. Webhook (`/api/payments/stripe/webhook`) continues to act as fallback confirmation

#### PayPal
On order creation (`POST /api/orders`):
1. Call PayPal API to verify capture status using `paypalOrderId`
2. Verify `status === 'COMPLETED'`
3. If verified → create order with paymentStatus='paid'

#### Manual methods (transfer, wallets, instapay, cod)
- COD: paymentStatus='pending' (paid on delivery)
- All others: paymentStatus='awaiting_verification'
- Admin must verify manually via the Verification tab

### 6. Frontend Updates

#### `CheckoutContent.tsx`
- On mount: fetch `GET /api/payment-methods` → filter active, sort by sortOrder
- Payment method buttons rendered in server-defined order
- Grouping: methods with `config.type` can be grouped (real-time vs manual)

#### `WalletPayment.tsx`
- Receives `method` prop with full config
- Reads wallet number from `config.number`
- Removes reliance on `NEXT_PUBLIC_VODAFONE_CASH_NUMBER` etc.

#### `InstaPayQR.tsx`
- Receives `method` prop with full config
- Reads `config.phone`, `config.qrUrl` from config

#### `StripePayment.tsx`
- Receives `publishableKey` from the method config (fetched from API)
- Calls `loadStripe(key)` dynamically with the admin-configured key

#### `PayPalPayment.tsx`
- Receives `clientId` from the method config
- Loads PayPal SDK with the admin-configured client ID

#### Translations
- Remove hardcoded bank transfer details from `translations.ts`
- Replace with dynamic lookup from payment method config

### 7. Seed Data

On first deploy (or migration), seed all 9 methods with default values:
- `isActive: true` for card, paypal, transfer, cod
- `isActive: false` for Egyptian wallets (admin enables when ready)
- Sort order: card=1, paypal=2, transfer=3, cod=4, instapay=5, vodafone-cash=6, orange-cash=7, etisalat-wallet=8, fawry=9
- Config includes placeholder text prompting admin to configure

## Files to Create
- `prisma/migrations/` — add PaymentMethod model
- `prisma/seed.ts` — add payment method seeding
- `src/lib/encryption.ts` — AES encrypt/decrypt utility
- `src/app/api/payment-methods/route.ts` — public endpoint
- `src/app/api/admin/payment-methods/route.ts` — list all
- `src/app/api/admin/payment-methods/[id]/route.ts` — update
- `src/app/api/admin/payments/verifications/route.ts` — list awaiting
- `src/app/api/admin/payments/verify/route.ts` — approve
- `src/app/api/admin/payments/reject/route.ts` — reject
- `src/app/admin/payments/page.tsx` — admin page shell
- `src/components/admin/payments/SettingsTab.tsx` — settings tab
- `src/components/admin/payments/VerificationTab.tsx` — verification tab
- `src/components/admin/payments/MethodFormModal.tsx` — edit modal

## Files to Modify
- `prisma/schema.prisma` — add PaymentMethod model
- `src/components/store/CheckoutContent.tsx` — fetch methods from API
- `src/components/store/WalletPayment.tsx` — read from method prop
- `src/components/store/InstaPayQR.tsx` — read from method prop
- `src/components/store/StripePayment.tsx` — use dynamic key
- `src/components/store/PayPalPayment.tsx` — use dynamic client ID
- `src/app/api/orders/route.ts` — server-side Stripe/PayPal verification
- `src/components/admin/Sidebar.tsx` — add Payments link
- `src/lib/i18n/translations.ts` — remove hardcoded bank details
