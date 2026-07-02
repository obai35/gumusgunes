# Security Hardening + Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden all admin API routes with auth, add rate limiting, security headers, JWT cookie migration, Google OAuth, and fix individual security gaps.

**Architecture:** Two reusable wrappers (`withAdmin`, `withRateLimit`) applied composably to route handlers. JWT moves from localStorage to HttpOnly cookies. Google OAuth added as new customer auth path.

**Tech Stack:** Next.js 16, Upstash Ratelimit, Google OAuth 2.0, jsonwebtoken, bcryptjs

---

### Task 1: Create `withAdmin` Wrapper

**Files:**
- Modify: `src/lib/admin-permissions.ts`

**Details:** Add `withAdmin` higher-order function and `requireAdmin` guard. Update `getAdminFromToken` to also read from `__session_admin` cookie (fallback to Authorization header).

- [ ] **Step 1: Modify `getAdminFromToken` to read cookie**

Replace `src/lib/admin-permissions.ts` content:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from './admin-auth'
import { db } from './db'

export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed',
] as const

export type Permission = typeof ALL_PERMISSIONS[number]

export type AdminInfo = {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  isSuperAdmin: boolean
}

export async function getAdminFromToken(req: NextRequest): Promise<AdminInfo | null> {
  const cookieToken = req.cookies.get('__session_admin')?.value
  const authHeader = req.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
  if (!token) return null
  const payload = verifyAdminToken(token)
  if (!payload) return null
  const admin = await db.admin.findUnique({
    where: { id: payload.adminId },
    include: { roleRel: true },
  })
  if (!admin) return null
  const role = admin.roleRel?.name || admin.role
  const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) as string[] : []
  const isSuperAdmin = role === 'superadmin' || role === 'admin'
  return { id: admin.id, email: admin.email, name: admin.name, role, permissions, isSuperAdmin }
}

