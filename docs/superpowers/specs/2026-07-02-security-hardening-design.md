# Security Hardening Design

## Overview

Comprehensive security hardening for Gümüş Güneş e-commerce site: admin API authentication, rate limiting, security headers, JWT cookie migration, Google OAuth, file upload restrictions, and cleanup.

## 1. Admin API Route Authentication

### Pattern: Reusable `withAdmin` Wrapper

Create a higher-order function that wraps Next.js route handlers:

```typescript
function withAdmin(
  handler: (req, { admin, params }) => Promise<NextResponse>,
  requiredPermission?: string
)
```

- Reads JWT from **HttpOnly cookie** first, falls back to `Authorization: Bearer` header (migration compatibility)
- Calls `getAdminFromToken()` to verify + load admin + role permissions
- Returns 401 if no/invalid token, 403 if missing required permission
- Passes `{ admin }` context to handler
- All admin routes that already have auth use this; all that don't get it added

### Routes by Permission

| Permission | Routes |
|---|---|
| `products` | Products CRUD, bulk ops, toggle, inventory adjust |
| `orders` | Orders list, payment verify/reject, returns |
| `customers` | Customers list |
| `payments` | Payment methods CRUD, verifications list |
| `shipping` | Methods, rates, rules, shipments |
| `discounts` | Discounts create/toggle |
| `categories` | Categories CRUD (already authed) |
| `reviews` | Reviews CRUD (already authed) |
| `newsletter` | Newsletter list/delete (already authed) |
| `admins` | Admin/role management (already authed) |
| `settings` | Site settings PUT |
| `accounting` | Expenses, suppliers, reports, exports |
| `branches` | Branches CRUD, branch stock |
| `pos` | POS checkout, void, shifts |
| `activity` | Activity logs |
| `admin` | Chat agent |
| `seed` | Seed route (also disabled in production) |

## 2. Rate Limiting

### Pattern: Reusable `withRateLimit` Wrapper

```typescript
function withRateLimit(
  handler: (req, ctx) => Promise<NextResponse>,
  options: { limit: number; window: string; identifier?: (req) => string }
)
```

- Uses Upstash Ratelimit with sliding window
- Default identifier: IP from `x-forwarded-for`
- Returns 429 with `Retry-After` header and JSON error body
- Applied to sensitive routes:

| Route | Limit | Window |
|---|---|---|
| Admin login | 5 | 30s |
| Customer login/register | 10 | 60s |
| Order creation | 10 | 60s |
| Payment verification | 20 | 60s |
| Any admin mutation | 60 | 60s |

### Composability

```typescript
export const POST = withRateLimit(withAdmin(handler, 'orders'), { limit: 10, window: '60s' })
```

## 3. Security Headers

Add to `next.config.ts` global `/(.*)` source:

| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://*.paypal.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://*.googleusercontent.com https://*.stripe.com; connect-src 'self' https://*.stripe.com https://*.paypal.com; frame-src https://*.stripe.com https://*.paypal.com;` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-XSS-Protection` | `1; mode=block` |

CSP allows inline scripts/styles (Next.js requirement), Stripe/PayPal domains for payment processing, Google user content for avatars.

## 4. JWT → HttpOnly Cookies

### Auth Flow (Admin + Customer)

**Login (admin):**
1. `POST /api/admin/auth/login/verify` — credential + TOTP check
2. Sign JWT, set as `__session_admin` cookie: `HttpOnly; Secure; SameSite=Strict; Path=/api; Max-Age=86400`
3. Response includes `{ admin: { id, name, email, role } }` (no token in body)
4. Clear `localStorage` token from admin-auth-store (frontend-only removal)

**Login (customer):**
1. `POST /api/customer/auth/login` — email + password check
2. Same cookie approach with `__session` cookie, 7-day expiry
3. Register endpoint sets same cookie

**Logout:** Set cookie with `Max-Age=0`

**Auth check in `withAdmin`/`withCustomer`:** Read `__session_admin` or `__session` cookie, fallback to `Authorization` header for migration compatibility.

**Frontend changes:**
- `admin-auth-store.ts` — remove persist middleware, derive auth state from `GET /api/admin/auth/me`
- `auth-store.ts` — same for customer
- Keep `Authorization` header sending for 30 days, then remove

### CSRF Protection

Since cookies are auto-attached, add CSRF protection for mutation endpoints:

