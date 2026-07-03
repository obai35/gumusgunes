# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 24 security findings (4 Critical, 6 High, 7 Medium, 7 Low) in the Gümüş Güneş e-commerce codebase.

**Architecture:** Build on existing security foundation (JWT auth, rate limiting, security headers) by adding input validation (Zod), CSRF protection (origin validation), expanded rate limiting, XSS fixes, audit logging, and a password reset flow.

**Tech Stack:** Next.js 16 (App Router), Prisma 6, TypeScript, Zod, bcryptjs, Upstash Ratelimit, nodemailer

---

### Task 1: Rotate Secrets & Purge `.env` from Git

**Files:**
- Delete: `.env`, `.env.local`
- Create: `.env.example`
- Modify: `.gitignore` (verify `.env*` entries)

- [ ] **Step 1: Rotate all production secrets**

  1. Reset Neon DB password → update DATABASE_URL on Vercel
  2. Generate new Google OAuth credentials → update GOOGLE_CLIENT_SECRET on Vercel
  3. Generate new JWT secrets: `openssl rand -hex 64` → ADMIN_JWT_SECRET, NEXTAUTH_SECRET
  4. Generate new ENCRYPTION_KEY: `openssl rand -hex 32`
  5. Set all new env vars on Vercel (Production + Preview + Development)

- [ ] **Step 2: Migrate encrypted payment configs**

  1. Before rotation: start server, call `GET /api/admin/payment-methods`
  2. Decrypt each `config` with old key, save plaintext configs
  3. After rotation: encrypt each config with new key via `PUT /api/admin/payment-methods/[id]`
  4. Verify configs decrypt correctly

- [ ] **Step 3: Create `.env.example`**

  ```env
  # Database
  DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"

  # Authentication
  ADMIN_JWT_SECRET=<generate with: openssl rand -hex 64>
  NEXTAUTH_SECRET=<generate with: openssl rand -hex 64>
  NEXTAUTH_URL=http://localhost:3000

  # Encryption (AES-256-GCM)
  ENCRYPTION_KEY=<generate with: openssl rand -hex 32>

  # Google OAuth
  GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
  GOOGLE_CLIENT_SECRET=xxx
  GOOGLE_REDIRECT_URI=http://localhost:3000/api/customer/auth/google/callback

  # Upstash Redis (rate limiting)
  UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
  UPSTASH_REDIS_REST_TOKEN=xxx

  # Seed API
  SEED_API_KEY=<random string>

  # CSRF
  ALLOWED_ORIGINS=http://localhost:3000,https://gumusgunes.vercel.app

  # SMTP (password reset)
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your@email.com
  SMTP_PASS=xxx
  SMTP_FROM=noreply@gumusgunes.com
  ```

- [ ] **Step 4: Purge `.env` from git**

  ```bash
  # Remove from tracking (keeps local files)
  git rm --cached .env .env.local

  # Purge from all git history
  git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env .env.local" --prune-empty --tag-name-filter cat -- --all

  # Force push to remote
  git push origin --force --all
  git push origin --force --tags
  ```

  **Note:** Coordinate with any collaborators before force-pushing.

---

### Task 2: Fix SQL Injection & Remove Dangerous Admin Chat Tools

**Files:**
- Modify: `src/lib/admin-chat-tools.ts`