export function withAdmin(
  handler: (req: NextRequest, ctx: { params: any; admin: AdminInfo }) => Promise<NextResponse>,
  requiredPermission?: Permission
): (req: NextRequest, ctx: { params: any }) => Promise<NextResponse> {
  return async (req, ctx) => {
    const admin = await getAdminFromToken(req)
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (requiredPermission && !admin.isSuperAdmin && !admin.permissions.includes(requiredPermission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, { ...ctx, admin })
  }
}

export function requireAdmin(permission?: Permission) {
  return async (req: NextRequest): Promise<Response | null> => {
    const admin = await getAdminFromToken(req)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (permission && !admin.isSuperAdmin && !admin.permissions.includes(permission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return null
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run `npm run build` to verify no TypeScript errors introduced.

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-permissions.ts
git commit -m "feat: add withAdmin wrapper and cookie-based auth"
```

---

### Task 2: Create `withRateLimit` Wrapper

**Files:**
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Create rate-limit.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'

type RateLimitOptions = {
  limit: number
  window: string
  identifier?: (req: NextRequest) => string
}

export function withRateLimit(
  handler: (req: NextRequest, ctx: { params: any }) => Promise<NextResponse>,
  options: RateLimitOptions
): (req: NextRequest, ctx: { params: any }) => Promise<NextResponse> {
  return async (req, ctx) => {
    try {
      const { Ratelimit } = await import('@upstash/ratelimit')
      const { Redis } = await import('@upstash/redis')

      const identifier = options.identifier
        ? options.identifier(req)
        : req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

      const redis = Redis.fromEnv()
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, options.window),
        analytics: true,
      })

      const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

      if (!success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': String(remaining),
            },
          }
        )
      }
    } catch {
      // If Upstash is not configured, silently skip rate limiting
    }

    return handler(req, ctx)
  }
}
```

- [ ] **Step 2: Install Upstash package**

Run:
```bash
npm install @upstash/ratelimit @upstash/redis
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts package.json
git commit -m "feat: add withRateLimit wrapper using Upstash"
```

---

### Task 3: Security Headers

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Update next.config.ts with CSP + HSTS + Permissions-Policy**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const csp = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://*.paypal.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://*.googleusercontent.com https://*.stripe.com;
  connect-src 'self' https://*.stripe.com https://*.paypal.com https://*.upstash.io;
  frame-src https://*.stripe.com https://*.paypal.com;
`.replace(/\s{2,}/g, ' ').trim()

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: '/preview',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
};

export default nextConfig;
```

- [ ] **Step 2: Commit**

```bash
git add next.config.ts
git commit -m "feat: add CSP, HSTS, Permissions-Policy security headers"
```

---

### Task 4: Remove Hardcoded JWT Secrets

**Files:**
- Modify: `src/lib/admin-auth.ts`
- Modify: `src/lib/customer-auth.ts`

- [ ] **Step 1: Fix admin-auth.ts**

Replace lines 1-4:

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET
if (!ADMIN_JWT_SECRET) {
  throw new Error('ADMIN_JWT_SECRET environment variable is required')
}
```

- [ ] **Step 2: Fix customer-auth.ts**

Replace:

```typescript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or NEXTAUTH_SECRET environment variable is required')
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-auth.ts src/lib/customer-auth.ts
git commit -m "fix: remove hardcoded JWT fallback secrets, throw if env missing"
```

---

### Task 5: JWT Cookie Migration — Login Sets Cookie

**Files:**
- Modify: `src/app/api/admin/auth/login/route.ts`
- Modify: `src/app/api/admin/auth/me/route.ts`

- [ ] **Step 1: Update login to set HttpOnly cookie**

In login route, after `signAdminToken`, set a cookie in the response instead of returning token in body:

```typescript
import { NextResponse } from 'next/server'
import { verifyPassword, signAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, password, totpToken } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const admin = await db.admin.findUnique({ where: { email }, include: { roleRel: true } })
    if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const valid = await verifyPassword(password, admin.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (admin.totpEnabled) {
      if (!totpToken) return NextResponse.json({ totpRequired: true, adminId: admin.id }, { status: 200 })
      const { verifyTotpCode } = await import('@/lib/totp')
      if (!verifyTotpCode(totpToken, admin.totpSecret!)) return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 })
    }

    const token = signAdminToken({ adminId: admin.id, email: admin.email })
    const permissions = admin.roleRel ? JSON.parse(admin.roleRel.permissions) : []

    const response = NextResponse.json({
      user: { id: admin.id, email: admin.email, name: admin.name, role: admin.roleRel?.name || 'admin', permissions }
    })

    response.cookies.set('__session_admin', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 86400,
    })

    return response
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Login failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Update me route to read from cookie + header fallback**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const cookieToken = request.cookies.get('__session_admin')?.value
  const authHeader = request.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = verifyAdminToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const admin = await db.admin.findUnique({ where: { id: payload.adminId }, include: { roleRel: true } })
  if (!admin) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
  }

  const { password: _, roleRel, ...safeAdmin } = admin
  const permissions = roleRel ? JSON.parse(roleRel.permissions) : []

  return NextResponse.json({ admin: { ...safeAdmin, role: roleRel?.name || 'admin', permissions } })
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/auth/login/route.ts src/app/api/admin/auth/me/route.ts
git commit -m "feat: set JWT as HttpOnly cookie on login, keep header fallback"
```

---

### Task 6: Frontend Auth Store — Remove localStorage Persist

**Files:**
- Modify: `src/lib/admin-auth-store.ts`
- Modify: `src/lib/auth-store.ts`

- [ ] **Step 1: Update admin-auth-store to derive from API**

```typescript
'use client'

import { create } from 'zustand'

type AdminUser = { id: string; email: string; name: string; role?: string; permissions?: string[] }
type AdminAuthState = {
  user: AdminUser | null
  totpPending: { adminId: string; email: string } | null
  adminLogin: (user: AdminUser) => void
  logout: () => void
  setTotpPending: (data: { adminId: string; email: string } | null) => void
  fetchUser: () => Promise<void>
}

export const useAdminAuth = create<AdminAuthState>()((set) => ({
  user: null,
  totpPending: null,
  adminLogin: (user) => set({ user, totpPending: null }),
  logout: () => set({ user: null, totpPending: null }),
  setTotpPending: (data) => set({ totpPending: data }),
  fetchUser: async () => {
    try {
      const res = await fetch('/api/admin/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.admin })
      } else {
        set({ user: null })
      }
    } catch {
      set({ user: null })
    }
  },
}))
```

- [ ] **Step 2: Update customer auth-store**

```typescript
'use client'

import { create } from 'zustand'

type User = { id: string; email: string; name: string }
type AuthState = {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isAuthenticated: () => boolean
  fetchUser: () => Promise<void>
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
  isAuthenticated: () => !!get().user,
  fetchUser: async () => {
    try {
      const res = await fetch('/api/customer/auth/me')
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user })
      } else {
        set({ user: null })
      }
    } catch {
      set({ user: null })
    }
  },
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-auth-store.ts src/lib/auth-store.ts
git commit -m "refactor: remove localStorage JWT persist, derive auth state from API"
```

---

### Task 7: Apply `withAdmin` to Products Routes

**Files:**
- Modify: `src/app/api/admin/products/route.ts`
- Modify: `src/app/api/admin/products/create/route.ts`
- Modify: `src/app/api/admin/products/update/route.ts`
- Modify: `src/app/api/admin/products/toggle/route.ts`
- Modify: `src/app/api/admin/products/bulk/route.ts`
- Modify: `src/app/api/admin/products/categories/route.ts`
- Modify: `src/app/api/admin/inventory/adjust/route.ts`
- Modify: `src/app/api/admin/inventory/logs/route.ts`

For each file: import `withAdmin` and wrap exported handlers with `withAdmin(handler, 'products')` or `withAdmin(handler, 'inventory')`.

Will need to read each file and apply pattern. Example pattern for each:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req, { admin }) => {
  // ... existing handler code using admin context if needed
}, 'products')
```

