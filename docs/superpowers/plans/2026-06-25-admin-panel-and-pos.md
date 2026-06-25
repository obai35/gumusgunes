# Admin Panel & POS System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin panel at `/admin/*` with order/product/inventory management, discount codes, and an in-store POS system.

**Architecture:** Next.js App Router admin routes protected by next-auth middleware. Server Components for list pages, Client Components for interactive forms, Server Actions for mutations, and API routes for POS operations.

**Tech Stack:** Next.js 16, next-auth, Prisma/SQLite, shadcn/ui, recharts, bcryptjs, server actions

---

## File Map

### New Files
- `src/lib/auth.ts` — next-auth config (CredentialsProvider)
- `src/lib/auth-utils.ts` — password hashing helpers
- `src/app/api/auth/[...nextauth]/route.ts` — next-auth route handler
- `src/app/admin/layout.tsx` — admin layout with sidebar
- `src/app/admin/login/page.tsx` — login form
- `src/app/admin/page.tsx` — dashboard
- `src/app/admin/orders/page.tsx` — order list
- `src/app/admin/orders/[id]/page.tsx` — order detail
- `src/app/admin/products/page.tsx` — product list
- `src/app/admin/products/new/page.tsx` — add product
- `src/app/admin/products/[id]/edit/page.tsx` — edit product
- `src/app/admin/inventory/page.tsx` — inventory management
- `src/app/admin/pos/page.tsx` — POS checkout interface
- `src/app/admin/discounts/page.tsx` — discount management
- `src/components/admin/Sidebar.tsx` — sidebar navigation
- `src/components/admin/StatsCard.tsx` — stat card component
- `src/middleware.ts` — next-auth middleware

### Modified Files
- `prisma/schema.prisma` — add Admin, InventoryLog, Discount, update Order
- `package.json` — add bcryptjs
- `.env` — add NEXTAUTH_SECRET, NEXTAUTH_URL

### API Routes (New)
- `src/app/api/admin/seed/route.ts` — seed admin user (one-time)
- `src/app/api/admin/discounts/validate/route.ts` — validate discount code
- `src/app/api/admin/products/search/route.ts` — product search for POS
- `src/app/api/admin/pos/checkout/route.ts` — complete POS sale
- `src/app/api/admin/inventory/adjust/route.ts` — manual stock adjustment
- `src/app/api/admin/dashboard/stats/route.ts` — dashboard stats

---

### Task 1: Schema Migration + Dependencies

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `package.json`

- [ ] **Step 1: Install bcryptjs**

```bash
cd "C:\Users\obai\Desktop\website"
& "$env:USERPROFILE\.bun\bin\bun" add bcryptjs
& "$env:USERPROFILE\.bun\bin\bun" add -d @types/bcryptjs
```

- [ ] **Step 2: Add new models and update Order**

Edit `prisma/schema.prisma` — add these models after the existing `BackInStock` model:

```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      String   @default("admin")
  createdAt DateTime @default(now())
}

model InventoryLog {
  id        String   @id @default(cuid())
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  type      String
  quantity  Int
  note      String?
  orderId   String?
  createdAt DateTime @default(now())
}

model Discount {
  id         String   @id @default(cuid())
  code       String   @unique
  type       String
  value      Float
  minOrder   Float?
  maxUses    Int?
  usedCount  Int      @default(0)
  isActive   Boolean  @default(true)
  expiresAt  DateTime?
  createdAt  DateTime @default(now())
}
```

Add to Order model (after `notes` field):
```prisma
  discountId     String?
  discount       Discount? @relation(fields: [discountId], references: [id])
  discountAmount Float?
  paymentStatus  String    @default("pending")
  processedById  String?
  processedBy    Admin?    @relation(fields: [processedById], references: [id])
```

- [ ] **Step 3: Push schema**

```bash
cd "C:\Users\obai\Desktop\website"
& "$env:USERPROFILE\.bun\bin\bun" run db:push
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma package.json
git commit -m "feat: add Admin, InventoryLog, Discount models for admin panel"
```

---

### Task 2: Auth Setup (next-auth + login)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-utils.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/api/admin/seed/route.ts`
- Modify: `.env`

- [ ] **Step 1: Add env vars**

Add to `.env`:
```
NEXTAUTH_SECRET="admin-secret-change-in-production-$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_SEED_EMAIL="admin@gumusgunes.com"
ADMIN_SEED_PASSWORD="admin123"
```

- [ ] **Step 2: Create auth-utils.ts**