- [ ] **Step 1: Remove dangerous tools and tighten remaining ones**

  In `src/lib/admin-chat-tools.ts`, make these changes:

  ```typescript
  // Remove these tool definitions entirely:
  // - 'dbQuery' (raw SQL execution)
  // - 'listDbModels' (schema enumeration + full table access)

  // Keep but tighten:
  // - 'runCommand' — add auto-expiry on approval (5 min timeout)
  // - 'writeFile' — add auto-expiry on approval
  // - 'editFile' — add auto-expiry on approval
  // - 'gitCommit' — add auto-expiry on approval
  // - 'gitPush' — add auto-expiry on approval
  // - 'restartServer' — add auto-expiry on approval
  ```

  Find the `isToolSafe` function and add:
  ```typescript
  const PENDING_APPROVALS = new Map<string, { timestamp: number; tool: string; args: unknown }>()
  const APPROVAL_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  function isToolSafe(tool: string, args: unknown): boolean {
    const unsafeTools = ['runCommand', 'writeFile', 'editFile', 'gitCommit', 'gitPush', 'restartServer']
    if (!unsafeTools.includes(tool)) return true

    // Check for existing pending approval
    const pending = PENDING_APPROVALS.get(tool)
    if (!pending) return false

    const elapsed = Date.now() - pending.timestamp
    if (elapsed > APPROVAL_TIMEOUT) {
      PENDING_APPROVALS.delete(tool)
      return false
    }
    return true
  }

  // When approval is granted:
  function grantApproval(tool: string, args: unknown): void {
    PENDING_APPROVALS.set(tool, { timestamp: Date.now(), tool, args })
  }
  ```

  Also add audit logging to every tool execution:
  ```typescript
  // At start of each tool execution:
  await logAudit({
    adminId: admin.id,
    action: `admin_chat_${toolName}`,
    details: { tool: toolName, args: redactSensitive(args) },
    ip: req.headers.get('x-forwarded-for') ?? 'unknown',
  })
  ```

- [ ] **Step 2: Run build to verify no broken imports**

  ```bash
  bun run build
  ```

  Expected: No errors from admin-chat-tools.ts or any file importing it.

---

### Task 3: Add Auth to Order Status Update Route

**Files:**
- Modify: `src/app/api/orders/update-status/route.ts`

- [ ] **Step 1: Add withAdmin wrapper and status validation**

  ```typescript
  import { withAdmin } from '@/lib/admin-permissions'
  import { NextResponse } from 'next/server'

  const ALLOWED_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const
  const ALLOWED_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'] as const

  async function handler(req: Request) {
    try {
      const { orderId, field, value } = await req.json()

      if (!['status', 'paymentStatus'].includes(field)) {
        return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
      }

      const allowedValues = field === 'status' ? ALLOWED_STATUSES : ALLOWED_PAYMENT_STATUSES
      if (!allowedValues.includes(value)) {
        return NextResponse.json({ error: `Invalid ${field} value` }, { status: 400 })
      }

      await db.order.update({ where: { id: orderId }, data: { [field]: value } })
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('[update-order-status]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  export const POST = withAdmin(handler, 'orders')
  ```

---

### Task 4: Fix Payment Routes — Auth, Rate Limiting, Error Leakage

**Files:**
- Modify: `src/app/api/payments/paypal/create-order/route.ts`
- Modify: `src/app/api/payments/paypal/capture-order/route.ts`
- Modify: `src/app/api/payments/stripe/create-intent/route.ts`

- [ ] **Step 1: Fix all three payment routes**

  For each file, apply the same pattern:

  ```typescript
  import { NextResponse } from 'next/server'
  import { withRateLimit } from '@/lib/rate-limit'

  async function handler(req: Request) {
    try {
      const body = await req.json()
      // ... existing logic ...
    } catch (error) {
      console.error('[payment-route-name]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  export const POST = withRateLimit(handler, { limit: 10, window: '60s' })
  ```

  For create-intent, also add customer session check if available.

---

### Task 5: Fix Seed API Proxy Bypass

**Files:**
- Modify: `src/proxy.ts`

- [ ] **Step 1: Remove blanket bypass**

  ```typescript
  // REMOVE this line from proxy.ts:
  // if (req.nextUrl.pathname === '/api/admin/seed') return true
  ```

- [ ] **Step 2: Make seed route fail-closed**

  In `src/app/api/admin/seed/route.ts`, verify:
  ```typescript
  if (!process.env.SEED_API_KEY) {
    return NextResponse.json(
      { error: 'Seed API is not configured' },
      { status: 503 }
    )
  }
  // ... continue with existing auth check
  ```

---

### Task 6: Create Shared Error Handler & Fix Error Leakage