- [ ] **Step 1: Apply to each products route file**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/products/*.ts src/app/api/admin/inventory/*.ts
git commit -m "feat: add auth to products and inventory routes"
```

---

### Task 8: Apply `withAdmin` to Orders Routes

**Files:**
- Modify: `src/app/api/admin/orders/route.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts`
- Modify: `src/app/api/admin/orders/[id]/returns/route.ts`
- Modify: `src/app/api/admin/orders/[id]/return/route.ts`
- Modify: `src/app/api/admin/orders/verify-payment/route.ts`
- Modify: `src/app/api/admin/orders/reject-payment/route.ts`
- Modify: `src/app/api/admin/orders/lookup/route.ts`

Apply `withAdmin(handler, 'orders')` to each.

- [ ] **Step 1: Apply to each orders route file**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/orders/*.ts
git commit -m "feat: add auth to orders routes"
```

---

### Task 9: Apply `withAdmin` to Remaining Admin Routes (Part 1)

**Files:**
- Modify: `src/app/api/admin/customers/route.ts` — `withAdmin(handler, 'customers')`
- Modify: `src/app/api/admin/customers/[id]/route.ts` — `withAdmin(handler, 'customers')`
- Modify: `src/app/api/admin/discounts/create/route.ts` — `withAdmin(handler, 'discounts')`
- Modify: `src/app/api/admin/discounts/toggle/route.ts` — `withAdmin(handler, 'discounts')`
- Modify: `src/app/api/admin/settings/route.ts` — `withAdmin(handler, 'settings')`
- Modify: `src/app/api/admin/branches/route.ts` — `withAdmin(handler, 'branches')`
- Modify: `src/app/api/admin/branch-stock/route.ts` — `withAdmin(handler, 'branches')`
- Modify: `src/app/api/admin/stock-transfers/route.ts` — `withAdmin(handler, 'stock_transfers')`
- Modify: `src/app/api/admin/activity/route.ts` — `withAdmin(handler, 'activity')`

- [ ] **Step 1: Apply `withAdmin` to each route**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/customers/*.ts src/app/api/admin/discounts/*.ts src/app/api/admin/settings/route.ts src/app/api/admin/branches/route.ts src/app/api/admin/branch-stock/route.ts src/app/api/admin/stock-transfers/route.ts src/app/api/admin/activity/route.ts
git commit -m "feat: add auth to customers, discounts, settings, branches, activity routes"
```

---

### Task 10: Apply `withAdmin` to Payment & Shipping Routes

**Files:**
- Modify: `src/app/api/admin/payments/verify/route.ts` — `withAdmin(handler, 'orders')`
- Modify: `src/app/api/admin/payments/reject/route.ts` — `withAdmin(handler, 'orders')`
- Modify: `src/app/api/admin/payments/verifications/route.ts` — `withAdmin(handler, 'orders')`
- Modify: `src/app/api/admin/payment-methods/route.ts` — `withAdmin(handler, 'payments')`
- Modify: `src/app/api/admin/payment-methods/[id]/route.ts` — `withAdmin(handler, 'payments')`
- Modify: `src/app/api/admin/shipping/methods/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/methods/[id]/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/rates/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/rules/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/rules/[id]/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/shipments/route.ts` — `withAdmin(handler, 'shipping')`
- Modify: `src/app/api/admin/shipping/shipments/create/route.ts` — `withAdmin(handler, 'shipping')`

- [ ] **Step 1: Apply `withAdmin` to each payment route**
- [ ] **Step 2: Apply `withAdmin` to each shipping route**
- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/payments/*.ts src/app/api/admin/payment-methods/*.ts src/app/api/admin/shipping/**/*.ts
git commit -m "feat: add auth to payments and shipping routes"
```

---

### Task 11: Apply `withAdmin` to Accounting Routes

**Files:**
- Modify: `src/app/api/admin/accounting/orders/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/orders/[id]/reconcile/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/orders/[id]/fulfill/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/reports/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/expenses/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/suppliers/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/branches/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/overview/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/export/reports/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/export/orders/route.ts` — `withAdmin(handler, 'accounting')`
- Modify: `src/app/api/admin/accounting/export/branches/route.ts` — `withAdmin(handler, 'accounting')`

- [ ] **Step 1: Apply `withAdmin` to each accounting route**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/accounting/**/*.ts
git commit -m "feat: add auth to accounting routes"
```