Create `src/lib/auth-utils.ts`:
```typescript
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

- [ ] **Step 3: Create auth.ts (next-auth config)**

Create `src/lib/auth.ts`:
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import { verifyPassword } from './auth-utils'

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const admin = await prisma.admin.findUnique({ where: { email: credentials.email } })
        if (!admin) return null
        const valid = await verifyPassword(credentials.password, admin.password)
        if (!valid) return null
        return { id: admin.id, email: admin.email, name: admin.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.email = user.email }
      return token
    },
    async session({ session, token }) {
      if (session.user) { session.user.id = token.id as string }
      return session
    },
  },
}
```

- [ ] **Step 4: Create next-auth route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 5: Create middleware**

Create `src/middleware.ts`:
```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
```

- [ ] **Step 6: Create seed admin API route**

Create `src/app/api/admin/seed/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '@/lib/auth-utils'

const prisma = new PrismaClient()

export async function POST() {
  const email = process.env.ADMIN_SEED_EMAIL || 'admin@gumusgunes.com'
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123'
  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ message: 'Admin already exists' })
  const admin = await prisma.admin.create({
    data: { email, name: 'Admin', password: await hashPassword(password), role: 'superadmin' },
  })
  return NextResponse.json({ message: 'Admin created', id: admin.id })
}
```

- [ ] **Step 7: Create login page**

Create `src/app/admin/login/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sun } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) setError('Invalid credentials')
    else router.push('/admin')
  }

  return (
    <div className="min-h-screen bg-navy-deep flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sun className="h-8 w-8 text-gold" />
            <span className="font-display text-xl text-navy">Admin</span>
          </div>
          <h1 className="text-2xl font-display font-semibold text-navy">Sign In</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          <input
            type="password" placeholder="Password" value={password} required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-navy text-silver rounded-lg font-medium hover:bg-navy/90 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Seed admin and verify**

```bash
cd "C:\Users\obai\Desktop\website"
curl.exe -X POST http://localhost:3000/api/admin/seed
```
Expected: `{"message":"Admin created","id":"..."}`

- [ ] **Step 9: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-utils.ts src/app/api/auth/ src/middleware.ts src/app/admin/ .env
git commit -m "feat: add next-auth admin authentication and login page"
```

---

### Task 3: Admin Layout + Sidebar

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Create sidebar**

Create `src/components/admin/Sidebar.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, Tag, LogOut, Sun,
} from 'lucide-react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart },
  { href: '/admin/discounts', label: 'Discounts', icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-navy-deep text-silver flex flex-col">
      <div className="flex items-center gap-2 px-6 py-6 border-b border-silver/10">
        <Sun className="h-6 w-6 text-gold" />
        <span className="font-display text-lg font-semibold">Admin</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gold/10 text-gold font-medium'
                  : 'text-silver/60 hover:text-silver hover:bg-silver/5'
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-silver/10">
        <button
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create admin layout**

Create `src/app/admin/layout.tsx`:
```tsx
import { Sidebar } from '@/components/admin/Sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx src/components/admin/
git commit -m "feat: add admin layout with sidebar navigation"
```

---

### Task 4: Dashboard Page

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/api/admin/dashboard/stats/route.ts`
- Create: `src/components/admin/StatsCard.tsx`

- [ ] **Step 1: Create StatsCard component**