**Files:**
- Create: `src/lib/api-error.ts`
- Modify: `src/app/api/admin/auth/login/route.ts`
- Modify: `src/app/api/payments/paypal/create-order/route.ts`
- Modify: `src/app/api/payments/paypal/capture-order/route.ts`
- Modify: `src/app/api/payments/stripe/create-intent/route.ts`
- (plus any other route returning `err.message`)

- [ ] **Step 1: Create shared error handler**

  ```typescript
  // src/lib/api-error.ts
  export function handleApiError(error: unknown, context: string): NextResponse {
    console.error(`[${context}]`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
  ```

- [ ] **Step 2: Replace all `err.message` returns**

  Before:
  ```typescript
  return NextResponse.json({ error: err.message }, { status: 500 })
  ```

  After:
  ```typescript
  return handleApiError(err, 'admin-auth-login')
  ```

  Search for `err.message` across all route files and replace with `handleApiError`.

  ```bash
  # Find all instances of err.message being returned
  grep -rn "err\.message" src/app/api/ --include="*.ts" | grep -i "return\|error:"
  ```

---

### Task 7: Add CSRF Origin Validation

**Files:**
- Modify: `src/middleware.ts`

- [ ] **Step 1: Add origin validation middleware**

  ```typescript
  import { NextResponse } from 'next/server'
  import type { NextRequest } from 'next/server'

  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())

  function isValidOrigin(origin: string | null): boolean {
    if (!origin) return false
    return ALLOWED_ORIGINS.some(allowed => origin === allowed || origin.endsWith('/' + allowed))
  }

  export function middleware(req: NextRequest) {
    // Skip CSRF check for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return NextResponse.next()
    }

    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')

    // Allow requests with no origin/referer (CLI tools, server-to-server)
    if (!origin && !referer) {
      return NextResponse.next()
    }

    // Validate origin if present
    if (origin && !isValidOrigin(origin)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }

    // Validate referer if origin not present
    if (!origin && referer) {
      try {
        const refererUrl = new URL(referer)
        if (!isValidOrigin(refererUrl.origin)) {
          return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
      }
    }

    return NextResponse.next()
  }

  export const config = {
    matcher: '/api/:path*',
  }
  ```

---

### Task 8: Add Zod Validation to Auth & User Routes

