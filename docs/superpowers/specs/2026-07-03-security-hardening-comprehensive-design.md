# Comprehensive Security Hardening Design

Date: 2026-07-03
Based on: Full codebase security audit (24 findings: 4 Critical, 6 High, 7 Medium, 7 Low)

## Prerequisite: Existing Security Hardening

This spec builds upon foundational security work already implemented (documented in `2026-07-02-security-hardening-design.md`):
- `withAdmin` permission wrapper on admin routes
- `withRateLimit` rate limiting on sensitive endpoints
- Security headers (CSP, HSTS, etc.) in `next.config.ts`
- JWT migration to HttpOnly cookies
- Google OAuth customer login
- Seed route production guard
- File upload validation
- Hardcoded JWT secret removal

## 1. Secret Rotation & Git Purge (CRITICAL)

### 1.1 Current State
`.env` and `.env.local` are tracked in git history, exposing:
- `DATABASE_URL` with live Neon PostgreSQL password
- Google OAuth `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Placeholder JWT secrets (`dev-admin-secret-change-in-production`)
- Predictable `ENCRYPTION_KEY` (all hex chars in ascending order)
- `VERCEL_OIDC_TOKEN` JWT

### 1.2 Required Actions

**Rotate production secrets:**
1. `DATABASE_URL` — reset password via Neon dashboard, update Vercel env vars
2. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — generate new credentials in Google Cloud Console
3. `ADMIN_JWT_SECRET` — generate via `openssl rand -hex 64`
4. `NEXTAUTH_SECRET` — generate via `openssl rand -hex 64`
5. `ENCRYPTION_KEY` — generate new 32-byte hex key

**Purge `.env` from git:**
1. Add `.env*` to `.gitignore` (verify it exists)
2. Remove from tracking: `git rm --cached .env .env.local`
3. Purge from history: Use `git filter-branch` or `git filter-repo` to remove `.env` and `.env.local` from all commits
4. Force push to remote (coordinate with team)

**Encrypted data migration:**
- Only affected data: **payment method configurations** (API keys for Stripe/PayPal stored in `PaymentMethod.config`)
- Before rotation: read all payment methods, decrypt configs with old key, store in memory
- After rotation: re-encrypt with new key, update all records
- No other encrypted fields exist in the schema

**Create `.env.example`:**
- Template with all required env vars, empty placeholder values
- Document where each secret comes from
- Committed to git (no secrets)

## 2. Immediate Critical Code Fixes

### 2.1 SQL Injection via Admin Chat (CRITICAL)

**File:** `src/lib/admin-chat-tools.ts`

**Problem:** `$queryRawUnsafe` with only a `startsWith('SELECT')` check — trivially bypassable.

**Fix:**
- Remove the `dbQuery` tool entirely — provides raw SQL access no admin needs
- Remove the `listDbModels` tool — exposes full database schema
- Keep `runCommand`, `writeFile`, `editFile` but:
  - Shorten approval timeout from indefinite to 5 minutes
  - Sign approval payloads to prevent forgery
  - Log every tool execution to `activityLog` table

### 2.2 Missing Auth on Order Status Update (HIGH)

**File:** `src/app/api/orders/update-status/route.ts`

**Problem:** No authentication. Anyone can POST to update any order's status or paymentStatus.

**Fix:**
- Wrap with `withAdmin('orders')`
- Validate `value` against allowed status transitions:
  ```typescript
  const ALLOWED_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
  const ALLOWED_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded']
  ```

### 2.3 Missing Auth on Payment Routes (HIGH)

**Files:**
- `src/app/api/payments/paypal/create-order/route.ts`
- `src/app/api/payments/paypal/capture-order/route.ts`
- `src/app/api/payments/stripe/create-intent/route.ts`

**Problem:** No authentication, no rate limiting, error messages leaked.

**Fix:**
- Wrap with `withRateLimit` (10 req/min per IP)
- For create-intent/capture: validate against an active order session
- Stop leaking `err.message` — return generic error, log actual error server-side

### 2.4 Seed API Proxy Bypass (MEDIUM)

**File:** `src/proxy.ts`

**Problem:** Blanket bypass for `/api/admin/seed` routes. If `SEED_API_KEY` env var is missing, anyone can reseed.

**Fix:**
- Make seed fail-closed: block if `SEED_API_KEY` is not set
- Already has `NODE_ENV === 'production'` guard — keep and reinforce
- Add rate limiting: max 1 request per 60 seconds

### 2.5 CSRF Protection (HIGH)

**Problem:** No CSRF protection on any route. SameSite=Strict alone is insufficient for:
- Cross-subdomain attacks
- Initial site navigation triggering state changes
- Browser extensions stripping SameSite

**Fix:**
- Add `Origin`/`Referer` header validation middleware for all POST/PUT/DELETE endpoints
- Allowed origins from `ALLOWED_ORIGINS` env var (comma-separated)
- Apply at middleware level (`src/middleware.ts`) for broad coverage
- Return 403 with `'Invalid origin'` on mismatch

### 2.6 Error Message Leakage (HIGH)

**Problem:** Many routes return `err.message` to client, leaking internal details.

**Affected routes:**
- `/api/admin/auth/login` — returns `e instanceof Error ? e.message : 'Login failed'`
- `/api/payments/paypal/create-order` — returns `err.message`
- `/api/payments/paypal/capture-order` — returns `err.message`
- `/api/payments/stripe/create-intent` — returns `err.message`
- Various others

**Fix:**
- All catch blocks: log full error with `console.error`, return generic `'Internal server error'`
- Create shared error handler utility in `src/lib/api-error.ts`:
  ```typescript
  function handleApiError(error: unknown, context: string): NextResponse {
    console.error(`[${context}]`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  ```

## 3. Input Validation

### 3.1 Zod Schemas for All Routes (HIGH)

**Current state:** Some routes use Zod (`/api/orders`, `/api/reviews`, `/api/newsletter`, `/api/back-in-stock`), most don't.

**Routes needing Zod schemas:**

| Route | Fields to validate |
|---|---|
| `POST /api/auth/login` | email (email format), password (min 8 chars) |
| `POST /api/auth/register` | name, email, password (min 8, complexity), phone |
| `POST /api/admin/auth/login` | email, password, totpCode (optional, 6 digits) |
| `POST /api/admin/admins` | name, email (format), password (min 8, complexity), roleId (valid uuid) |
| `POST /api/admin/products/create` | name, description, price (> 0), stock (>= 0), categoryId, images (array of URLs), tags (optional array) |
| `POST /api/admin/categories` | name (1-100), slug (alphanumeric + hyphens), description, parentId (optional, valid uuid) |
| `PUT /api/admin/settings` | key (known keys only), value (type-validated by key) |
| `POST /api/user/cards` | cardholderName, last4, brand, expiryMonth, expiryYear, token |
| `POST /api/user/addresses` | label, fullName, phone, street, city, governorateId, building, floor, apartment, landmark |
| `PUT /api/user/profile` | name, phone, dateOfBirth |
| `POST /api/payments/stripe/create-intent` | orderId (valid uuid) |
| `POST /api/payments/paypal/create-order` | orderId (valid uuid) |
| `POST /api/payments/paypal/capture-order` | orderId (valid uuid), paypalOrderId |
| `POST /api/chat` | message (non-empty string), conversationId (optional) |

**Pattern to use:**
```typescript
import { z } from 'zod'

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.string().uuid(),
  images: z.array(z.string().url()).max(10).default([]),
  tags: z.array(z.string()).max(20).optional(),
}).strict()