---

### Task 12: Apply `withAdmin` to POS Routes

**Files:**
- Modify: `src/app/api/admin/pos/checkout/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/orders/void/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/orders/search/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/orders/manual/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/start/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/close/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/active/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/summary/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/history/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/shifts/hall-sale/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/validate-discount/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/suppliers/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/expenses/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/customers/route.ts` — `withAdmin(handler, 'pos')`
- Modify: `src/app/api/admin/pos/products/route.ts` — `withAdmin(handler, 'pos')`

- [ ] **Step 1: Apply `withAdmin` to each POS route**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/pos/**/*.ts
git commit -m "feat: add auth to POS routes"
```

---

### Task 13: Apply `withAdmin` to Categories, Reviews, Newsletter, Admins, Roles (Retrofit Existing Auth)

**Files:**
- Modify: `src/app/api/admin/categories/route.ts` — replace inline auth with `withAdmin(handler, 'categories')`
- Modify: `src/app/api/admin/categories/[id]/route.ts` — same
- Modify: `src/app/api/admin/categories/seed/route.ts` — add `withAdmin(handler, 'categories')`
- Modify: `src/app/api/admin/reviews/route.ts` — replace inline auth with `withAdmin(handler, 'reviews')`
- Modify: `src/app/api/admin/newsletter/route.ts` — replace inline auth with `withAdmin(handler, 'newsletter')`
- Modify: `src/app/api/admin/admins/route.ts` — replace inline auth with `withAdmin(handler, 'admins')`
- Modify: `src/app/api/admin/admins/[id]/route.ts` — same
- Modify: `src/app/api/admin/roles/route.ts` — replace inline auth with `withAdmin(handler, 'security')`
- Modify: `src/app/api/admin/roles/[id]/route.ts` — same

For routes that already have auth using `getAdmin()` or `requirePermission()`, swap to `withAdmin()`.

- [ ] **Step 1: Retrofit each route**
- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/categories/*.ts src/app/api/admin/reviews/route.ts src/app/api/admin/newsletter/route.ts src/app/api/admin/admins/*.ts src/app/api/admin/roles/*.ts
git commit -m "refactor: replace inline auth with withAdmin wrapper"
```