**Files:**
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/register/route.ts`
- Modify: `src/app/api/customer/auth/login/route.ts`
- Modify: `src/app/api/customer/auth/register/route.ts`
- Modify: `src/app/api/admin/auth/login/route.ts`
- Modify: `src/app/api/user/cards/route.ts`
- Modify: `src/app/api/user/addresses/route.ts`
- Modify: `src/app/api/user/profile/route.ts`

- [ ] **Step 1: Add Zod schema to login routes**

  ```typescript
  import { z } from 'zod'

  const LoginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }).strict()

  // In the handler:
  const parsed = LoginSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { email, password } = parsed.data
  ```

- [ ] **Step 2: Add Zod schema to register routes**

  ```typescript
  const RegisterSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a digit'),
    phone: z.string().optional(),
  }).strict()
  ```

- [ ] **Step 3: Add Zod schema to user routes**

  ```typescript
  // Address schema
  const AddressSchema = z.object({
    label: z.string().min(1).max(50),
    fullName: z.string().min(1).max(100),
    phone: z.string().min(1).max(20),
    street: z.string().min(1).max(200),
    city: z.string().min(1).max(100),
    governorateId: z.string().uuid(),
    building: z.string().min(1).max(50),
    floor: z.string().optional(),
    apartment: z.string().optional(),
    landmark: z.string().optional(),
  }).strict()

  // Saved card schema
  const CardSchema = z.object({
    cardholderName: z.string().min(1).max(100),
    last4: z.string().length(4),
    brand: z.string().min(1).max(50),
    expiryMonth: z.number().int().min(1).max(12),
    expiryYear: z.number().int().min(2024),
    token: z.string().min(1),
  }).strict()

  // Profile schema
  const ProfileSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().max(20).optional(),
    dateOfBirth: z.string().optional(),
  }).strict()
  ```

---

### Task 9: Add Zod Validation to Admin Routes

**Files:**
- Modify: `src/app/api/admin/admins/route.ts`
- Modify: `src/app/api/admin/products/create/route.ts`
- Modify: `src/app/api/admin/categories/route.ts`
- Modify: `src/app/api/admin/settings/route.ts`

- [ ] **Step 1: Add schema to admin creation/update**

  ```typescript
  const CreateAdminSchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a digit'),
    roleId: z.string().uuid(),
  }).strict()
  ```

- [ ] **Step 2: Add schema to product creation**

  ```typescript
  const CreateProductSchema = z.object({
    name: z.string().min(1).max(200),
    description: z.string().min(1),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    categoryId: z.string().uuid(),
    images: z.array(z.string().url()).max(10).default([]),
    tags: z.array(z.string()).max(20).optional(),
    featured: z.boolean().optional(),
    requiresShipping: z.boolean().optional(),
    weight: z.number().positive().optional(),
  }).strict()
  ```

- [ ] **Step 3: Add schema to category creation**

  ```typescript
  const CreateCategorySchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens'),
    description: z.string().optional(),
    parentId: z.string().uuid().nullable().optional(),
    image: z.string().url().optional(),
  }).strict()
  ```

- [ ] **Step 4: Add schema to settings update**

  ```typescript
  const KNOWN_KEYS = ['heroTitle', 'heroSubtitle', 'aboutText', 'contactEmail',
    'contactPhone', 'footerText', 'currency', 'vatRate', 'shippingThreshold',
    'facebook', 'instagram', 'twitter', 'tiktok'] as const

  const SettingsSchema = z.object({
    key: z.enum(KNOWN_KEYS),
    value: z.string().min(0).max(5000),
  }).strict()
  ```

---

### Task 10: Add Zod Validation to Payment & Chat Routes

**Files:**
- Modify: `src/app/api/payments/stripe/create-intent/route.ts`
- Modify: `src/app/api/payments/paypal/create-order/route.ts`
- Modify: `src/app/api/payments/paypal/capture-order/route.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Add schemas**

  ```typescript
  const StripeIntentSchema = z.object({
    orderId: z.string().uuid(),
  }).strict()

  const PayPalCreateSchema = z.object({
    orderId: z.string().uuid(),
  }).strict()

  const PayPalCaptureSchema = z.object({
    orderId: z.string().uuid(),
    paypalOrderId: z.string().min(1),
  }).strict()

  const ChatSchema = z.object({
    message: z.string().min(1, 'Message is required').max(2000),
    conversationId: z.string().uuid().optional(),
  }).strict()
  ```

---

### Task 11: Add Rate Limiting to Remaining Endpoints

**Files:**
- Modify: `src/app/api/reviews/route.ts`
- Modify: `src/app/api/newsletter/route.ts`
- Modify: `src/app/api/back-in-stock/route.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/wishlist/route.ts`
- Modify: `src/app/api/search/route.ts`
- Modify: `src/app/api/admin/chat/route.ts`
- Modify: `src/lib/rate-limit.ts` (add fail-closed option)

- [ ] **Step 1: Add fail-closed support to `withRateLimit`**

  In `src/lib/rate-limit.ts`, add the `failClosed` option:

  ```typescript
  interface RateLimitOptions {
    limit: number
    window: string
    identifier?: (req: Request) => string
    failClosed?: boolean
  }

  export function withRateLimit(
    handler: Function,
    options: RateLimitOptions
  ): Function {
    return async function (req: Request, ...args: unknown[]) {
      try {
        const identifier = options.identifier?.(req) ?? req.headers.get('x-forwarded-for') ?? 'unknown'
        const { success, remaining, reset } = await rateLimit.limit(identifier)
        if (!success) {
          return NextResponse.json(
            { error: 'Too many requests' },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                'X-RateLimit-Remaining': String(remaining),
              },
            }
          )
        }
        return handler(req, ...args)
      } catch (err) {
        console.warn('[rate-limit] Unavailable:', err)
        if (options.failClosed) {
          return NextResponse.json(
            { error: 'Rate limiting unavailable' },
            { status: 429 }
          )
        }
        return handler(req, ...args)
      }
    }
  }
  ```

