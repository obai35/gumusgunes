# System Administration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Phase 8 of the admin panel — System Administration with audit log viewer, webhook management, API key management, cache management, feature flags, and system health dashboard.

**Architecture:** Six independent subsystems under `/admin/system/*`, each with its own Prisma model(s), API routes, and client page. All use existing `withAdmin('system')` permission middleware. Models are added to the existing `prisma/schema.prisma`. Audit logs reuse existing `ActivityLog` model. Cache management uses Upstash Redis (existing `@upstash/redis` package) and Next.js ISR revalidation.

**Tech Stack:** Next.js 15 App Router, Prisma (PostgreSQL), shadcn/ui, lucide-react, sonner, framer-motion, @upstash/redis, recharts (for health dashboard charts), uuid, Zustand, @tanstack/react-table

---

### Files to Create/Modify

**Prisma (Modify):**
- `prisma/schema.prisma` — Add models: `Webhook`, `WebhookDelivery`, `ApiKey`, `FeatureFlag`

**Lib (Create):**
- `src/lib/redis.ts` — Upstash Redis client singleton
- `src/lib/feature-flags.ts` — Server-side feature flag helpers

**Hooks (Create):**
- `src/hooks/use-feature-flag.ts` — Client hook for feature flags

**API Routes (Create):**
- `src/app/api/admin/system/audit-log/route.ts` — GET audit logs with filters/pagination
- `src/app/api/admin/system/webhooks/route.ts` — GET list, POST create
- `src/app/api/admin/system/webhooks/[id]/route.ts` — GET, PUT, DELETE single webhook
- `src/app/api/admin/system/webhooks/[id]/test/route.ts` — POST test delivery
- `src/app/api/admin/system/webhooks/deliveries/route.ts` — GET delivery logs
- `src/app/api/admin/system/api-keys/route.ts` — GET list, POST create
- `src/app/api/admin/system/api-keys/[id]/route.ts` — PUT, DELETE
- `src/app/api/admin/system/cache/route.ts` — POST clear cache actions
- `src/app/api/admin/system/feature-flags/route.ts` — GET list, POST create
- `src/app/api/admin/system/feature-flags/[id]/route.ts` — PUT, DELETE
- `src/app/api/admin/system/health/route.ts` — GET system health status

**Pages (Create):**
- `src/app/admin/system/audit-log/page.tsx`
- `src/app/admin/system/webhooks/page.tsx`
- `src/app/admin/system/api-keys/page.tsx`
- `src/app/admin/system/cache/page.tsx`
- `src/app/admin/system/feature-flags/page.tsx`
- `src/app/admin/system/health/page.tsx`

**Modify:**
- `src/lib/admin-permissions.ts` — Add `'system'` to `ALL_PERMISSIONS`
- `src/components/admin/Sidebar.tsx` — Add System section with links

---

### Task 1: Add Prisma Models (Webhook, WebhookDelivery, ApiKey, FeatureFlag)

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add Webhook, WebhookDelivery, ApiKey, FeatureFlag models to prisma/schema.prisma**

Add after the ActivityLog model (after line 630):

```prisma
model Webhook {
  id              String             @id @default(cuid())
  name            String
  url             String
  events          String             @default("[]")
  isActive        Boolean            @default(true)
  secret          String?
  lastDeliveryAt  DateTime?
  createdAt       DateTime           @default(now())
  deliveries      WebhookDelivery[]
}

model WebhookDelivery {
  id         String   @id @default(cuid())
  webhookId  String
  webhook    Webhook  @relation(fields: [webhookId], references: [id], onDelete: Cascade)
  event      String
  status     String   @default("pending")
  response   String?
  duration   Int?
  createdAt  DateTime @default(now())

  @@index([webhookId, createdAt])
}

model ApiKey {
  id          String   @id @default(cuid())
  name        String
  key         String   @unique
  permissions String   @default("[]")
  isActive    Boolean  @default(true)
  lastUsedAt  DateTime?
  createdAt   DateTime @default(now())
}

model FeatureFlag {
  id          String   @id @default(cuid())
  key         String   @unique
  name        String
  enabled     Boolean  @default(false)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 2: Run Prisma migration**

```bash
npx prisma migrate dev --name add-system-admin-models
```

Expected: Migration created and applied successfully.

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: Client regenerated with new models.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add Webhook, WebhookDelivery, ApiKey, FeatureFlag models"
```

---

### Task 2: Add 'system' permission and Sidebar System section

**Files:**
- Modify: `src/lib/admin-permissions.ts`
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Add 'system' to ALL_PERMISSIONS**

Edit `src/lib/admin-permissions.ts:5-10`:

```typescript
export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed', 'customer_service', 'social',
  'system',
] as const
```

- [ ] **Step 2: Add System section to sidebar**

Edit `src/components/admin/Sidebar.tsx`:

Add the import:
```typescript
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, Activity, Webhook, Key, Database, Flag, HeartPulse,
} from 'lucide-react'
```

Add system links after the social link (before the settings link):
```typescript
  { href: '/admin/social', label: 'Social', icon: Share2, permission: 'social' },
  { href: '/admin/system/audit-log', label: 'Audit Log', icon: Activity, permission: 'system' },
  { href: '/admin/system/webhooks', label: 'Webhooks', icon: Webhook, permission: 'system' },
  { href: '/admin/system/api-keys', label: 'API Keys', icon: Key, permission: 'system' },
  { href: '/admin/system/cache', label: 'Cache', icon: Database, permission: 'system' },
  { href: '/admin/system/feature-flags', label: 'Feature Flags', icon: Flag, permission: 'system' },
  { href: '/admin/system/health', label: 'System Health', icon: HeartPulse, permission: 'system' },
  { href: '/admin/editor', label: 'Site Editor', icon: Store, permission: 'editor' },
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/admin-permissions.ts src/components/admin/Sidebar.tsx
git commit -m "feat: add system permission and sidebar links"
```