---

### Task 14: Secure Seed Route, Chat Route, and File Upload

**Files:**
- Modify: `src/app/api/admin/seed/route.ts`
- Modify: `src/app/api/admin/chat/route.ts`
- Modify: `src/app/api/admin/chat/approve/route.ts`
- Modify: `src/app/api/upload/payment-proof/route.ts`

- [ ] **Step 1: Secure seed route**

Replace with:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const POST = withAdmin(async (req, { admin }) => {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const email = process.env.ADMIN_SEED_EMAIL || 'admin@gumusgunes.com'
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123'
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: 'Admin already exists' })
  const newAdmin = await prisma.admin.create({
    data: { email, name: 'Admin', password: await hashPassword(password), role: 'superadmin' },
  })
  return NextResponse.json({ message: 'Admin created', id: newAdmin.id })
}, 'seed')
```

- [ ] **Step 2: Secure chat route**

At the top of the POST handler, add auth check:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'

export const POST = withAdmin(async (req, { admin }) => {
  // ... existing handler code (the whole 190 lines)
}, 'chat')
```

Need to refactor the handler body into a function that takes `{ admin }`.

- [ ] **Step 3: Secure chat approve route**

Read the file first, then apply `withAdmin`.

- [ ] **Step 4: Secure file upload route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const POST = withAdmin(async (req: NextRequest, { admin }) => {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string

    if (!file || !orderId) {
      return NextResponse.json({ ok: false, error: 'Missing file or orderId' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ ok: false, error: 'File too large. Maximum 5MB.' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ ok: false, error: 'Invalid file type. Allowed: jpg, jpeg, png, webp' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ ok: false, error: 'Invalid MIME type' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const dir = path.join(process.cwd(), 'public/uploads/payments')
    await mkdir(dir, { recursive: true })
    const filename = `${orderId}-${Date.now()}.${ext}`
    await writeFile(path.join(dir, filename), buffer)

    return NextResponse.json({ ok: true, url: `/uploads/payments/${filename}` })
  } catch {
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 })
  }
}, 'orders')
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/seed/route.ts src/app/api/admin/chat/route.ts src/app/api/admin/chat/approve/route.ts src/app/api/upload/payment-proof/route.ts
git commit -m "feat: secure seed, chat, and upload routes with auth + validation"
```

---

### Task 15: PrismaClient Consolidation

**Files:**
- Search for files that use `new PrismaClient()` and replace with `import { db } from '@/lib/db'`

- [ ] **Step 1: Find all PrismaClient instances**

Run: `rg "new PrismaClient\(\)" src/app/api/`

Replace each instance: remove `const prisma = new PrismaClient()` and any `import { PrismaClient } from '@prisma/client'`, replace usage with `import { db } from '@/lib/db'` and `db` instead of `prisma`.

- [ ] **Step 2: Commit**

```bash
git add .
git commit -m "refactor: consolidate PrismaClient instances to shared db singleton"
```

---

### Task 16: Google OAuth — Schema Update

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add avatar and dateOfBirth to User model**

Add these fields after `phone`:

```prisma
  avatar      String?
  dateOfBirth DateTime?
```

- [ ] **Step 2: Run migration**

```bash
npx prisma generate
npx prisma migrate dev --name add_google_oauth_fields
```

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add avatar and dateOfBirth to User model for Google OAuth"
```

---

### Task 17: Google OAuth — Create Customer Auth API Route

**Files:**
- Create: `src/app/api/customer/auth/register/route.ts`
- Create: `src/app/api/customer/auth/login/route.ts`
- Create: `src/app/api/customer/auth/me/route.ts`
- Create: `src/app/api/customer/auth/logout/route.ts`