- [ ] **Step 2: Add rate limiting to each route**

  Apply the wrapper to each exported handler:

  ```typescript
  // Reviews: 5 req/60s per IP
  export const POST = withRateLimit(handler, { limit: 5, window: '60s' })

  // Newsletter: 3 req/60s per IP
  export const POST = withRateLimit(handler, { limit: 3, window: '60s' })

  // Back-in-stock: 5 req/60s per IP
  export const POST = withRateLimit(handler, { limit: 5, window: '60s' })

  // Customer chat: 5 req/60s per IP
  export const POST = withRateLimit(handler, { limit: 5, window: '60s', failClosed: true })

  // Wishlist: 30 req/60s per IP
  export const GET = withRateLimit(handleGet, { limit: 30, window: '60s' })
  export const POST = withRateLimit(handlePost, { limit: 30, window: '60s' })

  // Search: 60 req/60s per IP
  export const GET = withRateLimit(handler, { limit: 60, window: '60s' })

  // Admin chat: 20 req/60s per admin
  export const POST = withRateLimit(withAdmin(handler, 'chat'), { limit: 20, window: '60s' })
  ```

---

### Task 12: Fix Preview Page XSS

**Files:**
- Modify: `src/app/preview/page.tsx`

- [ ] **Step 1: Fix dangerous inner HTML**

  Find the script tag at line ~80:
  ```tsx
  // BEFORE:
  <script dangerouslySetInnerHTML={{ __html: `window.__PREVIEW_SETTINGS__ = ${JSON.stringify(map)}` }} />

  // AFTER:
  <script
    id="__PREVIEW_DATA"
    type="application/json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(map).replace(/</g, '\\u003c')
    }}
  />
  ```

- [ ] **Step 2: Update any JS code reading `window.__PREVIEW_SETTINGS__`**

  Search for `__PREVIEW_SETTINGS__` and replace reads with:
  ```typescript
  const settings = JSON.parse(document.getElementById('__PREVIEW_DATA')?.textContent ?? '{}')
  ```

---

### Task 13: Add Review Content Sanitization

**Files:**
- Modify: `src/app/api/reviews/route.ts`
- Modify: `package.json` (add `sanitize-html`)

- [ ] **Step 1: Add sanitize-html dependency**

  ```bash
  bun add sanitize-html
  bun add -D @types/sanitize-html
  ```

- [ ] **Step 2: Sanitize review content before storage**

  ```typescript
  import sanitizeHtml from 'sanitize-html'

  // Before Prisma create/update:
  const sanitizedTitle = sanitizeHtml(parsed.data.title, { allowedTags: [], allowedAttributes: {} })
  const sanitizedComment = sanitizeHtml(parsed.data.comment, { allowedTags: [], allowedAttributes: {} })

  await db.review.create({
    data: {
      ...parsed.data,
      title: sanitizedTitle,
      comment: sanitizedComment,
    },
  })
  ```

---

### Task 14: Add CSP Reporting

**Files:**
- Create: `src/app/api/csp-report/route.ts`
- Modify: `next.config.ts`

- [ ] **Step 1: Create CSP report collector endpoint**

  ```typescript
  // src/app/api/csp-report/route.ts
  import { NextResponse } from 'next/server'

  export async function POST(req: Request) {
    try {
      const report = await req.json()
      console.warn('[CSP Violation]', JSON.stringify(report, null, 2))
      return NextResponse.json({ ok: true })
    } catch (error) {
      console.error('[CSP-report]', error)
      return NextResponse.json({ error: 'Invalid report' }, { status: 400 })
    }
  }

  // Also accept GET for CORS preflight
  export async function OPTIONS() {
    return NextResponse.json({})
  }
  ```

- [ ] **Step 2: Add report-uri to CSP in `next.config.ts`**

  ```typescript
  // Append to existing CSP:
  Content-Security-Policy: "... ; report-uri /api/csp-report"

  // Also add Report-Only policy for monitoring:
  Content-Security-Policy-Report-Only: "default-src 'self'; ... ; report-uri /api/csp-report"
  ```