- `GET /api/csrf-token` — returns random token, set as `__csrf` cookie
- Frontend reads cookie, sends `X-CSRF-Token` header on mutations
- Server validates match

Or simpler: Use `SameSite=Strict` (which the cookies already have), which blocks cross-site form submissions entirely.

**Decision:** SameSite=Strict is sufficient for this SPA (no server-rendered forms from external sites). Skip CSRF token endpoint unless we add server-rendered forms later.

## 5. Google OAuth (Customer Login)

### Schema Changes

Add to `User` model:
```prisma
avatar      String?
dateOfBirth DateTime?
```

### OAuth Flow

1. Customer clicks "Sign in with Google" button
2. Frontend redirects to `GET /api/customer/auth/google`
3. Backend redirects to Google OAuth consent URL with scope: `openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.phonenumbers.read`
4. Google redirects to `GET /api/customer/auth/google/callback?code=...`
5. Backend exchanges code for tokens, calls Google People API
6. Extracts: `{ name, email, picture, birthdays[0].date, phoneNumbers[0].value }`
7. Upserts User by email with `googleId`, `name`, `email`, `avatar`, `dateOfBirth`, `phone`
8. Signs JWT, sets HttpOnly cookie, redirects to frontend with session

### Environment Variables

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://.../api/customer/auth/google/callback
```

## 6. Admin Customers Endpoint

Add `requirePermission('customers')` to `GET /api/admin/customers`.

## 7. Admin Chat Route

Add `requirePermission('admin')` to `POST /api/admin/chat`.

The chat agent already requires admin approval for dangerous operations (write file, run command, git operations). Adding route-level auth closes the direct API attack vector.

## 8. Seed Route

Add check at top of handler:
```typescript
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
}
```
Plus `requirePermission('seed')` for non-production environments.

## 9. File Upload

Add to `POST /api/upload/payment-proof`:
- `requirePermission('orders')` auth check
- Validate MIME type is `image/jpeg`, `image/png`, `image/webp`
- Validate file size ≤ 5MB
- Validate file extension is `.jpg`, `.jpeg`, `.png`, `.webp`

## 10. Hardcoded JWT Secrets

Replace:
```typescript
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'admin-secret-change-in-production'
```
With:
```typescript
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!
if (!ADMIN_JWT_SECRET) throw new Error('ADMIN_JWT_SECRET is required')
```

Same for customer JWT secret. Add validation at module load time.

## 11. PrismaClient Consolidation

Replace standalone `new PrismaClient()` instances with shared import from `src/lib/db.ts`. Routes affected: customers, products/create, products/update, stock-transfers, activity, and any others.

## Files Modified

- `src/lib/admin-permissions.ts` — add `withAdmin` wrapper
- `src/lib/rate-limit.ts` — new file, `withRateLimit` wrapper
- `src/lib/with-auth.ts` — new file, combined composable helpers
- `src/lib/admin-auth.ts` — remove hardcoded JWT fallback
- `src/lib/customer-auth.ts` — remove hardcoded JWT fallback, add Google OAuth helpers
- `src/lib/admin-auth-store.ts` — remove persist, derive from API
- `src/lib/auth-store.ts` — same
- `next.config.ts` — add security headers
- `prisma/schema.prisma` — add avatar, dateOfBirth to User
- `src/app/api/admin/auth/login/verify/route.ts` — set cookie instead of body
- `src/app/api/admin/auth/me/route.ts` — read from cookie
- `src/app/api/customer/*/route.ts` — new customer auth routes (login, register, google, google/callback, me)
- `src/app/api/admin/seed/route.ts` — add auth + production guard
- `src/app/api/upload/payment-proof/route.ts` — add auth + validation
- `src/app/api/admin/chat/route.ts` — add auth
- `src/app/api/admin/customers/route.ts` — add auth
- `src/app/api/admin/*/route.ts` — add `withAdmin` to ~25 route files
- `src/components/store/CheckoutContent.tsx` — pass customer auth state
- `src/lib/db.ts` — ensure all routes import from here

## Migration Strategy

1. Add `withAdmin` wrapper + apply to all admin routes (works with both cookie and header tokens)
2. Add security headers (no behavioral change)
3. Add rate limiting (no behavioral change to happy path)
4. Migrate JWT to cookies (set cookie on login, keep header support, frontend still sends header)
5. Add Google OAuth (new customer auth path, no breaking changes)
6. Remove `Authorization` header sending from frontend after 30 days
7. Seed route + file upload + chat fixes
8. PrismaClient consolidation