---

### Task 3: Redis Client Singleton

**Files:**
- Create: `src/lib/redis.ts`

- [ ] **Step 1: Create Redis client**

```typescript
import { Redis } from '@upstash/redis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return null as unknown as Redis
  }
  return new Redis({ url, token })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/redis.ts
git commit -m "feat: add Redis client singleton"
```

---

### Task 4: Audit Log Viewer

**Files:**
- Create: `src/app/api/admin/system/audit-log/route.ts`
- Create: `src/app/admin/system/audit-log/page.tsx`

- [ ] **Step 1: Create API route for audit logs with filtering and pagination**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const action = searchParams.get('action')
  const resource = searchParams.get('resource')
  const adminId = searchParams.get('adminId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: any = {}
  if (action) where.action = action
  if (resource) where.resource = resource
  if (adminId) where.adminId = adminId
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = new Date(startDate)
    if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
  }

  const [logs, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.activityLog.count({ where }),
  ])

  const distinctActions = await db.activityLog.groupBy({
    by: ['action'],
    _count: { action: true },
    orderBy: { _count: { action: 'desc' } },
    take: 50,
  })

  const distinctResources = await db.activityLog.groupBy({
    by: ['resource'],
    _count: { resource: true },
    orderBy: { _count: { resource: 'desc' } },
    take: 50,
  })

  return NextResponse.json({
    logs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    filters: {
      actions: distinctActions.map(a => ({ value: a.action, count: a._count.action })),
      resources: distinctResources.map(r => ({ value: r.resource, count: r._count.resource })),
    },
  })
}, 'system')
```

- [ ] **Step 2: Create Audit Log page**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X, Activity, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type AuditLog = {
  id: string
  adminId: string | null
  adminName: string | null
  action: string
  resource: string
  resourceId: string | null
  details: string | null
  createdAt: string
}

type Filters = {
  action: string
  resource: string
  startDate: string
  endDate: string
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [availableActions, setAvailableActions] = useState<{ value: string; count: number }[]>([])
  const [availableResources, setAvailableResources] = useState<{ value: string; count: number }[]>([])
  const [filters, setFilters] = useState<Filters>({ action: '', resource: '', startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filters.action) params.set('action', filters.action)
      if (filters.resource) params.set('resource', filters.resource)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      const res = await fetch(`/api/admin/system/audit-log?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.pagination?.totalPages || 1)
      if (data.filters) {
        setAvailableActions(data.filters.actions || [])
        setAvailableResources(data.filters.resources || [])
      }
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const clearFilters = () => {
    setFilters({ action: '', resource: '', startDate: '', endDate: '' })
    setPage(1)
  }

  const hasFilters = Object.values(filters).some(v => v)

  const filteredLogs = search
    ? logs.filter(l =>
        (l.adminName || '').toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.resource.toLowerCase().includes(search.toLowerCase()) ||
        (l.resourceId || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.details || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'adminName',
      header: 'Admin',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-navy">{row.original.adminName || 'System'}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const colorMap: Record<string, string> = {
          create: 'text-green-600 bg-green-50',
          update: 'text-blue-600 bg-blue-50',
          delete: 'text-red-600 bg-red-50',
          login: 'text-purple-600 bg-purple-50',
          logout: 'text-gray-600 bg-gray-50',
        }
        const cls = colorMap[row.original.action] || 'text-gray-600 bg-gray-50'
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
            {row.original.action}
          </span>
        )
      },
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.resource}</span>
      ),
    },
    {
      accessorKey: 'resourceId',
      header: 'Resource ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-gray-400">{row.original.resourceId || '—'}</span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.original.details
        if (!details) return <span className="text-gray-400">—</span>
        try {
          const parsed = JSON.parse(details)
          return <span className="text-xs text-gray-500 max-w-[200px] truncate block">{JSON.stringify(parsed)}</span>
        } catch {
          return <span className="text-xs text-gray-500 max-w-[200px] truncate block">{details}</span>
        }
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Track all admin actions across the system"
      />

      <div className="bg-white rounded-xl border border-border mb-6">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm transition-colors ${
              hasFilters ? 'bg-navy text-silver border-navy' : 'hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-gold" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-600">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Action</label>
                <select
                  value={filters.action}
                  onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white"
                >
                  <option value="">All Actions</option>
                  {availableActions.map(a => (
                    <option key={a.value} value={a.value}>{a.value} ({a.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Resource</label>
                <select
                  value={filters.resource}
                  onChange={e => { setFilters(f => ({ ...f, resource: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white"
                >
                  <option value="">All Resources</option>
                  {availableResources.map(r => (
                    <option key={r.value} value={r.value}>{r.value} ({r.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        loading={loading}
        emptyTitle="No audit logs found"
        emptyDescription={hasFilters ? 'Try adjusting your filters' : 'No admin actions have been recorded yet'}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/system/audit-log/route.ts src/app/admin/system/audit-log/page.tsx
git commit -m "feat: add audit log viewer with filters and pagination"
```

---

### Task 5: Feature Flags (Server & Client infra)

**Files:**
- Create: `src/lib/feature-flags.ts`
- Create: `src/hooks/use-feature-flag.ts`
- Create: `src/app/api/admin/system/feature-flags/route.ts`
- Create: `src/app/api/admin/system/feature-flags/[id]/route.ts`
- Create: `src/app/admin/system/feature-flags/page.tsx`

- [ ] **Step 1: Create server-side feature flag helpers**

```typescript
import { db } from '@/lib/db'

const flagCache = new Map<string, { enabled: boolean; expiresAt: number }>()
const CACHE_TTL = 10_000

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = flagCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.enabled
  const flag = await db.featureFlag.findUnique({ where: { key } })
  const enabled = flag?.enabled ?? false
  flagCache.set(key, { enabled, expiresAt: Date.now() + CACHE_TTL })
  return enabled
}

export function clearFeatureFlagCache(key?: string) {
  if (key) flagCache.delete(key)
  else flagCache.clear()
}
```

- [ ] **Step 2: Create client-side useFeatureFlag hook**

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useFeatureFlag(key: string): boolean {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/system/feature-flags?key=${encodeURIComponent(key)}`)
      .then(r => r.json())
      .then(data => setEnabled(data.enabled ?? false))
      .catch(() => setEnabled(false))
  }, [key])

  return enabled
}
```

- [ ] **Step 3: Create feature flags API (list/create)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { clearFeatureFlagCache } from '@/lib/feature-flags'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const singleKey = searchParams.get('key')

  if (singleKey) {
    const flag = await db.featureFlag.findUnique({ where: { key: singleKey } })
    return NextResponse.json({ enabled: flag?.enabled ?? false })
  }

  const flags = await db.featureFlag.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ flags })
}, 'system')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { key, name, enabled, description } = await req.json()
    if (!key || !name) {
      return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
    }
    const flag = await db.featureFlag.create({
      data: {
        key: key.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        name,
        enabled: !!enabled,
        description: description || null,
      },
    })
    clearFeatureFlagCache(flag.key)
    return NextResponse.json({ flag })
  } catch (err: any) {
    if (err?.code === 'P2002') {
      return NextResponse.json({ error: 'A feature flag with this key already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
```

- [ ] **Step 4: Create feature flag single-resource API (update/delete)**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { clearFeatureFlagCache } from '@/lib/feature-flags'
import { db } from '@/lib/db'

export const PUT = withAdmin(async (req: Request, { params }: { params: { id: string } }) => {
  const id = params.id
  const { name, enabled, description, key } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (enabled !== undefined) data.enabled = enabled
  if (description !== undefined) data.description = description
  if (key !== undefined) data.key = key
  const flag = await db.featureFlag.update({ where: { id }, data })
  clearFeatureFlagCache(flag.key)
  return NextResponse.json({ flag })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params }: { params: { id: string } }) => {
  const id = params.id
  const flag = await db.featureFlag.findUnique({ where: { id } })
  if (!flag) {
    return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 })
  }
  await db.featureFlag.delete({ where: { id } })
  clearFeatureFlagCache(flag.key)
  return NextResponse.json({ success: true })
}, 'system')
```

- [ ] **Step 5: Create Feature Flags page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'
import { Switch } from '@/components/ui/switch'

type FeatureFlag = {
  id: string
  key: string
  name: string
  enabled: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FeatureFlag | null>(null)
  const [form, setForm] = useState({ key: '', name: '', description: '' })

  useEffect(() => { fetchFlags() }, [])

  async function fetchFlags() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/feature-flags')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setFlags(data.flags || [])
    } catch {
      toast.error('Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(flag: FeatureFlag) {
    try {
      const res = await fetch(`/api/admin/system/feature-flags/${flag.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${flag.name} ${flag.enabled ? 'disabled' : 'enabled'}`)
      fetchFlags()
    } catch {
      toast.error('Failed to toggle flag')
    }
  }

  async function saveFlag() {
    try {
      if (editing) {
        const res = await fetch(`/api/admin/system/feature-flags/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error()
        toast.success('Feature flag updated')
      } else {
        const res = await fetch('/api/admin/system/feature-flags', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create')
        }
        toast.success('Feature flag created')
      }
      setShowModal(false)
      setEditing(null)
      setForm({ key: '', name: '', description: '' })
      fetchFlags()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    }
  }

  async function deleteFlag(flag: FeatureFlag) {
    if (!confirm(`Delete "${flag.name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/system/feature-flags/${flag.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Feature flag deleted')
      fetchFlags()
    } catch {
      toast.error('Failed to delete')
    }
  }

  function openEdit(flag: FeatureFlag) {
    setEditing(flag)
    setForm({ key: flag.key, name: flag.name, description: flag.description || '' })
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ key: '', name: '', description: '' })
    setShowModal(true)
  }

  const columns: ColumnDef<FeatureFlag>[] = [
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{row.original.key}</span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span>,
    },
    {
      accessorKey: 'enabled',
      header: 'Status',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch checked={row.original.enabled} onCheckedChange={() => toggleFlag(row.original)} />
          <span className={`text-xs font-medium ${row.original.enabled ? 'text-green-600' : 'text-gray-400'}`}>
            {row.original.enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => deleteFlag(row.original)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        subtitle="Toggle features on/off without deployment"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> New Flag
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={flags}
        keyExtractor={(f) => f.id}
        loading={loading}
        emptyTitle="No feature flags"
        emptyDescription="Create your first feature flag to get started"
        emptyAction={{ label: 'Create Flag', onClick: openCreate }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-navy mb-4">{editing ? 'Edit Flag' : 'New Feature Flag'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={e => setForm(f => ({ ...f, key: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                  placeholder="e.g. new_checkout_flow"
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                  placeholder="e.g. New Checkout Flow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm min-h-[80px]"
                  placeholder="Optional description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setEditing(null) }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveFlag}
                disabled={!form.key || !form.name}
                className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
              >
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/feature-flags.ts src/hooks/use-feature-flag.ts src/app/api/admin/system/feature-flags/
git add src/app/admin/system/feature-flags/page.tsx
git commit -m "feat: add feature flags system with CRUD and client hook"
```

---

### Task 6: Webhook Management

**Files:**
- Create: `src/app/api/admin/system/webhooks/route.ts`
- Create: `src/app/api/admin/system/webhooks/[id]/route.ts`
- Create: `src/app/api/admin/system/webhooks/[id]/test/route.ts`
- Create: `src/app/api/admin/system/webhooks/deliveries/route.ts`
- Create: `src/app/admin/system/webhooks/page.tsx`

- [ ] **Step 1: Create webhooks list/create API**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

const EVENTS = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'payment.completed',
  'payment.failed',
  'product.created',
  'product.updated',
  'product.deleted',
  'customer.created',
  'admin.audit',
] as const

export const GET = withAdmin(async (_req: NextRequest) => {
  const webhooks = await db.webhook.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { deliveries: true } } },
  })
  return NextResponse.json({ webhooks, events: EVENTS })
}, 'system')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { name, url, events, isActive, secret } = await req.json()
    if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'name, url, and events (non-empty array) are required' }, { status: 400 })
    }
    try { new URL(url) } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }
    const invalid = events.filter((e: string) => !EVENTS.includes(e as any))
    if (invalid.length > 0) {
      return NextResponse.json({ error: `Invalid events: ${invalid.join(', ')}` }, { status: 400 })
    }
    const webhook = await db.webhook.create({
      data: { name, url, events: JSON.stringify(events), isActive: isActive ?? true, secret: secret || null },
    })
    return NextResponse.json({ webhook })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
```

- [ ] **Step 2: Create webhook single-resource API**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (_req: NextRequest, { params }: { params: { id: string } }) => {
  const webhook = await db.webhook.findUnique({
    where: { id: params.id },
    include: {
      deliveries: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  })
  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  return NextResponse.json({ webhook })
}, 'system')

export const PUT = withAdmin(async (req: Request, { params }: { params: { id: string } }) => {
  const existing = await db.webhook.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  const { name, url, events, isActive, secret } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (url !== undefined) {
    try { new URL(url) } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }) }
    data.url = url
  }
  if (events !== undefined) data.events = JSON.stringify(events)
  if (isActive !== undefined) data.isActive = isActive
  if (secret !== undefined) data.secret = secret
  const webhook = await db.webhook.update({ where: { id: params.id }, data })
  return NextResponse.json({ webhook })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params }: { params: { id: string } }) => {
  const existing = await db.webhook.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  await db.webhook.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'system')
```

- [ ] **Step 3: Create webhook test delivery API**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const POST = withAdmin(async (_req: Request, { params }: { params: { id: string } }) => {
  const webhook = await db.webhook.findUnique({ where: { id: params.id } })
  if (!webhook) {
    return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
  }
  const start = Date.now()
  const testPayload = {
    event: 'test.ping',
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test delivery from the admin panel.' },
  }
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (webhook.secret) {
      const crypto = await import('crypto')
      const signature = crypto.createHmac('sha256', webhook.secret).update(JSON.stringify(testPayload)).digest('hex')
      headers['X-Webhook-Signature'] = signature
    }
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload),
    })
    const duration = Date.now() - start
    const responseText = await res.text()
    await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: 'test.ping',
        status: res.ok ? 'success' : 'failed',
        response: JSON.stringify({ status: res.status, body: responseText.slice(0, 1000) }),
        duration,
      },
    })
    await db.webhook.update({ where: { id: webhook.id }, data: { lastDeliveryAt: new Date() } })
    return NextResponse.json({ success: res.ok, status: res.status, duration, response: responseText.slice(0, 500) })
  } catch (err: any) {
    const duration = Date.now() - start
    await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: 'test.ping',
        status: 'failed',
        response: JSON.stringify({ error: err.message }),
        duration,
      },
    })
    return NextResponse.json({ success: false, error: err.message, duration }, { status: 500 })
  }
}, 'system')
```

- [ ] **Step 4: Create webhook deliveries list API**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const webhookId = searchParams.get('webhookId')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
  const where: any = {}
  if (webhookId) where.webhookId = webhookId
  const [deliveries, total] = await Promise.all([
    db.webhookDelivery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { webhook: { select: { name: true, url: true } } },
    }),
    db.webhookDelivery.count({ where }),
  ])
  return NextResponse.json({
    deliveries,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}, 'system')
```