---

### Task 15: Add Caddyfile Security Headers & Code Quality

**Files:**
- Modify: `Caddyfile`
- Modify: `next.config.ts`

- [ ] **Step 1: Add security headers to Caddyfile**

  ```caddy
  :81 {
    handle {
      header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
      }
      reverse_proxy localhost:3000
    }
  }
  ```

- [ ] **Step 2: Enable React strict mode and fix TS errors**

  In `next.config.ts`:
  ```typescript
  reactStrictMode: true,
  // Remove:
  // typescript: { ignoreBuildErrors: true },
  ```

  ```bash
  bun run build
  # Fix any TypeScript errors that surface
  ```

---

### Task 16: Create Audit Logging Utility

**Files:**
- Create: `src/lib/audit.ts`
- Modify: `src/app/api/admin/auth/login/route.ts`
- Modify: `src/app/api/admin/admins/route.ts`
- Modify: `src/app/api/admin/chat/route.ts`
- Modify: `src/app/api/admin/payments/verify/route.ts`

- [ ] **Step 1: Create audit logging function**

  ```typescript
  // src/lib/audit.ts
  import { db } from '@/lib/db'

  export async function logAudit(params: {
    adminId: string
    action: string
    details?: Record<string, unknown>
    ip?: string
  }) {
    try {
      await db.activityLog.create({
        data: {
          adminId: params.adminId,
          action: params.action,
          details: params.details ?? {},
          ip: params.ip ?? 'unknown',
        },
      })
    } catch (error) {
      console.error('[audit] Failed to log:', error)
    }
  }
  ```

- [ ] **Step 2: Add audit calls to critical actions**

  **Admin login (success):**
  ```typescript
  await logAudit({
    adminId: admin.id,
    action: 'admin_login',
    details: { email: admin.email },
    ip: req.headers.get('x-forwarded-for') ?? 'unknown',
  })
  ```

  **Admin login (failure):**
  ```typescript
  await logAudit({
    adminId: 'unknown',
    action: 'admin_login_failed',
    details: { email, reason: 'invalid credentials' },
    ip: req.headers.get('x-forwarded-for') ?? 'unknown',
  })
  ```

  **Admin created:**
  ```typescript
  await logAudit({
    adminId: currentAdmin.id,
    action: 'admin_created',
    details: { targetEmail: parsed.data.email, roleId: parsed.data.roleId },
  })
  ```

  **Admin chat tool execution:**
  ```typescript
  await logAudit({
    adminId: admin.id,
    action: `admin_chat_${tool}`,
    details: { tool, args: redactSensitive(args) },
  })
  ```

  **Payment verification:**
  ```typescript
  await logAudit({
    adminId: admin.id,
    action: `payment_${action}`, // 'verify' or 'reject'
    details: { orderId, amount },
  })
  ```

---

### Task 17: Fix Payment Proof Uploads & Cookie Cleanup

**Files:**
- Modify: `src/app/api/upload/payment-proof/route.ts`
- Create: `src/app/api/admin/uploads/payments/[file]/route.ts`
- Modify: `src/app/api/customer/auth/logout/route.ts`
- Modify: `src/lib/admin-permissions.ts` (add origin check fix)

- [ ] **Step 1: Move uploads to private directory**

  In `src/app/api/upload/payment-proof/route.ts`:
  ```typescript
  // Change:
  const dir = path.join(process.cwd(), 'public/uploads/payments')
  // To:
  const dir = path.join(process.cwd(), 'private/uploads/payments')

  // Add file validation:
  const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  if (buffer.length > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 })
  }
  ```

- [ ] **Step 2: Create protected file serving route**

  ```typescript
  // src/app/api/admin/uploads/payments/[file]/route.ts
  import { NextResponse } from 'next/server'
  import { withAdmin } from '@/lib/admin-permissions'
  import { readFile } from 'fs/promises'
  import path from 'path'

  async function handler(req: Request, { params }: { params: { file: string } }) {
    try {
      const filePath = path.join(process.cwd(), 'private/uploads/payments', params.file)
      const buffer = await readFile(filePath)
      const ext = path.extname(params.file).toLowerCase()
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
        '.png': 'image/png', '.webp': 'image/webp',
      }
      return new NextResponse(buffer, {
        headers: { 'Content-Type': mimeTypes[ext] ?? 'application/octet-stream' },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  export const GET = withAdmin(handler, 'orders')
  ```