export async function POST(req: Request) {
  const parsed = CreateProductSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  // use parsed.data
}
```

### 3.2 Strong Password Policy (LOW)

- Raise minimum from 6 to 8 characters
- Require: at least 1 uppercase, 1 lowercase, 1 digit
- Apply to: customer registration, admin creation, admin password change
- Use Zod `.refine()`:
  ```typescript
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a digit')
  ```

### 3.3 Rate Limiting Gaps (MEDIUM)

**Endpoints currently rate-limited:**
- Admin login: 5 req/30s
- Customer login: 10 req/60s
- Customer register: 10 req/60s
- Order creation: 10 req/60s
- Payment verification: 20 req/60s

**Endpoints needing rate limiting:**
| Endpoint | Suggested limit | Rationale |
|---|---|---|
| `POST /api/auth/login` | 5 req/30s | Admin login via NextAuth |
| `POST /api/reviews` | 5 req/60s per IP | Spam prevention |
| `POST /api/newsletter` | 3 req/60s per IP | Email bombing prevention |
| `POST /api/back-in-stock` | 5 req/60s per IP | Abuse prevention |
| `POST /api/chat` | 5 req/60s per IP | AI API cost protection |
| `POST /api/wishlist` | 30 req/60s per IP | Reasonable browsing |
| `GET /api/search` | 60 req/60s per IP | Scraping prevention |
| `POST /api/admin/chat` | 20 req/60s per admin | AI API cost protection |

**Fail-closed behavior:**
- `withRateLimit` currently degrades with `console.warn` when Upstash is unavailable
- Add config option: `failClosed: boolean` (default: false, set true for auth endpoints)
- When fail-closed and Upstash is down, return 429 with `'Rate limiting unavailable'`

## 4. XSS & Security Headers

### 4.1 Preview Page XSS (MEDIUM)

**File:** `src/app/preview/page.tsx:80`

**Problem:** `dangerouslySetInnerHTML` with settings data controlled by admins.

**Fix:**
Replace:
```tsx
<script dangerouslySetInnerHTML={{ __html: `window.__PREVIEW_SETTINGS__ = ${JSON.stringify(map)}` }} />
```

With:
```tsx
<script
  id="__PREVIEW_DATA"
  type="application/json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(map).replace(/</g, '\\u003c') }}
