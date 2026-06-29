# Payment System Integration

## Overview
Add real payment processing (Stripe + PayPal) to the existing e-commerce checkout, retain existing manual methods (Bank Transfer, COD), and add Egyptian mobile wallets + InstaPay QR with a payment verification workflow.

## Payment Methods

| Method | Type | Processing |
|--------|------|------------|
| Card | Stripe Elements | Real-time |
| PayPal | PayPal SDK buttons | Real-time |
| Bank Transfer | Manual | Awaiting verification |
| Cash on Delivery | Manual | Collect on delivery |
| Vodafone Cash | Manual | Awaiting verification |
| Orange Cash | Manual | Awaiting verification |
| Etisalat Wallet | Manual | Awaiting verification |
| Fawry | Manual | Awaiting verification |
| InstaPay QR | Manual | Awaiting verification |

## Schema Changes

### Order model additions
```prisma
model Order {
  // ... existing fields
  stripePaymentIntentId String?   @unique // Stripe PaymentIntent ID
  paypalOrderId         String?   @unique // PayPal order ID
  idempotencyKey        String?   @unique // prevents duplicate order creation
  walletProvider        String?   // vodafone-cash | orange-cash | etisalat-wallet | fawry
  paymentProofUrl       String?   // URL to uploaded receipt/screenshot
  paymentReference      String?   // transaction reference number from customer
  paymentVerifiedAt     DateTime? // when admin verified payment
}
```

### Payment status values
- `pending` — awaiting payment
- `awaiting_verification` — customer claims they paid, needs admin check
- `paid` — confirmed
- `refunded` — refunded

### Order status (unchanged)
- `pending`, `processing`, `shipped`, `delivered`, `cancelled`

## Backend API Routes

### Stripe
- `POST /api/payments/stripe/create-intent` — creates PaymentIntent, returns clientSecret
- `POST /api/payments/stripe/webhook` — handles `payment_intent.succeeded`, updates order

### PayPal
- `POST /api/payments/paypal/create-order` — creates PayPal order, returns order ID
- `POST /api/payments/paypal/capture-order` — captures approved payment

### Verification (Admin)
- `POST /api/admin/orders/verify-payment` — approve payment (sets paid + processing)
- `POST /api/admin/orders/reject-payment` — reject with reason

### Upload
- `POST /api/upload/payment-proof` — customer uploads receipt screenshot

## Frontend Components

### CheckoutDialog changes
- Payment step shows all methods grouped by type (Real-time / Manual / Egypt)
- Selecting Card renders `<StripePayment />`
- Selecting PayPal renders `<PayPalPayment />`
- Selecting a wallet/InstaPay shows wallet details or QR code + reference input

### New components
- `StripePayment.tsx` — Stripe Elements card form, handles confirmCardPayment
- `PayPalPayment.tsx` — PayPal SDK button rendering
- `InstaPayQR.tsx` — displays store QR code + phone, reference input
- `WalletPayment.tsx` — shows wallet number, reference input

### Order success page / Order tracking
- Show upload receipt button for manual payment methods
- Allow entering transaction reference
- Show verification status

### Admin
- New "Payment Verification" tab in admin orders
- List orders with `paymentStatus = "awaiting_verification"`
- Approve/Reject with notes

## Dependencies
```
npm install stripe @stripe/stripe-js
```

PayPal uses `https://www.paypal.com/sdk/js?client-id=...`

## Environment Variables
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
INSTAPAY_QR_CODE_URL=/images/instapay-qr.png
INSTAPAY_PHONE=<your-instapay-phone>
VODAFONE_CASH_NUMBER=<your-vodafone-cash-number>
ORANGE_CASH_NUMBER=<your-orange-cash-number>
ETISALAT_WALLET_NUMBER=<your-etisalat-wallet-number>
FAWRY_REFERENCE=<your-fawry-ref>
```

## Pending Order Detection

Before creating a new order, the API checks if the customer's email already has a pending/processing order containing the same set of product IDs. If so, the response includes a warning that the frontend displays as a dialog:

> "You already have a pending order with the same items. Continue anyway or view your existing order?"

This prevents customers from accidentally placing duplicate orders when they forget they already ordered.

## Performance for Slow Networks

### Lazy Loading
- `next/dynamic` for heavy components: CheckoutDialog, CartDrawer, Stripe/PayPal components
- `next/image` with `loading="lazy"` for product images, blur placeholders
- Defer non-critical JavaScript (Google script, analytics)

### Network resilience
- Optimistic form submissions with loading states and spinners
- Timeout handling with retry (max 2 retries) for payment API calls
- Skeleton loaders during data fetching
- Preconnect to Stripe/PayPal/CDN origins in `<head>`
- Small bundle: keep Stripe/PayPal SDKs loaded on-demand only when payment method is selected

## Anti-Duplication Layer

Three-layer defense against duplicate orders:

1. **Client-side**: Generate a unique `idempotencyKey` (UUID) when checkout dialog opens. Disable submit button immediately on click to prevent double-submit. The same key is sent with the order creation request.

2. **API-side**: Before creating an order, check if `idempotencyKey` exists in DB. If it does, return the existing order instead of creating a duplicate. Also check if `stripePaymentIntentId` or `paypalOrderId` is already linked to an order.

3. **Webhook dedup**: Stripe webhook handler checks `payment_intent.id` against existing orders before updating. Uses Stripe's own idempotency for API calls.

## Data Flow

### Real-time payment (Stripe/PayPal)
1. User fills details, selects Card or PayPal
2. Frontend creates payment intent / PayPal order via API
3. User completes payment in embedded form / PayPal popup
4. On success, frontend calls POST /api/orders with payment ID
5. Webhook or capture confirms payment
6. Order status → processing

### Manual payment (Transfer/Wallet/InstaPay/COD)
1. User fills details, selects manual method
2. Frontend calls POST /api/orders with payment details
3. Order created with paymentStatus = "pending" (COD) or "awaiting_verification" (others)
4. Customer uploads proof on order success page
5. Admin verifies → paymentStatus = "paid", status = "processing"

## File Structure
```
src/app/api/payments/
  stripe/create-intent/route.ts
  stripe/webhook/route.ts
  paypal/create-order/route.ts
  paypal/capture-order/route.ts
src/app/api/admin/orders/verify-payment/route.ts
src/app/api/admin/orders/reject-payment/route.ts
src/app/api/upload/payment-proof/route.ts
src/components/store/
  StripePayment.tsx
  PayPalPayment.tsx
  InstaPayQR.tsx
  WalletPayment.tsx
  CheckoutDialog.tsx (modified)
src/lib/
  stripe.ts          — server-side Stripe init
  stripe-client.ts   — client-side Stripe / Elements init
  paypal.ts          — PayPal server helpers
```