- [ ] **Step 3: Fix cookie cleanup on logout**

  In `src/app/api/customer/auth/logout/route.ts`:
  ```typescript
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 0,
  }
  for (const path of ['/', '/api']) {
    response.cookies.set('__session', '', { ...cookieOptions, path })
    response.cookies.set('__session_admin', '', { ...cookieOptions, path })
  }
  ```

---

### Task 18: Add Password Reset Flow

**Files:**
- Create: `src/app/api/auth/forgot-password/route.ts`
- Create: `src/app/api/auth/reset-password/route.ts`
- Modify: `prisma/schema.prisma` (add ResetToken model)
- Modify: `package.json` (add `nodemailer`)
- Run: `npx prisma migrate dev --name add_reset_tokens`

- [ ] **Step 1: Add ResetToken model to Prisma schema**

  ```prisma
  model ResetToken {
    id        String   @id @default(uuid())
    email     String
    token     String   @unique
    expiresAt DateTime
    usedAt    DateTime?
    createdAt DateTime @default(now())

    @@index([email])
    @@index([token])
  }
  ```

  ```bash
  npx prisma migrate dev --name add_reset_tokens
  ```

- [ ] **Step 2: Add nodemailer dependency**

  ```bash
  bun add nodemailer
  bun add -D @types/nodemailer
  ```

- [ ] **Step 3: Create forgot-password endpoint**

  ```typescript
  // src/app/api/auth/forgot-password/route.ts
  import { NextResponse } from 'next/server'
  import { db } from '@/lib/db'
  import { withRateLimit } from '@/lib/rate-limit'
  import crypto from 'crypto'
  import nodemailer from 'nodemailer'

  async function handler(req: Request) {
    try {
      const { email } = await req.json()
      if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      const user = await db.user.findUnique({ where: { email } })
      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
      }

      // Invalidate old tokens
      await db.resetToken.updateMany({
        where: { email, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() },
      })

      // Create new token
      const token = crypto.randomBytes(32).toString('hex')
      await db.resetToken.create({
        data: { email, token, expiresAt: new Date(Date.now() + 3600000) },
      })

      // Send email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
      await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Password Reset - Gümüş Güneş',
        html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 1 hour.</p>`,
      })

      return NextResponse.json({ message: 'If the email exists, a reset link has been sent' })
    } catch (error) {
      console.error('[forgot-password]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  export const POST = withRateLimit(handler, { limit: 3, window: '3600s', failClosed: true })
  ```

- [ ] **Step 4: Create reset-password endpoint**

  ```typescript
  // src/app/api/auth/reset-password/route.ts
  import { NextResponse } from 'next/server'
  import { db } from '@/lib/db'
  import bcrypt from 'bcryptjs'
  import { z } from 'zod'

  const ResetSchema = z.object({
    token: z.string().min(1),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/[0-9]/, 'Must include a digit'),
  }).strict()

  export async function POST(req: Request) {
    try {
      const parsed = ResetSchema.safeParse(await req.json())
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
      }

      const resetToken = await db.resetToken.findUnique({
        where: { token: parsed.data.token },
      })

      if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
      }

      const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
      await db.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      })

      await db.resetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      })

      return NextResponse.json({ message: 'Password reset successful' })
    } catch (error) {
      console.error('[reset-password]', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
  ```

---

### Task 19: IDOR & Info Leak Audit

**Files:**
- Modify: various user route files

- [ ] **Step 1: Search and fix IDOR patterns**

  ```bash
  # Find routes that return 403/401 for unauthorized access
  grep -rn "status: 403\|status: 401" src/app/api/user/ --include="*.ts"
  ```

  For all matches, replace with 404:
  ```typescript
  // BEFORE:
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // AFTER:
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
  ```