/>
```

And read it in JS:
```typescript
const data = JSON.parse(document.getElementById('__PREVIEW_DATA').textContent!)
```

### 4.2 Review Content Sanitization (MEDIUM)

- Add `sanitize-html` or `DOMPurify` (server-side) to sanitize review `title` and `comment` before storage
- Strip all HTML tags, allow only plain text
- Add on both create and update paths

### 4.3 CSP Improvement (MEDIUM)

**Current CSP issues:**
- `'unsafe-inline'` and `'unsafe-eval'` in script-src
- No `report-uri` for violation monitoring

**Fix:**
1. Add CSP reporting:
   ```
   Content-Security-Policy-Report-Only: ... ; report-uri /api/csp-report
   ```
2. Create `POST /api/csp-report` endpoint to collect violations
3. Log violations server-side for analysis
4. Work toward removing `'unsafe-eval'` — audit code for `eval()` usage
5. Add nonce generation for Next.js inline scripts when feasible

### 4.4 Caddyfile Headers (LOW)

Add to `Caddyfile`:
```caddy
header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "strict-origin-when-cross-origin"
}
```

### 4.5 React Strict Mode & TypeScript (MEDIUM)

- Enable `reactStrictMode: true` in `next.config.ts`
- Remove `ignoreBuildErrors: true` and fix surfaced type errors
- This is a security-relevant quality gate — type errors can hide security bugs

## 5. Audit Logging

### 5.1 Current State
`activityLog` table exists with `ActivityLog` model, but critical actions are not logged.

### 5.2 Actions to Log

Log to `activityLog` table with: `{ adminId, action, details, ip, timestamp }`:

| Action | Details |
|---|---|
| Admin login success | `{ adminId, email, ip }` |
| Admin login failure | `{ email, ip, reason }` |
| Admin created/deleted | `{ targetAdminId, newRole }` |
| Permission change | `{ targetAdminId, oldPermissions, newPermissions }` |
| Product price change > 20% | `{ productId, oldPrice, newPrice }` |
| Order status change | `{ orderId, oldStatus, newStatus }` |
| Admin chat tool execution | `{ tool, args (redacted), approved }` |
| Payment verification/rejection | `{ orderId, action, amount }` |
| Any admin mutation | `{ route, method, body (redacted) }` |

### 5.3 Implementation
Create `src/lib/audit.ts`:
```typescript
export async function logAudit(params: {
  adminId: string
  action: string
  details?: Record<string, unknown>
  ip?: string
}) {
  await db.activityLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      details: params.details ?? {},
      ip: params.ip ?? 'unknown',
    },
  })
}
```

## 6. Remaining Fixes

### 6.1 Payment Proof Uploads (LOW)

- Move from `public/uploads/payments/` to `private/uploads/payments/`
- Create protected API route `GET /api/admin/uploads/payments/:file` with `withAdmin('orders')`
- Add file type validation (allow only JPEG, PNG, WebP)
- Add file size limit (5MB max)
- Generate random filenames (not sequential order IDs + timestamps)

### 6.2 Cookie Scope on Logout (LOW)

**File:** `src/app/api/customer/auth/logout/route.ts`

Clear cookies at both paths:
```typescript
const paths = ['/', '/api']
for (const path of paths) {
  response.cookies.set('__session', '', {
    httpOnly: true, secure: true, sameSite: 'strict', path, maxAge: 0
  })
  response.cookies.set('__session_admin', '', {
    httpOnly: true, secure: true, sameSite: 'strict', path, maxAge: 0
  })
}
```

### 6.3 IDOR Info Leak Prevention (LOW)

- All `findFirst` queries that scope to user: return 404 on both "not found" and "not authorized"
- Current pattern: `if (!existing) return 404` — already correct, audit for consistency
- Return `{ error: 'Not found' }` (not 'Forbidden' or 'Unauthorized')

### 6.4 Password Reset Flow (LOW)

Add:
- `POST /api/auth/forgot-password` — accepts email, generates reset token, stores in new `ResetToken` table with expiry
- `POST /api/auth/reset-password` — accepts token + new password, validates strength, updates user
- Email sending via `nodemailer` (add dependency) with SMTP env vars:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@email.com
  SMTP_PASS=xxx
  SMTP_FROM=noreply@gumusgunes.com
  ```
- Token expiry: 1 hour, single-use only
- Rate limit: 3 requests per email per hour (prevent email bombing)

### 6.5 API Rate Limiting Fail-Open Audit (MEDIUM)