Create `src/components/admin/StatsCard.tsx`:
```tsx
import { type LucideIcon } from 'lucide-react'

export function StatsCard({ icon: Icon, label, value, sub }: { icon: LucideIcon; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-border p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-lg bg-gold/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-gold" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-navy">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard stats API route**

Create `src/app/api/admin/dashboard/stats/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  const [ordersToday, ordersWeek, totalOrders, lowStock, revenueWeek] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.order.count(),
    prisma.product.count({ where: { stock: { lt: 5 }, isActive: true } }),
    prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: weekStart } } }),
  ])

  const recentOrders = await prisma.order.findMany({
    take: 10, orderBy: { createdAt: 'desc' },
    include: { items: true },
  })

  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lt: 5 }, isActive: true },
    select: { id: true, name: true, sku: true, stock: true },
    orderBy: { stock: 'asc' },
    take: 20,
  })

  return NextResponse.json({
    stats: {
      ordersToday, ordersWeek, totalOrders,
      lowStockCount: lowStock,
      revenueWeek: revenueWeek._sum.totalAmount || 0,
    },
    recentOrders,
    lowStockProducts,
  })
}
```

- [ ] **Step 3: Create dashboard page**

Create `src/app/admin/page.tsx`:
```tsx
import { ShoppingBag, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { PrismaClient } from '@prisma/client'
import { StatsCard } from '@/components/admin/StatsCard'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  const [ordersToday, ordersWeek, totalOrders, lowStock, revenueWeek, recentOrders, lowStockProducts] =
    await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.count(),
      prisma.product.count({ where: { stock: { lt: 5 }, isActive: true } }),
      prisma.order.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: weekStart } } }),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { items: true } }),
      prisma.product.findMany({
        where: { stock: { lt: 5 }, isActive: true },
        select: { id: true, name: true, sku: true, stock: true },
        orderBy: { stock: 'asc' }, take: 20,
      }),
    ])

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={ShoppingBag} label="Orders Today" value={String(ordersToday)} />
        <StatsCard icon={DollarSign} label="Revenue (Week)" value={`$${(revenueWeek._sum.totalAmount || 0).toFixed(2)}`} />
        <StatsCard icon={Package} label="Total Orders" value={String(totalOrders)} />
        <StatsCard icon={AlertTriangle} label="Low Stock Items" value={String(lowStock)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-navy mb-4">Recent Orders</h2>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.fullName} · ${order.totalAmount.toFixed(2)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{order.status}</span>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h2 className="font-display font-semibold text-navy mb-4">Low Stock Alerts</h2>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                }`}>{p.stock} left</span>
              </div>
            ))}
            {lowStockProducts.length === 0 && <p className="text-sm text-muted-foreground">All products are well-stocked.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx src/app/api/admin/dashboard/ src/components/admin/StatsCard.tsx
git commit -m "feat: add admin dashboard with stats and alerts"
```

---

### Task 5: Order Management

**Files:**
- Create: `src/app/admin/orders/page.tsx`
- Create: `src/app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create orders list page**

Create `src/app/admin/orders/page.tsx`:
```tsx
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'
import { ArrowRight } from 'lucide-react'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true, discount: true },
  })

  const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Orders</h1>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">{order.orderNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{order.fullName}<br /><span className="text-xs">{order.email}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{order.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-navy">${order.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] || ''}`}>{order.status}</span></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{order.paymentStatus}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create order detail page**

Create `src/app/admin/orders/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { OrderStatusUpdater } from './OrderStatusUpdater'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, discount: true },
  })
  if (!order) notFound()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Order {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">Placed on {order.createdAt.toLocaleDateString()}</p>
        </div>
        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} paymentStatus={order.paymentStatus} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <img src={item.product.imageUrl} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-navy">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.product.sku} · Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-navy">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Customer</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex"><dt className="w-24 text-muted-foreground">Name</dt><dd className="text-navy">{order.fullName}</dd></div>
              <div className="flex"><dt className="w-24 text-muted-foreground">Email</dt><dd className="text-navy">{order.email}</dd></div>
              {order.phone && <div className="flex"><dt className="w-24 text-muted-foreground">Phone</dt><dd className="text-navy">{order.phone}</dd></div>}
              <div className="flex"><dt className="w-24 text-muted-foreground">Address</dt><dd className="text-navy">{order.address}, {order.city}, {order.postalCode}, {order.country}</dd></div>
            </dl>
          </div>

          {order.notes && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h2 className="font-display font-semibold text-navy mb-4">Notes</h2>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd className="text-navy">${order.subtotal.toFixed(2)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd className="text-navy">{order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}`}</dd></div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between"><dt className="text-muted-foreground">Discount</dt><dd className="text-green-600">-${order.discountAmount.toFixed(2)}</dd></div>
              )}
              <div className="flex justify-between"><dt className="text-muted-foreground">Tax</dt><dd className="text-navy">${order.tax.toFixed(2)}</dd></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><dt className="text-navy">Total</dt><dd className="text-navy">${order.totalAmount.toFixed(2)}</dd></div>
            </dl>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Payment</h2>
            <p className="text-sm text-muted-foreground">Method: {order.paymentMethod}</p>
            <p className="text-sm text-muted-foreground">Status: {order.paymentStatus}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create the OrderStatusUpdater client component**

Create `src/app/admin/orders/[id]/OrderStatusUpdater.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded']

export function OrderStatusUpdater({ orderId, currentStatus, paymentStatus: currentPayment }: { orderId: string; currentStatus: string; paymentStatus: string }) {
  const [status, setStatus] = useState(currentStatus)
  const [paymentStatus, setPaymentStatus] = useState(currentPayment)
  const router = useRouter()

  async function updateStatus(field: string, value: string) {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, field, value }),
    })
    if (res.ok) {
      toast.success(`${field} updated to ${value}`)
      router.refresh()
    } else {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="flex gap-3">
      <select
        value={status} onChange={(e) => { setStatus(e.target.value); updateStatus('status', e.target.value) }}
        className="px-3 py-2 rounded-lg border border-border text-sm bg-white"
      >
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select
        value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); updateStatus('paymentStatus', e.target.value) }}
        className="px-3 py-2 rounded-lg border border-border text-sm bg-white"
      >
        {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
```