- [ ] **Step 1: Create login route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name }
    })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800, // 7 days
    })

    return response
  } catch (e) {
    console.error('Customer login error:', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Create register route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const user = await db.user.create({
      data: { email, name, password: await hashPassword(password) },
    })

    const token = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name }
    })

    response.cookies.set('__session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Create me route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get('__session')?.value
  const authHeader = req.headers.get('Authorization')
  const token = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const user = await db.user.findUnique({ where: { id: payload.userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
}
```

- [ ] **Step 4: Create logout route**

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set('__session', '', { httpOnly: true, path: '/api', maxAge: 0 })
  response.cookies.set('__session_admin', '', { httpOnly: true, path: '/api', maxAge: 0 })
  return response
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/api/customer/
git commit -m "feat: add customer auth routes with HttpOnly cookies"
```

---

### Task 18: Google OAuth — Create Google Auth Routes

**Files:**
- Create: `src/app/api/customer/auth/google/route.ts`
- Create: `src/app/api/customer/auth/google/callback/route.ts`

- [ ] **Step 1: Install googleapis**

```bash
npm install googleapis
```

- [ ] **Step 2: Create google route (initiate OAuth)**

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'Google OAuth not configured' }, { status: 500 })
  }

  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/customer/auth/google/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.phonenumbers.read',
    access_type: 'offline',
    prompt: 'consent',
  })

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
```

- [ ] **Step 3: Create callback route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { signToken } from '@/lib/customer-auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code')
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login?error=no_code', req.url))
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_URL}/api/customer/auth/google/callback`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/auth/login?error=config', req.url))
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri)
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const people = google.people({ version: 'v1', auth: oauth2Client })
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos,birthdays,phoneNumbers',
    })

    const data = profile.data
    const email = data.emailAddresses?.[0]?.value || ''
    const name = data.names?.[0]?.displayName || ''
    const avatar = data.photos?.[0]?.url || null
    const birthday = data.birthdays?.[0]?.date
    const phone = data.phoneNumbers?.[0]?.value || null

    if (!email) {
      return NextResponse.redirect(new URL('/auth/login?error=no_email', req.url))
    }

    let dateOfBirth: Date | null = null
    if (birthday?.year && birthday?.month && birthday?.day) {
      dateOfBirth = new Date(birthday.year, birthday.month - 1, birthday.day)
    }

    const user = await db.user.upsert({
      where: { email },
      update: {
        googleId: tokens.id_token || email,
        name: name || undefined,
        avatar: avatar || undefined,
        dateOfBirth: dateOfBirth || undefined,
        phone: phone || undefined,
      },
      create: {
        email,
        name,
        password: '',
        googleId: tokens.id_token || email,
        avatar,
        dateOfBirth,
        phone,
      },
    })

    const jwtToken = signToken({ userId: user.id, email: user.email })
    const response = NextResponse.redirect(new URL('/?google_login=success', req.url))

    response.cookies.set('__session', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api',
      maxAge: 604800,
    })

    return response
  } catch (e) {
    console.error('Google callback error:', e)
    return NextResponse.redirect(new URL('/auth/login?error=google_failed', req.url))
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/customer/auth/google/ package.json
git commit -m "feat: add Google OAuth customer login"
```

---

### Task 19: Verify Build

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Fix any errors that arise.

- [ ] **Step 2: Verify no regressions**

Check that:
- Admin login flow still works (you get a cookie + response)
- Existing API calls with `Authorization: Bearer` header still work (cookie fallback)
- All admin routes are wrapped — try a few: `GET /api/admin/customers`, `POST /api/admin/seed`
- File upload rejects non-image files and files > 5MB
- CSP headers appear in response
- Google OAuth redirects to Google

- [ ] **Step 3: Final commit if fixes needed**

```bash
git add -A
git commit -m "fix: build fixes after security hardening"
```

---

## Self-Review Checklist

- [ ] Task 1-2: Core infrastructure (`withAdmin`, `withRateLimit`) — foundational, must be done first
- [ ] Task 3: Security headers — independent
- [ ] Task 4: Hardcoded secrets — independent
- [ ] Task 5-6: Cookie migration — depends on Task 1 (cookie reading in getAdminFromToken)
- [ ] Tasks 7-13: Apply auth to all routes — depends on Task 1
- [ ] Task 14: Seed/chat/upload fixes — some depend on Task 1
- [ ] Task 15: PrismaClient — independent
- [ ] Task 16-18: Google OAuth — mostly independent
- [ ] Task 19: Build verification