Audit all `withRateLimit` calls and add explicit fail-closed behavior for auth endpoints:
```typescript
withRateLimit(handler, {
  limit: 5, window: '30s',
  failClosed: true, // return 429 when Upstash unavailable
})
```

For non-auth endpoints, fail-open is acceptable (rate limiting is a nice-to-have for cost protection).

## 7. File Change Summary

### New Files
| File | Purpose |
|---|---|
| `src/lib/api-error.ts` | Shared error handler utility |
| `src/lib/audit.ts` | Audit logging utility |
| `src/app/api/csp-report/route.ts` | CSP violation report collector |
| `src/app/api/admin/uploads/payments/[file]/route.ts` | Protected file serving for payment proofs |
| `src/app/api/auth/forgot-password/route.ts` | Password reset request |
| `src/app/api/auth/reset-password/route.ts` | Password reset execution |
| `.env.example` | Template with all required env vars |

### Modified Files

| File | Changes |
|---|---|
| `src/lib/admin-chat-tools.ts` | Remove `dbQuery`, `listDbModels`; tighten approval system |
| `src/app/api/orders/update-status/route.ts` | Add `withAdmin('orders')`, validate status values |
| `src/app/api/payments/paypal/create-order/route.ts` | Add rate limiting, stop leaking errors |
| `src/app/api/payments/paypal/capture-order/route.ts` | Add rate limiting, stop leaking errors |
| `src/app/api/payments/stripe/create-intent/route.ts` | Add rate limiting, stop leaking errors |
| `src/proxy.ts` | Remove blanket seed bypass |
| `src/middleware.ts` | Add CSRF origin validation |
| `src/app/preview/page.tsx` | Fix XSS via JSON escaping |
| `src/app/api/reviews/route.ts` | Add content sanitization |
| `next.config.ts` | Enable reactStrictMode, fix TS errors |
| `Caddyfile` | Add security headers |
| `src/app/api/customer/auth/logout/route.ts` | Clear cookies at both paths |
| `src/app/api/admin/auth/login/route.ts` | Stop leaking error messages |
| `src/app/api/admin/seed/route.ts` | Fail-closed when SEED_API_KEY missing |
| `src/app/api/upload/payment-proof/route.ts` | Move to private directory |
| `src/app/api/auth/login/route.ts` | Add Zod validation |
| `src/app/api/auth/register/route.ts` | Add Zod validation + strong password |
| `src/app/api/admin/auth/login/route.ts` | Add Zod validation |
| `src/app/api/admin/admins/route.ts` | Add Zod validation |
| `src/app/api/admin/products/create/route.ts` | Add Zod validation |
| `src/app/api/admin/categories/route.ts` | Add Zod validation |
| `src/app/api/admin/settings/route.ts` | Add Zod validation |
| `src/app/api/user/cards/route.ts` | Add Zod validation |
| `src/app/api/user/addresses/route.ts` | Add Zod validation |
| `src/app/api/user/profile/route.ts` | Add Zod validation |
| `src/app/api/payments/stripe/create-intent/route.ts` | Add Zod validation |
| `src/app/api/payments/paypal/create-order/route.ts` | Add Zod validation |
| `src/app/api/payments/paypal/capture-order/route.ts` | Add Zod validation |
| `src/app/api/chat/route.ts` | Add Zod validation + rate limiting |
| `src/app/api/reviews/route.ts` | Add rate limiting |
| `src/app/api/newsletter/route.ts` | Add rate limiting |
| `src/app/api/back-in-stock/route.ts` | Add rate limiting |
| `src/app/api/wishlist/route.ts` | Add rate limiting |
| `src/app/api/search/route.ts` | Add rate limiting |
| `src/app/api/admin/chat/route.ts` | Add rate limiting |

### Deleted Files
| File | Rationale |
|---|---|
| `.env` | Remove from tracking, purge from history |
| `.env.local` | Remove from tracking, purge from history |

## 8. Implementation Order

The implementation must follow this strict order to avoid service disruption:

1. **Secret rotation + git purge** (done manually / coordinated)
2. **Critical fixes**: SQL injection fix, missing auth on order update, payment routes, seed proxy
3. **Error handling**: Stop leaking errors, add shared error handler
4. **Input validation**: Zod schemas on all routes, strong passwords
5. **Rate limiting**: Add missing rate limits, fail-closed for auth endpoints
6. **XSS fixes**: Preview page, review sanitization
7. **CSRF protection**: Origin validation middleware
8. **CSP + headers**: Reporting, Caddyfile hardening
9. **Audit logging**: Add activity log calls to critical actions
10. **File uploads**: Move to private directory
11. **Remaining fixes**: Cookie cleanup, IDOR audit, password reset flow
12. **Quality gates**: React strict mode, fix TS errors