- [ ] **Step 4: Create the orders update-status API route**

Create `src/app/api/orders/update-status/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { orderId, field, value } = await req.json()
  if (!['status', 'paymentStatus'].includes(field)) {
    return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  }
  await prisma.order.update({ where: { id: orderId }, data: { [field]: value } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/orders/ src/app/api/orders/update-status/
git commit -m "feat: add order management (list + detail + status update)"
```

---

### Task 6: Product Management

**Files:**
- Create: `src/app/admin/products/page.tsx`
- Create: `src/app/admin/products/new/page.tsx`
- Create: `src/app/admin/products/[id]/edit/page.tsx`

- [ ] **Step 1: Create products list page**

Create `src/app/admin/products/page.tsx`:
```tsx
import Link from 'next/link'
import { PrismaClient } from '@prisma/client'
import { Plus, ArrowRight } from 'lucide-react'
import { ProductToggle } from './ProductToggle'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Product
        </Link>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Price</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.imageUrl} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                    <span className="font-medium text-navy">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.sku}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.category.name}</td>
                <td className="px-4 py-3 font-medium text-navy">${p.price.toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{p.stock}</span></td>
                <td className="px-4 py-3"><ProductToggle productId={p.id} field="isActive" value={p.isActive} /></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
                    Edit <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create ProductToggle client component**

Create `src/app/admin/products/ProductToggle.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ProductToggle({ productId, field, value }: { productId: string; field: string; value: boolean }) {
  const [checked, setChecked] = useState(value)
  const router = useRouter()

  async function toggle() {
    const res = await fetch('/api/admin/products/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, field, value: !checked }),
    })
    if (res.ok) { setChecked(!checked); router.refresh() }
  }

  return (
    <button
      onClick={toggle}
      className={`h-5 w-9 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}
```

- [ ] **Step 3: Create toggle API route**

Create `src/app/api/admin/products/toggle/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { productId, field, value } = await req.json()
  const allowed = ['isActive', 'isFeatured', 'isNew', 'isBestseller']
  if (!allowed.includes(field)) return NextResponse.json({ error: 'Invalid field' }, { status: 400 })
  await prisma.product.update({ where: { id: productId }, data: { [field]: value } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Create product form component**

Create `src/app/admin/products/ProductForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type ProductData = {
  name: string; slug: string; description: string; price: number; compareAtPrice?: number
  sku: string; categoryId: string; material: string; weight?: string; stock: number
  imageUrl: string; images: string; tags: string; isActive: boolean; isFeatured: boolean
  isNew: boolean; isBestseller: boolean
}

export function ProductForm({ categories, initialData, productId }: {
  categories: { id: string; name: string }[]
  initialData?: ProductData
  productId?: string
}) {
  const router = useRouter()
  const [form, setForm] = useState<ProductData>(initialData || {
    name: '', slug: '', description: '', price: 0, sku: '', categoryId: '',
    material: '', stock: 0, imageUrl: '', images: '[]', tags: '[]',
    isActive: true, isFeatured: false, isNew: false, isBestseller: false,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const url = productId ? `/api/admin/products/update` : '/api/admin/products/create'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: productId }),
    })
    if (res.ok) { toast.success(productId ? 'Product updated' : 'Product created'); router.push('/admin/products'); router.refresh() }
    else { toast.error('Failed to save product') }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Slug</label><input required value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">Description</label><textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 min-h-[80px]" /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="text-sm font-medium text-navy">Price ($)</label><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Compare At</label><input type="number" step="0.01" value={form.compareAtPrice || ''} onChange={(e) => setForm({ ...form, compareAtPrice: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Stock</label><input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">SKU</label><input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Category</label><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="text-sm font-medium text-navy">Material</label><input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
        <div><label className="text-sm font-medium text-navy">Weight</label><input value={form.weight || ''} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      </div>
      <div><label className="text-sm font-medium text-navy">Image URL</label><input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
      <div className="flex gap-4">
        {(['isFeatured', 'isNew', 'isBestseller', 'isActive'] as const).map((f) => (
          <label key={f} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.checked })} className="rounded" />{f.replace('is', '')}</label>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{productId ? 'Update' : 'Create'} Product</button>
        <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 5: Create API routes for product CRUD**

Create `src/app/api/admin/products/create/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const data = await req.json()
  const product = await prisma.product.create({
    data: {
      name: data.name, slug: data.slug, description: data.description,
      price: data.price, compareAtPrice: data.compareAtPrice, sku: data.sku,
      categoryId: data.categoryId, imageUrl: data.imageUrl, images: data.images || '[]',
      material: data.material, weight: data.weight, stock: data.stock, tags: data.tags || '[]',
      isActive: data.isActive ?? true, isFeatured: data.isFeatured ?? false,
      isNew: data.isNew ?? false, isBestseller: data.isBestseller ?? false,
    },
  })
  return NextResponse.json(product)
}
```

Create `src/app/api/admin/products/update/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const data = await req.json()
  const product = await prisma.product.update({
    where: { id: data.id },
    data: {
      name: data.name, slug: data.slug, description: data.description,
      price: data.price, compareAtPrice: data.compareAtPrice, sku: data.sku,
      categoryId: data.categoryId, imageUrl: data.imageUrl, images: data.images,
      material: data.material, weight: data.weight, stock: data.stock, tags: data.tags,
      isActive: data.isActive, isFeatured: data.isFeatured,
      isNew: data.isNew, isBestseller: data.isBestseller,
    },
  })
  return NextResponse.json(product)
}
```

- [ ] **Step 6: Create new product page**

Create `src/app/admin/products/new/page.tsx`:
```tsx
import { PrismaClient } from '@prisma/client'
import { ProductForm } from '../ProductForm'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Add Product</h1>
      <ProductForm categories={categories} />
    </div>
  )
}
```

- [ ] **Step 7: Create edit product page**

Create `src/app/admin/products/[id]/edit/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { PrismaClient } from '@prisma/client'
import { ProductForm } from '../../ProductForm'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await prisma.product.findUnique({ where: { id } })
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  if (!product) notFound()

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Edit {product.name}</h1>
      <ProductForm
        categories={categories}
        productId={product.id}
        initialData={{
          name: product.name, slug: product.slug, description: product.description,
          price: product.price, compareAtPrice: product.compareAtPrice || undefined,
          sku: product.sku, categoryId: product.categoryId, material: product.material,
          weight: product.weight || undefined, stock: product.stock, imageUrl: product.imageUrl,
          images: product.images, tags: product.tags, isActive: product.isActive,
          isFeatured: product.isFeatured, isNew: product.isNew, isBestseller: product.isBestseller,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/admin/products/ src/app/api/admin/products/
git commit -m "feat: add product management (list, create, edit, toggle)"
```

---

### Task 7: POS System

**Files:**
- Create: `src/app/admin/pos/page.tsx`
- Create: `src/app/api/admin/products/search/route.ts`
- Create: `src/app/api/admin/discounts/validate/route.ts`
- Create: `src/app/api/admin/pos/checkout/route.ts`

- [ ] **Step 1: Create product search API route**

Create `src/app/api/admin/products/search/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { name: { contains: q } },
        { sku: { contains: q } },
      ],
    },
    select: { id: true, name: true, sku: true, price: true, imageUrl: true, stock: true },
    take: 20,
  })
  return NextResponse.json(products)
}
```

- [ ] **Step 2: Create discount validation API route**

Create `src/app/api/admin/discounts/validate/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { code, subtotal } = await req.json()
  const discount = await prisma.discount.findUnique({ where: { code: code.toUpperCase() } })
  if (!discount) return NextResponse.json({ valid: false, error: 'Code not found' })
  if (!discount.isActive) return NextResponse.json({ valid: false, error: 'Code is inactive' })
  if (discount.expiresAt && new Date() > discount.expiresAt) return NextResponse.json({ valid: false, error: 'Code has expired' })
  if (discount.maxUses && discount.usedCount >= discount.maxUses) return NextResponse.json({ valid: false, error: 'Code has reached max uses' })
  if (discount.minOrder && subtotal < discount.minOrder) return NextResponse.json({ valid: false, error: `Minimum order $${discount.minOrder.toFixed(2)}` })

  let discountAmount = discount.type === 'percentage' ? subtotal * (discount.value / 100) : discount.value
  discountAmount = Math.min(discountAmount, subtotal)

  return NextResponse.json({ valid: true, discount, discountAmount })
}
```

- [ ] **Step 3: Create POS checkout API route**

Create `src/app/api/admin/pos/checkout/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { items, customer, paymentMethod, discountId, discountAmount, notes, adminId } = await req.json()

  if (!items?.length) return NextResponse.json({ error: 'No items' }, { status: 400 })

  // Validate stock and calculate totals
  let subtotal = 0
  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
    if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 })
    subtotal += product.price * item.quantity
  }

  const discount = discountAmount || 0
  const shipping = 0 // POS is in-store, no shipping
  const tax = subtotal * 0.18
  const total = subtotal + tax - discount

  // Generate order number
  const count = await prisma.order.count()
  const orderNumber = `POS-${String(count + 1).padStart(6, '0')}`

  // Create order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      email: customer.email || 'pos@sale',
      fullName: customer.name || 'POS Customer',
      phone: customer.phone,
      address: 'In-Store Purchase',
      city: 'Istanbul',
      postalCode: '34000',
      country: 'Turkey',
      subtotal,
      shipping,
      tax,
      totalAmount: total,
      status: 'delivered',
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: 'paid',
      discountId,
      discountAmount: discount,
      notes: notes || null,
      processedById: adminId || null,
      items: {
        create: items.map((item: { productId: string; quantity: number; price: number }) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: { items: true },
  })

  // Deduct stock and log inventory
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    })
    await prisma.inventoryLog.create({
      data: {
        productId: item.productId,
        type: 'sale',
        quantity: -item.quantity,
        note: `POS sale ${orderNumber}`,
        orderId: order.id,
      },
    })
  }

  // Increment discount usage
  if (discountId) {
    await prisma.discount.update({ where: { id: discountId }, data: { usedCount: { increment: 1 } } })
  }

  return NextResponse.json({ success: true, order })
}
```

- [ ] **Step 4: Create POS page**

Create `src/app/admin/pos/page.tsx`:
```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, X, Check } from 'lucide-react'
import { toast } from 'sonner'

type CartItem = { productId: string; name: string; sku: string; price: number; imageUrl: string; quantity: number; stock: number }

export default function POSPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' })
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ id: string; code: string; amount: number } | null>(null)
  const [notes, setNotes] = useState('')
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data)
    } finally { setSearching(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(query), 300)
    return () => clearTimeout(timer)
  }, [query, searchProducts])

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= existing.stock) { toast.error('Not enough stock'); return prev }
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, sku: product.sku, price: product.price, imageUrl: product.imageUrl, quantity: 1, stock: product.stock }]
    })
    setQuery('')
    setResults([])
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) => prev.map((i) => {
      if (i.productId !== productId) return i
      const newQty = i.quantity + delta
      if (newQty <= 0) return null as any
      if (newQty > i.stock) { toast.error('Not enough stock'); return i }
      return { ...i, quantity: newQty }
    }).filter(Boolean))
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const tax = subtotal * 0.18
  const total = subtotal + tax - (appliedDiscount?.amount || 0)

  async function applyDiscount() {
    if (!discountCode.trim()) return
    const res = await fetch('/api/admin/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: discountCode, subtotal }),
    })
    const data = await res.json()
    if (data.valid) {
      setAppliedDiscount({ id: data.discount.id, code: data.discount.code, amount: data.discountAmount })
      toast.success(`Discount applied: -$${data.discountAmount.toFixed(2)}`)
    } else {
      toast.error(data.error)
    }
  }

  async function checkout() {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          customer, paymentMethod, notes,
          discountId: appliedDiscount?.id || null,
          discountAmount: appliedDiscount?.amount || 0,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Sale complete! Order: ${data.order.orderNumber}`)
        setCart([])
        setCustomer({ name: '', email: '', phone: '' })
        setDiscountCode('')
        setAppliedDiscount(null)
        setNotes('')
      } else {
        toast.error(data.error || 'Checkout failed')
      }
    } catch { toast.error('Checkout failed') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex gap-4">
      {/* Left: Product Search */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gold"
          />
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3">
          {results.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:border-gold/50 transition-colors text-left">
              <img src={p.imageUrl} alt={p.name} className="h-14 w-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.sku}</p>
                <p className="text-sm font-semibold text-navy mt-0.5">${p.price.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
              </div>
              <Plus className="h-5 w-5 text-gold flex-shrink-0" />
            </button>
          ))}
          {query && !searching && results.length === 0 && <p className="col-span-2 text-center text-sm text-muted-foreground py-8">No products found</p>}
        </div>
        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium text-navy">Customer Info</h3>
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="px-3 py-2 rounded-lg border border-border text-sm" />
            <input placeholder="Email" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="px-3 py-2 rounded-lg border border-border text-sm" />
            <input placeholder="Phone" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="px-3 py-2 rounded-lg border border-border text-sm" />
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 flex flex-col gap-4">
        <div className="flex-1 bg-white rounded-xl border border-border p-4 overflow-y-auto">
          <h2 className="text-sm font-semibold text-navy mb-3">Cart ({cart.length} items)</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Search and add products</p>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center gap-3 p-2 rounded-lg border border-border/50">
                  <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.productId, -1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-gray-50"><Minus className="h-3 w-3" /></button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-gray-50"><Plus className="h-3 w-3" /></button>
                  </div>
                  <p className="text-sm font-semibold text-navy w-16 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="flex gap-2">
            <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Discount code" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
            <button onClick={applyDiscount} className="px-3 py-2 bg-navy text-silver rounded-lg text-sm hover:bg-navy/90"><Check className="h-4 w-4" /></button>
          </div>
          {appliedDiscount && <p className="text-xs text-green-600">Code {appliedDiscount.code}: -${appliedDiscount.amount.toFixed(2)}</p>}

          <div className="text-sm space-y-1">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Tax (18%)</span><span>${tax.toFixed(2)}</span></div>
            {appliedDiscount && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${appliedDiscount.amount.toFixed(2)}</span></div>}
            <div className="flex justify-between font-semibold text-navy pt-1 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>

          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
            <option value="cash">Cash</option>
            <option value="card">Credit Card</option>
          </select>

          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order notes..." className="w-full px-3 py-2 rounded-lg border border-border text-sm" />

          <button
            onClick={checkout}
            disabled={submitting || cart.length === 0}
            className="w-full py-3 bg-navy text-silver rounded-xl font-semibold text-sm hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Processing...' : `Complete Sale — $${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/pos/ src/app/api/admin/products/search/ src/app/api/admin/discounts/validate/ src/app/api/admin/pos/
git commit -m "feat: add POS system with search, cart, discounts, and checkout"
```

---

### Task 8: Inventory Management

**Files:**
- Create: `src/app/admin/inventory/page.tsx`
- Create: `src/app/api/admin/inventory/adjust/route.ts`

- [ ] **Step 1: Create inventory adjust API route**

Create `src/app/api/admin/inventory/adjust/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { productId, type, quantity, note } = await req.json()
  if (!productId || !quantity) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 400 })

  const newStock = type === 'in' ? product.stock + quantity : product.stock - Math.abs(quantity)
  if (newStock < 0) return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })

  await prisma.product.update({ where: { id: productId }, data: { stock: newStock } })
  await prisma.inventoryLog.create({
    data: {
      productId,
      type,
      quantity: type === 'in' ? quantity : -Math.abs(quantity),
      note: note || null,
    },
  })

  return NextResponse.json({ success: true, newStock })
}
```

- [ ] **Step 2: Create inventory page**

Create `src/app/admin/inventory/page.tsx`:
```tsx
import { PrismaClient } from '@prisma/client'
import { InventoryAdjustForm } from './InventoryAdjustForm'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function InventoryPage() {
  const [logs, products] = await Promise.all([
    prisma.inventoryLog.findMany({
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, sku: true, stock: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const lowStock = products.filter((p) => p.stock < 5)

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Inventory</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Recent Activity</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 text-sm">
                  <div>
                    <p className="font-medium text-navy">{log.product.name}</p>
                    <p className="text-xs text-muted-foreground">{log.product.sku} · {new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${log.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.quantity > 0 ? '+' : ''}{log.quantity}
                    </span>
                    <p className="text-xs text-muted-foreground">{log.type} {log.note && `· ${log.note}`}</p>
                  </div>
                </div>
              ))}
              {logs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border p-5">
            <h2 className="font-display font-semibold text-navy mb-4">Low Stock ({lowStock.length})</h2>
            <div className="space-y-2">
              {lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="text-navy truncate">{p.name}</span>
                  <span className={`font-medium ${p.stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>{p.stock}</span>
                </div>
              ))}
              {lowStock.length === 0 && <p className="text-sm text-muted-foreground">All well-stocked.</p>}
            </div>
          </div>

          <InventoryAdjustForm products={products} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create InventoryAdjustForm client component**

Create `src/app/admin/inventory/InventoryAdjustForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function InventoryAdjustForm({ products }: { products: { id: string; name: string; sku: string; stock: number }[] }) {
  const router = useRouter()
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!productId) { toast.error('Select a product'); return }
    const res = await fetch('/api/admin/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, type, quantity, note }),
    })
    if (res.ok) { toast.success('Stock adjusted'); router.refresh() }
    else { const data = await res.json(); toast.error(data.error || 'Failed') }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">Manual Adjustment</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">Select product...</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — Stock: {p.stock}</option>)}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={() => setType('in')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'in' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-50 text-muted-foreground border border-border'}`}>Stock In</button>
          <button type="button" onClick={() => setType('out')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${type === 'out' ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-50 text-muted-foreground border border-border'}`}>Stock Out</button>
        </div>
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason / note" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <button type="submit" className="w-full py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Apply</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/inventory/ src/app/api/admin/inventory/
git commit -m "feat: add inventory management with stock adjustments and log"
```

---

### Task 9: Discount Code Management

**Files:**
- Create: `src/app/admin/discounts/page.tsx`
- Create: `src/app/api/admin/discounts/create/route.ts`
- Create: `src/app/api/admin/discounts/toggle/route.ts`

- [ ] **Step 1: Create discount CRUD API routes**

Create `src/app/api/admin/discounts/create/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const data = await req.json()
  const discount = await prisma.discount.create({
    data: {
      code: data.code.toUpperCase(),
      type: data.type,
      value: data.value,
      minOrder: data.minOrder || null,
      maxUses: data.maxUses || null,
      isActive: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  })
  return NextResponse.json(discount)
}
```

Create `src/app/api/admin/discounts/toggle/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: Request) {
  const { id, isActive } = await req.json()
  await prisma.discount.update({ where: { id }, data: { isActive } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Create discounts page**

Create `src/app/admin/discounts/page.tsx`:
```tsx
import { PrismaClient } from '@prisma/client'
import { DiscountForm } from './DiscountForm'
import { DiscountToggle } from './DiscountToggle'

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic'

export default async function AdminDiscounts() {
  const discounts = await prisma.discount.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Discount Codes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Value</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uses</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expires</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono font-medium text-navy">{d.code}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.type === 'percentage' ? '%' : '$'}</td>
                    <td className="px-4 py-3 text-navy">{d.type === 'percentage' ? `${d.value}%` : `$${d.value.toFixed(2)}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ''}</td>
                    <td className="px-4 py-3 text-muted-foreground">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="px-4 py-3"><DiscountToggle discountId={d.id} isActive={d.isActive} /></td>
                  </tr>
                ))}
                {discounts.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No discount codes yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <DiscountForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create DiscountForm client component**

Create `src/app/admin/discounts/DiscountForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DiscountForm() {
  const router = useRouter()
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 10, minOrder: '', maxUses: '', expiresAt: '' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('Enter a code'); return }
    const res = await fetch('/api/admin/discounts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value as any),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : null,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
      }),
    })
    if (res.ok) { toast.success('Discount created'); setForm({ code: '', type: 'percentage', value: 10, minOrder: '', maxUses: '', expiresAt: '' }); router.refresh() }
    else toast.error('Failed')
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h2 className="font-display font-semibold text-navy mb-4">New Code</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. SUMMER25)" className="w-full px-3 py-2 rounded-lg border border-border text-sm uppercase" />
        <div className="flex gap-2">
          <button type="button" onClick={() => setForm({ ...form, type: 'percentage' })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === 'percentage' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-gray-50 border border-border text-muted-foreground'}`}>%</button>
          <button type="button" onClick={() => setForm({ ...form, type: 'fixed' })} className={`flex-1 py-2 rounded-lg text-sm font-medium ${form.type === 'fixed' ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-gray-50 border border-border text-muted-foreground'}`}>$</button>
        </div>
        <input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} placeholder="Value" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <input type="number" step="0.01" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} placeholder="Min order (optional)" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <input type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} placeholder="Max uses (optional)" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
        <button type="submit" className="w-full py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Create</button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create DiscountToggle component**

Create `src/app/admin/discounts/DiscountToggle.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DiscountToggle({ discountId, isActive: initial }: { discountId: string; isActive: boolean }) {
  const [checked, setChecked] = useState(initial)
  const router = useRouter()

  async function toggle() {
    const res = await fetch('/api/admin/discounts/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: discountId, isActive: !checked }),
    })
    if (res.ok) { setChecked(!checked); router.refresh() }
  }

  return (
    <button onClick={toggle} className={`h-5 w-9 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
      <div className={`h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/discounts/ src/app/api/admin/discounts/create/ src/app/api/admin/discounts/toggle/
git commit -m "feat: add discount code management"
```

---

### Task 10: Build & Verify

**Files:** (none, verification only)

- [ ] **Step 1: Build**

```bash
cd "C:\Users\obai\Desktop\website"
& "$env:USERPROFILE\.bun\bin\bun" run build 2>&1 | Select-String -NotMatch "cp: illegal"
```
Expected: "✓ Compiled successfully"

- [ ] **Step 2: Run dev server and test**

```bash
# Kill old server first
netstat -ano | Select-String ":3000 " | ForEach-Object { $parts = $_ -split '\s+'; if ($parts[-1] -ne '0') { taskkill /F /PID $parts[-1] } } 2>$null
Start-Sleep 2
Start-Process -NoNewWindow -FilePath "$env:USERPROFILE\.bun\bin\bun" -ArgumentList "run dev" -WorkingDirectory "C:\Users\obai\Desktop\website"
Start-Sleep 8
```

- [ ] **Step 3: Test admin login flow**

```bash
# Seed admin
curl.exe -X POST http://localhost:3000/api/admin/seed
# Verify login page loads
curl.exe -s -o /dev/null -w "%{http_code}" http://localhost:3000/admin/login
```
Expected: 200

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete admin panel with orders, products, POS, inventory, discounts"
```