- [ ] **Step 5: Create Webhooks page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Webhook, ExternalLink, Play, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'
import { Switch } from '@/components/ui/switch'

type WebhookItem = {
  id: string
  name: string
  url: string
  events: string
  isActive: boolean
  lastDeliveryAt: string | null
  createdAt: string
  _count: { deliveries: number }
}

const AVAILABLE_EVENTS = [
  'order.created', 'order.updated', 'order.cancelled',
  'payment.completed', 'payment.failed',
  'product.created', 'product.updated', 'product.deleted',
  'customer.created', 'admin.audit',
]

export default function AdminWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<WebhookItem | null>(null)
  const [form, setForm] = useState({ name: '', url: '', events: [] as string[], isActive: true, secret: '' })
  const [testing, setTesting] = useState<string | null>(null)
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [showDeliveries, setShowDeliveries] = useState(false)
  const [showDeliveryLogs, setShowDeliveryLogs] = useState(false)

  useEffect(() => { fetchWebhooks() }, [])

  async function fetchWebhooks() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/webhooks')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWebhooks(data.webhooks || [])
    } catch {
      toast.error('Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDeliveries(webhookId?: string) {
    try {
      const params = webhookId ? `?webhookId=${webhookId}` : ''
      const res = await fetch(`/api/admin/system/webhooks/deliveries${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDeliveries(data.deliveries || [])
    } catch {
      toast.error('Failed to load delivery logs')
    }
  }

  async function toggleWebhook(webhook: WebhookItem) {
    try {
      const res = await fetch(`/api/admin/system/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !webhook.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Webhook ${webhook.isActive ? 'disabled' : 'enabled'}`)
      fetchWebhooks()
    } catch {
      toast.error('Failed to toggle webhook')
    }
  }

  async function testWebhook(webhook: WebhookItem) {
    setTesting(webhook.id)
    try {
      const res = await fetch(`/api/admin/system/webhooks/${webhook.id}/test`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        toast.success(`Test delivered in ${data.duration}ms`)
      } else {
        toast.error(`Delivery failed: ${data.error || data.status}`)
      }
    } catch {
      toast.error('Test request failed')
    } finally {
      setTesting(null)
    }
  }

  async function saveWebhook() {
    if (!form.name || !form.url || form.events.length === 0) {
      toast.error('Name, URL, and at least one event are required')
      return
    }
    try {
      const body: any = { ...form }
      if (!body.secret) delete body.secret
      if (editing) {
        const res = await fetch(`/api/admin/system/webhooks/${editing.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error()
        toast.success('Webhook updated')
      } else {
        const res = await fetch('/api/admin/system/webhooks', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create') }
        toast.success('Webhook created')
      }
      setShowModal(false); setEditing(null)
      setForm({ name: '', url: '', events: [], isActive: true, secret: '' })
      fetchWebhooks()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    }
  }

  function openEdit(wh: WebhookItem) {
    setEditing(wh)
    setForm({ name: wh.name, url: wh.url, events: JSON.parse(wh.events || '[]'), isActive: wh.isActive, secret: '' })
    setShowModal(true)
  }

  function openCreate() {
    setEditing(null)
    setForm({ name: '', url: '', events: [], isActive: true, secret: '' })
    setShowModal(true)
  }

  async function deleteWebhook(wh: WebhookItem) {
    if (!confirm(`Delete webhook "${wh.name}"?`)) return
    try {
      await fetch(`/api/admin/system/webhooks/${wh.id}`, { method: 'DELETE' })
      toast.success('Webhook deleted')
      fetchWebhooks()
    } catch { toast.error('Failed to delete') }
  }

  function toggleEvent(event: string) {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }))
  }

  function handleViewDeliveries(wh: WebhookItem) {
    fetchDeliveries(wh.id)
    setShowDeliveryLogs(true)
  }

  const columns: ColumnDef<WebhookItem>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'url',
      header: 'URL',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground font-mono max-w-[200px] truncate block">
          {row.original.url}
        </span>
      ),
    },
    {
      accessorKey: 'events',
      header: 'Events',
      cell: ({ row }) => {
        const events: string[] = JSON.parse(row.original.events || '[]')
        return (
          <div className="flex flex-wrap gap-1 max-w-[200px]">
            {events.slice(0, 3).map(e => (
              <span key={e} className="inline-block px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{e}</span>
            ))}
            {events.length > 3 && <span className="text-xs text-gray-400">+{events.length - 3}</span>}
          </div>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <Switch checked={row.original.isActive} onCheckedChange={() => toggleWebhook(row.original)} />
      ),
    },
    {
      accessorKey: '_count.deliveries',
      header: 'Deliveries',
      cell: ({ row }) => (
        <button
          onClick={() => handleViewDeliveries(row.original)}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          {row.original._count.deliveries}
        </button>
      ),
    },
    {
      accessorKey: 'lastDeliveryAt',
      header: 'Last Delivery',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastDeliveryAt ? new Date(row.original.lastDeliveryAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => testWebhook(row.original)}
            disabled={testing === row.original.id}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors disabled:opacity-50"
            title="Test delivery"
          >
            <Play className={`h-4 w-4 ${testing === row.original.id ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy" title="Edit">
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Webhooks"
        subtitle="Configure outbound webhook notifications"
        actions={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New Webhook
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={webhooks}
        keyExtractor={(w) => w.id}
        loading={loading}
        emptyTitle="No webhooks configured"
        emptyDescription="Create a webhook to receive event notifications"
        emptyAction={{ label: 'Create Webhook', onClick: openCreate }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-navy mb-4">{editing ? 'Edit Webhook' : 'New Webhook'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. Slack Notifications" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input type="url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" placeholder="https://hooks.example.com/..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secret (optional)</label>
                <input type="text" value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" placeholder="HMAC signing secret" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto">
                  {AVAILABLE_EVENTS.map(event => (
                    <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.events.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300"
                      />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={saveWebhook}
                disabled={!form.name || !form.url || form.events.length === 0}
                className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
              >{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeliveryLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeliveryLogs(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-navy">Delivery Logs</h2>
              <button onClick={() => setShowDeliveryLogs(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            {deliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deliveries recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {deliveries.map((d: any) => (
                  <div key={d.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {d.status === 'success' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium">{d.event}</span>
                        <span className="text-xs text-muted-foreground">{d.webhook?.name || d.webhookId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(d.createdAt).toLocaleString()}</span>
                    </div>
                    {d.response && (
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-[100px]">{d.response}</pre>
                    )}
                    {d.duration && <span className="text-xs text-muted-foreground mt-1 block">{d.duration}ms</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/system/webhooks/ src/app/admin/system/webhooks/page.tsx
git commit -m "feat: add webhook management with test delivery and delivery logs"
```

---

### Task 7: API Key Management

**Files:**
- Create: `src/app/api/admin/system/api-keys/route.ts`
- Create: `src/app/api/admin/system/api-keys/[id]/route.ts`
- Create: `src/app/admin/system/api-keys/page.tsx`

- [ ] **Step 1: Create API keys list/create API**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

function generateApiKey(): string {
  const prefix = 'gms'
  const random = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '')
  return `${prefix}_${random}`
}

export const GET = withAdmin(async () => {
  const keys = await db.apiKey.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({
    keys: keys.map(k => ({ ...k, key: k.key.slice(0, 12) + '...' })),
  })
}, 'system')

export const POST = withAdmin(async (req: Request) => {
  try {
    const { name, permissions } = await req.json()
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const rawKey = generateApiKey()
    const apiKey = await db.apiKey.create({
      data: {
        name,
        key: rawKey,
        permissions: JSON.stringify(permissions || []),
      },
    })
    return NextResponse.json({ apiKey: { ...apiKey, rawKey } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 })
  }
}, 'system')
```

- [ ] **Step 2: Create API key single-resource API**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'

export const PUT = withAdmin(async (req: Request, { params }: { params: { id: string } }) => {
  const existing = await db.apiKey.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }
  const { name, permissions, isActive } = await req.json()
  const data: any = {}
  if (name !== undefined) data.name = name
  if (permissions !== undefined) data.permissions = JSON.stringify(permissions)
  if (isActive !== undefined) data.isActive = isActive
  const apiKey = await db.apiKey.update({ where: { id: params.id }, data })
  return NextResponse.json({ apiKey: { ...apiKey, key: apiKey.key.slice(0, 12) + '...' } })
}, 'system')

export const DELETE = withAdmin(async (_req: Request, { params }: { params: { id: string } }) => {
  const existing = await db.apiKey.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'API key not found' }, { status: 404 })
  }
  await db.apiKey.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}, 'system')
```

- [ ] **Step 3: Create API Keys page**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Plus, Key, Copy, Check, Eye, EyeOff, Trash2, Power, PowerOff } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type ApiKey = {
  id: string
  name: string
  key: string
  permissions: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
}

export default function AdminApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<ApiKey | null>(null)
  const [form, setForm] = useState({ name: '', permissions: '' })
  const [newKeyRaw, setNewKeyRaw] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => { fetchKeys() }, [])

  async function fetchKeys() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/system/api-keys')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setKeys(data.keys || [])
    } catch {
      toast.error('Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  async function saveKey() {
    if (!form.name) { toast.error('Name is required'); return }
    try {
      const res = await fetch('/api/admin/system/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, permissions: form.permissions ? form.permissions.split(',').map(s => s.trim()) : [] }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed') }
      const data = await res.json()
      setNewKeyRaw(data.apiKey.rawKey)
      setForm({ name: '', permissions: '' })
      fetchKeys()
    } catch (err: any) {
      toast.error(err.message || 'Failed to create key')
    }
  }

  async function toggleKey(apiKey: ApiKey) {
    try {
      const res = await fetch(`/api/admin/system/api-keys/${apiKey.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !apiKey.isActive }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Key ${apiKey.isActive ? 'deactivated' : 'activated'}`)
      fetchKeys()
    } catch { toast.error('Failed to toggle key') }
  }

  async function deleteKey(apiKey: ApiKey) {
    if (!confirm(`Delete API key "${apiKey.name}"? This cannot be undone.`)) return
    try {
      await fetch(`/api/admin/system/api-keys/${apiKey.id}`, { method: 'DELETE' })
      toast.success('API key deleted')
      fetchKeys()
    } catch { toast.error('Failed to delete') }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const columns: ColumnDef<ApiKey>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span>,
    },
    {
      accessorKey: 'key',
      header: 'Key',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground bg-gray-50 px-2 py-1 rounded">{row.original.key}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${row.original.isActive ? 'text-green-600' : 'text-gray-400'}`}>
          {row.original.isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      accessorKey: 'lastUsedAt',
      header: 'Last Used',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lastUsedAt ? new Date(row.original.lastUsedAt).toLocaleString() : 'Never'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button onClick={() => toggleKey(row.original)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-navy transition-colors" title={row.original.isActive ? 'Deactivate' : 'Activate'}>
            {row.original.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </button>
          <button onClick={() => deleteKey(row.original)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="API Keys"
        subtitle="Manage API keys for programmatic access"
        actions={
          <button
            onClick={() => { setShowModal(true); setNewKeyRaw(null) }}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Plus className="h-4 w-4" /> Generate Key
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={keys}
        keyExtractor={(k) => k.id}
        loading={loading}
        emptyTitle="No API keys"
        emptyDescription="Generate your first API key for programmatic access"
        emptyAction={{ label: 'Generate Key', onClick: () => { setShowModal(true); setNewKeyRaw(null) } }}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4" onClick={e => e.stopPropagation()}>
            {newKeyRaw ? (
              <div>
                <h2 className="text-lg font-semibold text-navy mb-2">API Key Generated</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Copy this key now. You won't be able to see it again.
                </p>
                <div className="flex items-center gap-2 bg-gray-50 border border-border rounded-lg p-3 mb-4">
                  <code className="flex-1 text-sm font-mono break-all">{newKeyRaw}</code>
                  <button
                    onClick={() => copyToClipboard(newKeyRaw)}
                    className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
                <button
                  onClick={() => { setShowModal(false); setNewKeyRaw(null) }}
                  className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-navy mb-4">Generate API Key</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder="e.g. Production Integration"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Permissions (comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      value={form.permissions}
                      onChange={e => setForm(f => ({ ...f, permissions: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                      placeholder="e.g. orders:read, products:write"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                  <button onClick={saveKey} disabled={!form.name}
                    className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50"
                  >Generate</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/system/api-keys/ src/app/admin/system/api-keys/page.tsx
git commit -m "feat: add API key management with generate/revoke"
```

---

### Task 8: Cache Management

**Files:**
- Create: `src/app/api/admin/system/cache/route.ts`
- Create: `src/app/admin/system/cache/page.tsx`

- [ ] **Step 1: Create cache management API**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { redis } from '@/lib/redis'
import { revalidatePath } from 'next/cache'

export const POST = withAdmin(async (req: Request) => {
  const { action, key } = await req.json()
  const results: Record<string, any> = {}

  switch (action) {
    case 'clear-redis': {
      if (!redis) {
        results.redis = { error: 'Redis not configured' }
      } else {
        try {
          await redis.flushall()
          results.redis = { success: true }
        } catch (err: any) {
          results.redis = { error: err.message }
        }
      }
      break
    }
    case 'delete-redis-key': {
      if (!redis) {
        results.redis = { error: 'Redis not configured' }
      } else if (!key) {
        results.redis = { error: 'key is required' }
      } else {
        try {
          await redis.del(key)
          results.redis = { success: true, key }
        } catch (err: any) {
          results.redis = { error: err.message }
        }
      }
      break
    }
    case 'clear-isr': {
      try {
        revalidatePath('/', 'layout')
        results.isr = { success: true }
      } catch (err: any) {
        results.isr = { error: err.message }
      }
      break
    }
    case 'clear-cdn': {
      const cdnUrl = process.env.CDN_PURGE_URL
      if (!cdnUrl) {
        results.cdn = { error: 'CDN_PURGE_URL not configured' }
      } else {
        try {
          const res = await fetch(cdnUrl, { method: 'POST' })
          results.cdn = { success: res.ok, status: res.status }
        } catch (err: any) {
          results.cdn = { error: err.message }
        }
      }
      break
    }
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  return NextResponse.json({ results })
}, 'system')
```

- [ ] **Step 2: Create Cache Management page**

```tsx
'use client'

import { useState } from 'react'
import { Database, RefreshCw, Globe, Trash2, CheckCircle2, XCircle, Server, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

type CacheAction = 'clear-redis' | 'delete-redis-key' | 'clear-isr' | 'clear-cdn'

export default function AdminCache() {
  const [loading, setLoading] = useState<CacheAction | null>(null)
  const [results, setResults] = useState<Record<string, any> | null>(null)
  const [redisKey, setRedisKey] = useState('')

  async function executeAction(action: CacheAction) {
    if (action === 'delete-redis-key' && !redisKey) {
      toast.error('Enter a Redis key to delete')
      return
    }
    if (!confirm(`Are you sure you want to ${action.replace(/-/g, ' ')}?`)) return
    setLoading(action)
    setResults(null)
    try {
      const body: any = { action }
      if (action === 'delete-redis-key') body.key = redisKey
      const res = await fetch('/api/admin/system/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setResults(data.results || data)
      const allSuccess = Object.values(data.results || {}).every((r: any) => r.success)
      if (allSuccess) {
        toast.success(`${action.replace(/-/g, ' ')} completed successfully`)
      } else {
        toast.warning('Some cache operations had errors')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear cache')
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    {
      id: 'clear-redis' as CacheAction,
      title: 'Clear Redis Cache',
      description: 'Flush all Redis keys. This will clear cached data, sessions, and temporary data.',
      icon: Database,
      color: 'text-orange-600 bg-orange-50',
      requiresKey: false,
    },
    {
      id: 'delete-redis-key' as CacheAction,
      title: 'Delete Redis Key',
      description: 'Delete a specific Redis key by name.',
      icon: Trash2,
      color: 'text-yellow-600 bg-yellow-50',
      requiresKey: true,
    },
    {
      id: 'clear-isr' as CacheAction,
      title: 'Clear ISR Cache',
      description: 'Revalidate all Next.js Incremental Static Regeneration (ISR) cache. Pages will be regenerated on next request.',
      icon: RefreshCw,
      color: 'text-blue-600 bg-blue-50',
      requiresKey: false,
    },
    {
      id: 'clear-cdn' as CacheAction,
      title: 'Purge CDN Cache',
      description: 'Send a purge request to the CDN to clear cached static assets.',
      icon: Globe,
      color: 'text-purple-600 bg-purple-50',
      requiresKey: false,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Cache Management"
        subtitle="Clear and manage system caches"
      />

      <div className="grid gap-4">
        {actions.map(action => (
          <div key={action.id} className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-navy">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">{action.description}</p>
                  {action.requiresKey && (
                    <input
                      type="text"
                      value={redisKey}
                      onChange={e => setRedisKey(e.target.value)}
                      placeholder="e.g. product:123"
                      className="mt-3 px-3 py-2 rounded-lg border border-border text-sm font-mono w-full max-w-sm"
                    />
                  )}
                </div>
              </div>
              <button
                onClick={() => executeAction(action.id)}
                disabled={loading === action.id}
                className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {loading === action.id ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {loading === action.id ? 'Clearing...' : 'Clear'}
              </button>
            </div>

            {results && (() => {
              const key = action.id === 'delete-redis-key' ? 'redis' : action.id === 'clear-redis' ? 'redis' : action.id === 'clear-isr' ? 'isr' : 'cdn'
              const result = results[key]
              if (!result) return null
              return (
                <div className={`mt-4 flex items-start gap-2 text-sm p-3 rounded-lg ${
                  result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {result.success ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    {result.success ? 'Operation completed successfully' : result.error || 'Operation failed'}
                    {result.key && <span className="block font-mono text-xs mt-1">Key: {result.key}</span>}
                    {result.status && <span className="block text-xs mt-1">HTTP {result.status}</span>}
                  </div>
                </div>
              )
            })()}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/system/cache/route.ts src/app/admin/system/cache/page.tsx
git commit -m "feat: add cache management page with Redis, ISR, and CDN purge"
```

---

### Task 9: System Health Dashboard

**Files:**
- Create: `src/app/api/admin/system/health/route.ts`
- Create: `src/app/admin/system/health/page.tsx`

- [ ] **Step 1: Create system health API**

```typescript
import { NextResponse } from 'next/server'
import { withAdmin } from '@/lib/admin-permissions'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { version } from '@/../package.json'

export const GET = withAdmin(async () => {
  const start = Date.now()
  const checks: Record<string, any> = {}

  // Database check
  try {
    const dbStart = Date.now()
    await db.$queryRaw`SELECT 1`
    checks.database = { status: 'healthy', latency: Date.now() - dbStart }
  } catch (err: any) {
    checks.database = { status: 'unhealthy', error: err.message }
  }

  // Redis check
  if (redis) {
    try {
      const redisStart = Date.now()
      await redis.ping()
      checks.redis = { status: 'healthy', latency: Date.now() - redisStart }
    } catch (err: any) {
      checks.redis = { status: 'unhealthy', error: err.message }
    }
  } else {
    checks.redis = { status: 'not_configured' }
  }

  // Error rate (last 24h from audit logs as proxy)
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const [totalLogs, errorLogs] = await Promise.all([
      db.activityLog.count({ where: { createdAt: { gte: last24h } } }),
      db.activityLog.count({
        where: { createdAt: { gte: last24h }, action: { in: ['error', 'delete'] } },
      }),
    ])
    checks.errorRate = {
      total: totalLogs,
      errors: errorLogs,
      rate: totalLogs > 0 ? ((errorLogs / totalLogs) * 100).toFixed(2) + '%' : '0%',
    }
  } catch {
    checks.errorRate = { status: 'unavailable' }
  }

  // Queue depth (approximate via pending orders)
  try {
    const pendingOrders = await db.order.count({ where: { status: 'pending' } })
    checks.queueDepth = { pendingOrders }
  } catch {
    checks.queueDepth = { status: 'unavailable' }
  }

  // Database connections (approximate - postgres)
  try {
    const result: any = await db.$queryRaw`SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active'`
    checks.dbConnections = { active: result[0]?.count || 0 }
  } catch {
    checks.dbConnections = { status: 'unavailable' }
  }

  // Uptime via server startup
  const uptimeHours = Math.floor(process.uptime() / 3600)
  const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60)

  const overallLatency = Date.now() - start

  return NextResponse.json({
    status: Object.values(checks).every((c: any) => c.status === 'healthy' || c.status === 'not_configured') ? 'healthy' : 'degraded',
    uptime: `${uptimeHours}h ${uptimeMinutes}m`,
    latency: overallLatency,
    version: version || '1.0.0',
    timestamp: new Date().toISOString(),
    checks,
  })
}, 'system')
```

- [ ] **Step 2: Create System Health page**

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { HeartPulse, Database, Server, HardDrive, Activity, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle, Minus } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'

type HealthCheck = {
  status: string
  latency?: number
  error?: string
  [key: string]: any
}

type HealthData = {
  status: string
  uptime: string
  latency: number
  version: string
  timestamp: string
  checks: Record<string, HealthCheck>
}

export default function AdminSystemHealth() {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/admin/system/health')
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      if (!silent) setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchHealth() }, [fetchHealth])

  function refresh() {
    setRefreshing(true)
    fetchHealth(true)
  }

  function statusIcon(status: string) {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'unhealthy': return <XCircle className="h-5 w-5 text-red-500" />
      case 'degraded': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'not_configured': return <Minus className="h-5 w-5 text-gray-400" />
      default: return <Minus className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="System Health" subtitle="Monitor system status and performance" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="System Health" subtitle="Monitor system status and performance" />
        <div className="bg-white rounded-xl border border-border p-12 text-center">
          <HeartPulse className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load health data</p>
          <button onClick={refresh} className="mt-4 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summaryCards = [
    { label: 'Status', value: data.status, icon: HeartPulse, color: data.status === 'healthy' ? 'text-green-600 bg-green-50' : data.status === 'degraded' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50' },
    { label: 'Uptime', value: data.uptime, icon: Clock, color: 'text-blue-600 bg-blue-50' },
    { label: 'Response', value: `${data.latency}ms`, icon: Activity, color: 'text-purple-600 bg-purple-50' },
    { label: 'Version', value: data.version, icon: Server, color: 'text-gray-600 bg-gray-50' },
  ]

  return (
    <div>
      <PageHeader
        title="System Health"
        subtitle="Monitor system status and performance"
        actions={
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryCards.map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-semibold text-navy capitalize">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-navy">Service Checks</h2>
        </div>
        <div className="divide-y divide-border">
          {Object.entries(data.checks).map(([name, check]) => (
            <div key={name} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {statusIcon(check.status)}
                <div>
                  <span className="text-sm font-medium text-navy capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                  {check.latency !== undefined && (
                    <span className="text-xs text-muted-foreground ml-2">{check.latency}ms</span>
                  )}
                  {check.error && (
                    <p className="text-xs text-red-500 mt-0.5">{check.error}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {check.total !== undefined && <span>Total: {check.total}</span>}
                {check.errors !== undefined && <span>Errors: {check.errors}</span>}
                {check.rate !== undefined && <span>Rate: {check.rate}</span>}
                {check.pendingOrders !== undefined && <span>Pending: {check.pendingOrders}</span>}
                {check.active !== undefined && <span>Active: {check.active}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground text-right">
        Last checked: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/system/health/route.ts src/app/admin/system/health/page.tsx
git commit -m "feat: add system health dashboard with service checks"
```

---

### Self-Review Checklist

- [x] **Spec coverage:** Audit log viewer (Task 4), Webhook management (Task 6), API key management (Task 7), Cache management (Task 8), Feature flags (Task 5), System health (Task 9). All six subsystems covered.
- [x] **Placeholder scan:** No TBD, TODOs, or placeholder patterns. All code is complete.
- [x] **Type consistency:** All models, routes, and components reference consistent field names (id, name, key, isActive, etc.). API paths follow `/api/admin/system/*` pattern. Permission name `'system'` is consistent across middleware usage, sidebar links, and ALL_PERMISSIONS.
- [x] **Redis handling:** The `src/lib/redis.ts` handles the case where Redis is not configured by returning null, and cache management API checks for this.
- [x] **Prisma schema:** All new models are added to exactly one location (after ActivityLog model) to avoid merge conflicts. No existing models are modified.
