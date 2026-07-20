---
name: gumus-gunes-development
description: Use when creating new pages, API routes, components, or modifying existing code in this Next.js e-commerce project. Triggers: working with Prisma models, shadcn/ui components, Zustand stores, admin/customer auth, API route handlers, server components, client components, DataTable, TanStack Query, middleware, or following project conventions.
---

# Gümüş Güneş Development

## Project Structure

```
src/
  app/          # Next.js App Router (pages + API routes)
    admin/      # Admin dashboard (auth-guarded)
    api/        # All API routes (REST)
    account/    # Customer account pages
    + storefront pages, checkout, cart, products, etc.
  components/
    ui/         # shadcn/ui primitives (50+ components)
    store/      # Storefront components
    admin/      # Admin panel components
  lib/          # Shared utilities, auth, db, accounting, etc.
  hooks/        # Custom React hooks
  middleware.ts # CSRF + CSP + IP filtering
prisma/
  schema.prisma # 48 models
```

## API Route Pattern

All routes in `src/app/api/**/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import { withAdmin } from '@/lib/admin-permissions'
import { handleApiError } from '@/lib/api-error'

const Schema = z.object({ name: z.string().min(1) }).strict()

export const GET = withAdmin(async (req, { admin }) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    db.model.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.model.count({ where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined }),
  ])

  return NextResponse.json({ ok: true, items, total, page, totalPages: Math.ceil(total / limit) })
}, 'permission_key')

export const POST = withAdmin(async (req, { admin }) => {
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })

  const result = await db.model.create({ data: parsed.data })
  return NextResponse.json({ ok: true, result })
}, 'permission_key')
```

### Conventions:
- **Response format**: Always `{ ok: boolean, ...data }` or `{ error: string, ...details }`
- **Validation**: Zod `safeParse` with `.strict()` to reject extra fields
- **Auth**: Wrap with `withAdmin(handler, 'permission_key')` for admin endpoints; customer endpoints check JWT manually
- **Error handling**: Use `handleApiError(err, 'context')` for consistent status codes
- **Route params**: Use `params: Promise<{ id: string }>` (Next.js 16 pattern) with `await params`
- **Search**: `name: { contains: search, mode: 'insensitive' }` for case-insensitive
- **Pagination**: `skip = (page - 1) * limit`, return `total`, `page`, `totalPages`

## Component Patterns

### Server Component (default — no 'use client'):
```tsx
export const revalidate = 60  // ISR in seconds
export default async function Page() {
  const data = await db.model.findMany({ select: { id: true, name: true } })
  return <ClientComponent data={JSON.parse(JSON.stringify(data))} />
}
```

### Client Component:
```tsx
'use client'
import { useState, useEffect } from 'react'
export function ClientComponent({ data }: { data: SerializedType }) { ... }
```

### Rules:
- Server components FETCH data, client components DISPLAY it
- Always `JSON.parse(JSON.stringify(data))` when passing Prisma data to client components
- Client pages named `XxxClient.tsx` co-located with server `page.tsx`
- UI primitives from `@/components/ui/` (50+ shadcn components available)

## Admin Auth

- `withAdmin(handler, permissionKey)` wraps API routes
- Reads `__session_admin` httpOnly cookie
- JWT with 24h expiry, `tokenVersion` for session revocation
- Admin pages wrapped in `AdminShell` component
- `useAdminAuth` Zustand store for client-side auth state

## Customer Auth

- JWT-based (not NextAuth for customer-facing routes)
- 7-day token expiry via `NEXTAUTH_SECRET`
- Zustand `useAuth` store (not persisted)
- TOTP 2FA via `otplib`
- Rate-limited login: 5 req/30s, lockout after 10 failures

## Prisma Patterns

- Singleton client in `src/lib/db.ts`
- Always use `.select()` or `include` — never `findMany()` without specifying fields
- Compound indexes on filtered columns
- JSON fields stored as `String` type with manual parse/stringify
- Enums for status/type fields
- On delete: `Cascade` or `SetNull` on relations

## Zustand State Management

Key stores in `src/lib/*-store.ts`:
```tsx
'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useStore = create<StoreType>()(
  persist(
    (set, get) => ({ state: initial, action: () => set({ ... }) }),
    {
      name: 'gg_store_key',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ /* only persisted fields */ }),
    }
  )
)
```

Store keys use `gg_` prefix: `gg_cart`, `gg_wishlist`, `gg_locale`, `gg_currency`, etc.

## shadcn/ui Patterns

- Style: `new-york`
- Base color: `neutral`
- CSS variables in `globals.css`
- Usage: `import { Button } from '@/components/ui/button'`
- All components are 'use client' (Radix primitives)

## DataTable Pattern (Admin)

```tsx
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'

const columns: ColumnDef<T>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <Badge>{row.original.status}</Badge> },
  { id: 'actions', cell: ({ row }) => <Button onClick={() => onEdit(row.original)}>Edit</Button> },
]
```

## Middleware (`src/middleware.ts`)

- CSRF: Validates Origin/Referer for POST/PUT/PATCH (exempts webhooks)
- CSP headers for storefront pages (Stripe, PayPal, Google)
- Body size limit (500KB)
- Allowed origins from `ALLOWED_ORIGINS` env var

## Common Mistakes

- **Importing server modules in client components** — Never import `@/lib/db` or Prisma in 'use client'
- **Missing serialization** — Forgetting `JSON.parse(JSON.stringify(data))` when passing Prisma data to client
- **Wrong response format** — API must return `{ ok: true, ... }` not just bare data
- **Skipping Zod validation** — Always validate input with Zod `safeParse` + `.strict()`
- **Admin auth without `withAdmin`** — Admin API routes must use the wrapper
- **Hardcoded env access at module level** — Use lazy functions instead (see `src/lib/password.ts` for pattern)
