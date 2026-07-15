# UI/UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dark mode support, loading skeletons, responsive mobile improvements, and keyboard shortcuts to the admin panel.

**Architecture:** Use Tailwind `dark:` class strategy (already configured) with CSS variable theming. Build reusable skeleton components atop the existing shadcn `Skeleton`. Add mobile bottom navigation using lucide icons and a React context for keyboard shortcuts with a cheat sheet modal.

**Tech Stack:** Tailwind, shadcn/ui, lucide-react, framer-motion, React Context

---

### Task 1: Dark mode toggle component and provider

**Files:**
- Create: `src/components/admin/DarkModeToggle.tsx`
- Create: `src/hooks/useDarkMode.ts`
- Modify: `src/app/admin/layout.tsx` (add DarkModeToggle to sidebar)

- [ ] **Step 1: Create the dark mode hook**

```tsx
'use client'

import { useEffect, useState } from 'react'

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem('admin-theme')
    if (stored === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else if (stored === 'light') {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('admin-theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('admin-theme', 'light')
      }
      return next
    })
  }

  return { isDark, toggle, mounted }
}
```

- [ ] **Step 2: Create the toggle button component**

```tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useDarkMode } from '@/hooks/useDarkMode'

export function DarkModeToggle() {
  const { isDark, toggle, mounted } = useDarkMode()

  if (!mounted) {
    return <div className="h-9 w-9 rounded-lg bg-silver/5" />
  }

  return (
    <button
      onClick={toggle}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
```

- [ ] **Step 3: Add DarkModeToggle to the sidebar**

Edit `src/components/admin/Sidebar.tsx` - add the import and button next to Sign Out:

Add import at top:
```tsx
import { DarkModeToggle } from './DarkModeToggle'
```

Replace the Sign Out section (lines 85-93):
```tsx
        <div className="px-3 py-4 border-t border-silver/10 space-y-1">
          <DarkModeToggle />
          <button
            onClick={() => { logout(); router.push('/admin/login') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
```

- [ ] **Step 4: Update admin components to use CSS variables instead of hardcoded colors**

Edit `src/components/admin/AdminShell.tsx`:
- Change `bg-gray-50` to `bg-background` on line 23

```tsx
        <div className="flex min-h-screen bg-background">
```

Edit `src/components/admin/DataTable.tsx`:
- Replace hardcoded `bg-white` with `bg-card`
- Replace `border-gray-100` with `border-border`
- Replace `bg-gray-50/50` with `bg-muted/50`
- Replace `text-gray-500` with `text-muted-foreground`
- Replace `text-gray-700` with `text-foreground`
- Replace `text-gray-300` with `text-muted-foreground`
- Replace `text-gray-400` with `text-muted-foreground`
- Replace `hover:text-gray-700` with `hover:text-foreground`
- Replace `hover:bg-gray-50` with `hover:bg-muted/50`

Apply these edits to `DataTable.tsx`:

Change line 85:
```tsx
      <div className="bg-card rounded-xl border-border overflow-hidden p-4">
```

Change line 91-92:
```tsx
      <div className="bg-card rounded-xl border-border">
```

Change line 101-102:
```tsx
      <div className="bg-card rounded-xl border-border overflow-hidden">
        <div className="p-8 text-center text-muted-foreground">No data found</div>
```

Change line 108:
```tsx
    <div className="bg-card rounded-xl border-border overflow-hidden">
```

Change line 113:
```tsx
              <tr key={headerGroup.id} className="border-b border-border bg-muted/50">
```

Change lines 118-119:
```tsx
                    className={`text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer hover:text-foreground' : ''
```

Change line 132:
```tsx
                            <ChevronsUpDown className="h-3 w-3 text-muted" />
```

Change line 142:
```tsx
          <tbody className="divide-y divide-border/50">
```

Change line 147:
```tsx
                className={`${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors`}
```

Change line 150:
```tsx
                  <td key={cell.id} className="px-4 py-3 text-sm text-foreground">
```

Edit `src/components/admin/StatsCard.tsx`:

Change line 19:
```tsx
      className={`bg-card rounded-xl border-border p-5 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
```

Change line 27:
```tsx
          <p className="text-2xl font-semibold text-foreground">{value}</p>
```

Edit `src/components/admin/Skeleton.tsx`:

Change line 1:
```tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} {...props} />
}
```

Change line 21:
```tsx
    <div className="p-6 rounded-2xl bg-card border-border space-y-4">
```

- [ ] **Step 5: Update dashboard page hardcoded colors**

Edit `src/app/admin/page.tsx`:
- Replace `text-navy` with `text-foreground` on all non-sidebar headings
- Replace `bg-white` with `bg-card`
- Replace `bg-gray-50` with `bg-muted/50`
- Replace `hover:shadow-md` with `hover:shadow-md dark:shadow-white/5`
- Replace `text-blue-600` / `text-green-600` / `text-purple-600` with the same (these are intentionally colored, not semantic)
- Replace `text-navy` in headings:

Change line 61:
```tsx
        <h1 className="text-2xl font-display font-semibold text-foreground">Dashboard</h1>
```

Change line 68:
```tsx
            <div key={i} className="bg-card rounded-xl border-border p-5 h-24" />
```

Change line 96:
```tsx
        <Link href="/admin/products/new" className="flex flex-col items-center justify-center gap-2 bg-card rounded-xl border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-foreground">
```

Change line 102:
```tsx
        <Link href="/admin/orders" className="flex flex-col items-center justify-center gap-2 bg-card rounded-xl border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-foreground">
```

Change line 108:
```tsx
        <Link href="/admin/pos" className="flex flex-col items-center justify-center gap-2 bg-card rounded-xl border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-foreground">
```

Change line 114:
```tsx
        <Link href="/admin/accounting" className="flex flex-col items-center justify-center gap-2 bg-card rounded-xl border-border p-4 hover:shadow-md hover:border-gold/30 transition-all text-foreground">
```

Change lines 130 and 142:
```tsx
        <div className="bg-card rounded-xl border-border p-5">
```

Change line 132:
```tsx
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
```

Change line 148:
```tsx
            <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
```

Change lines 174-176 (loading placeholders):
```tsx
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
```

Change line 184:
```tsx
            <p className="text-sm font-medium text-foreground">{order.orderNumber || order.receiptNumber || `#${order.id.slice(0, 8)}`}</p>
```

Change lines 218-220:
```tsx
        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted/50 rounded" />)}
```

Change line 229:
```tsx
            <p className="text-sm font-medium text-foreground">{p.name}</p>
```

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useDarkMode.ts src/components/admin/DarkModeToggle.tsx src/components/admin/Sidebar.tsx src/components/admin/AdminShell.tsx src/components/admin/DataTable.tsx src/components/admin/StatsCard.tsx src/components/admin/Skeleton.tsx src/app/admin/page.tsx
git commit -m "feat(admin): dark mode toggle and CSS variable theming"
```

---

### Task 2: SkeletonCard, SkeletonTable, SkeletonChart components

**Files:**
- Modify: `src/components/admin/Skeleton.tsx` (add new skeleton components)

- [ ] **Step 1: Add SkeletonCard, SkeletonTable, SkeletonChart**

Replace the entire content of `src/components/admin/Skeleton.tsx`:

```tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`animate-pulse rounded bg-muted ${className ?? ''}`} {...props} />
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-card border-border space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card rounded-xl border-border overflow-hidden">
      <div className="bg-muted/50 p-4 flex gap-4 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="bg-card rounded-xl border-border p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  )
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  )
}

export function SkeletonStatsGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border-border p-5 flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/50 rounded-lg" />
      ))}
    </div>
  )
}

export function SkeletonReviewCard() {
  return (
    <div className="p-4 border-border rounded-lg space-y-2">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  )
}
```

- [ ] **Step 2: Update all loading.tsx files to use new skeleton components**

`src/app/admin/loading.tsx`:
```tsx
import { SkeletonChart, SkeletonStatsGrid } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <SkeletonChart />
      </div>
      <SkeletonStatsGrid count={4} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  )
}
```

`src/app/admin/orders/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={8} cols={4} />
    </div>
  )
}
```

`src/app/admin/products/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={8} cols={6} />
    </div>
  )
}
```

`src/app/admin/customers/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={8} cols={5} />
    </div>
  )
}
```

`src/app/admin/discounts/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
```

`src/app/admin/settings/loading.tsx`:
```tsx
import { SkeletonForm } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <SkeletonForm fields={4} />
    </div>
  )
}
```

`src/app/admin/stock-transfers/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <SkeletonTable rows={6} cols={6} />
    </div>
  )
}
```

`src/app/admin/reviews/loading.tsx`:
```tsx
import { SkeletonReviewCard } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonReviewCard key={i} />
        ))}
      </div>
    </div>
  )
}
```

`src/app/admin/branches/loading.tsx`:
```tsx
import { SkeletonCard } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
```

`src/app/admin/shipping/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <SkeletonTable rows={5} cols={5} />
    </div>
  )
}
```

`src/app/admin/admins/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
```

`src/app/admin/accounting/loading.tsx`:
```tsx
import { SkeletonChart, SkeletonStatsGrid } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonStatsGrid count={4} />
      <SkeletonChart />
      <SkeletonChart />
    </div>
  )
}
```

`src/app/admin/payments/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  )
}
```

`src/app/admin/security/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonTable rows={4} cols={4} />
    </div>
  )
}
```

`src/app/admin/newsletter/loading.tsx`:
```tsx
import { SkeletonTable } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonTable rows={5} cols={3} />
    </div>
  )
}
```

`src/app/admin/editor/loading.tsx`:
```tsx
import { SkeletonChart } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="p-6">
      <SkeletonChart />
    </div>
  )
}
```

`src/app/admin/customer-service/loading.tsx`:
```tsx
import { SkeletonList } from '@/components/admin/Skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <SkeletonList rows={8} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/Skeleton.tsx src/app/admin/loading.tsx src/app/admin/orders/loading.tsx src/app/admin/products/loading.tsx src/app/admin/customers/loading.tsx src/app/admin/discounts/loading.tsx src/app/admin/settings/loading.tsx src/app/admin/stock-transfers/loading.tsx src/app/admin/reviews/loading.tsx src/app/admin/branches/loading.tsx src/app/admin/shipping/loading.tsx src/app/admin/admins/loading.tsx src/app/admin/accounting/loading.tsx src/app/admin/payments/loading.tsx src/app/admin/security/loading.tsx src/app/admin/newsletter/loading.tsx src/app/admin/editor/loading.tsx src/app/admin/customer-service/loading.tsx
git commit -m "feat(admin): skeleton components and updated loading states"
```

---

### Task 3: Responsive improvements - mobile bottom nav, card-based tables, stacked forms

**Files:**
- Create: `src/components/admin/MobileBottomNav.tsx`
- Modify: `src/components/admin/AdminShell.tsx` (add bottom nav for mobile)
- Modify: `src/components/admin/DataTable.tsx` (add responsive card view)

- [ ] **Step 1: Create MobileBottomNav component**

```tsx
'use client'

import { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, Settings,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/admin/pos', label: 'POS', icon: ShoppingCart },
]

export const MobileBottomNav = memo(function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 transition-colors ${
                isActive
                  ? 'text-gold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium truncate max-w-full">{item.label}</span>
            </Link>
          )
        })}
        <Link
          href="/admin/settings"
          className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-0 transition-colors ${
            pathname.startsWith('/admin/settings')
              ? 'text-gold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">More</span>
        </Link>
      </div>
    </nav>
  )
})
```

- [ ] **Step 2: Add bottom nav and padding to AdminShell**

Edit `src/components/admin/AdminShell.tsx`:

Add import at top:
```tsx
import { MobileBottomNav } from './MobileBottomNav'
```

Add `pb-16 lg:pb-0` to the main element to avoid content being hidden behind bottom nav on mobile. Change line 32:
```tsx
            <main className="flex-1 p-6 overflow-auto min-w-0 pb-16 lg:pb-0">
```

Add the MobileBottomNav before the closing `</div>` of the `AdminAuthGuard` wrapper (after line 48/49):
```tsx
          {!isLogin && <MobileBottomNav />}
```

- [ ] **Step 3: Add responsive card mode to DataTable**

Edit `src/components/admin/DataTable.tsx` to show cards on mobile instead of table layout. Add a `responsiveCards` prop and render cards below `md:` breakpoint.

Add import:
```tsx
import { useMediaQuery } from '@/hooks/useMediaQuery'
```

Add to the DataTableProps type:
```tsx
  responsiveCards?: boolean
```

Add after the existing `if (loading)` block:
```tsx
  const isMobile = useMediaQuery('(max-width: 767px)')

  if (isMobile && responsiveCards && !loading && data.length > 0) {
    return (
      <div className="space-y-3 md:hidden">
        {data.map((item) => (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`bg-card rounded-xl border-border p-4 space-y-2 ${onRowClick ? 'cursor-pointer hover:border-gold/30 transition-colors' : ''}`}
          >
            {columns.map((col) => {
              const cellValue = 'accessorKey' in col
                ? String(col.accessorKey!.split('.').reduce((obj: any, key: string) => obj?.[key], item) ?? '')
                : ''
              return (
                <div key={String(col.id || col.header)} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground text-xs">{typeof col.header === 'string' ? col.header : ''}</span>
                  <span className="text-foreground font-medium">{cellValue}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
```

Now create the `useMediaQuery` hook at `src/hooks/useMediaQuery.ts`:
```tsx
'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
```

Add `responsiveCards` to the existing DataTable components that need it. For example in `src/app/admin/products/page.tsx`, add the prop to the DataTable:
```tsx
      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        selectable
        responsiveCards
        ...
      />
```

Similarly in `src/app/admin/inventory/page.tsx`, `src/app/admin/customers/page.tsx`, `src/app/admin/discounts/page.tsx`, `src/app/admin/orders/page.tsx`, `src/app/admin/admins/page.tsx`.

- [ ] **Step 4: Register global shortcuts for new order (Ctrl+N) and save (Ctrl+S)**

Edit `src/components/admin/AdminShortcuts.tsx` to add:

```tsx
  useShortcut({ key: 'n', ctrl: true, description: 'New order', handler: () => router.push('/admin/orders') })
  useShortcut({ key: 's', ctrl: true, description: 'Save / Confirm', handler: () => {
    const form = document.querySelector('form')
    if (form) form.requestSubmit()
  }})
  useShortcut({ key: '/', ctrl: true, description: 'Search / Focus search', handler: () => {
    const search = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="earch"]')
    if (search) search.focus()
  }})
```

- [ ] **Step 5: Make forms stack vertically on mobile**

Edit `src/app/admin/products/ProductForm.tsx` (read it first to find form layout patterns):

Apply these responsive classes:
- Any `flex gap-4` containing form fields → `flex flex-col sm:flex-row gap-4`
- Any `flex gap-2` containing buttons → `flex flex-col sm:flex-row gap-2`
- Input wrapper divs → add `w-full`
- Grid layouts → `grid grid-cols-1 sm:grid-cols-2 gap-4`

Apply the same patterns in these form files:
- `src/app/admin/inventory/adjust/AdjustForm.tsx`
- `src/app/admin/discounts/new/page.tsx`
- `src/app/admin/categories/page.tsx` (if it has forms)
- `src/app/admin/settings/page.tsx`
- `src/app/admin/branches/page.tsx`
- `src/app/admin/shipping/page.tsx`

- [ ] **Step 6: Add responsiveCards prop to existing DataTable usages**

`src/app/admin/products/page.tsx` - add to DataTable component:
```tsx
      <DataTable
        columns={columns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        selectable
        responsiveCards
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyTitle={searchQuery ? 'No products match your search' : 'No products yet'}
        emptyDescription={searchQuery ? 'Try adjusting your search terms' : 'Add your first product to get started'}
        emptyAction={searchQuery ? undefined : { label: 'Add Product', onClick: () => window.location.href = '/admin/products/new' }}
      />
```

`src/app/admin/inventory/page.tsx` - add to both DataTable instances:
```tsx
      <DataTable
        columns={productColumns}
        data={products}
        keyExtractor={(p) => p.id}
        loading={loading}
        responsiveCards
        onRowClick={(p) => window.location.href = `/admin/products/${p.id}/edit`}
        emptyTitle="No products in inventory"
      />
```
And:
```tsx
      <DataTable
        columns={logColumns}
        data={logs}
        keyExtractor={(l) => l.id}
        loading={loading}
        responsiveCards
        emptyTitle="No recent activity"
      />
```

`src/app/admin/orders/page.tsx`:
```tsx
      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        loading={loading}
        selectable
        responsiveCards
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting your search or filters"
      />
```

`src/app/admin/customers/page.tsx` (read first, add `responsiveCards` to DataTable):
```tsx
        responsiveCards
```

`src/app/admin/discounts/page.tsx` (read first, add `responsiveCards` to DataTable):
```tsx
        responsiveCards
```

`src/app/admin/admins/page.tsx` (read first, add `responsiveCards` to DataTable):
```tsx
        responsiveCards
```

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useMediaQuery.ts src/components/admin/MobileBottomNav.tsx src/components/admin/AdminShell.tsx src/components/admin/DataTable.tsx
git commit -m "feat(admin): responsive bottom nav, card-based data table, useMediaQuery hook"
```

---

### Task 4: Keyboard shortcut provider and cheat sheet

**Files:**
- Create: `src/components/admin/KeyboardShortcutProvider.tsx`
- Create: `src/components/admin/ShortcutCheatSheet.tsx`
- Modify: `src/components/admin/AdminShell.tsx` (wrap with provider)

- [ ] **Step 1: Create the KeyboardShortcutProvider**

```tsx
'use client'

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'

type Shortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  description: string
  handler: (e: KeyboardEvent) => void
}

type ShortcutContextValue = {
  registerShortcut: (shortcut: Shortcut) => () => void
  allShortcuts: Shortcut[]
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export function useShortcut(shortcut: Shortcut) {
  const ctx = useContext(ShortcutContext)
  if (!ctx) throw new Error('useShortcut must be used within KeyboardShortcutProvider')

  useEffect(() => {
    return ctx.registerShortcut(shortcut)
  }, [shortcut.key, shortcut.ctrl, shortcut.meta, shortcut.shift, shortcut.description])
}

export function KeyboardShortcutProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([])

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setShortcuts((prev) => [...prev.filter((s) => s.key !== shortcut.key || s.ctrl !== shortcut.ctrl), shortcut])
    return () => {
      setShortcuts((prev) => prev.filter((s) => s !== shortcut))
    }
  }, [])

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        if (e.key === 'Escape') {
          const active = document.activeElement as HTMLElement | null
          active?.blur()
          return
        }
        return
      }

      for (const s of shortcuts) {
        const ctrl = s.ctrl ?? false
        const meta = s.meta ?? false
        const shift = s.shift ?? false
        const matchCtrl = ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
        const matchMeta = meta ? e.metaKey : true
        const matchShift = shift ? e.shiftKey : !e.shiftKey
        const matchKey = e.key.toLowerCase() === s.key.toLowerCase()

        if (matchKey && matchCtrl && matchMeta && matchShift) {
          e.preventDefault()
          e.stopPropagation()
          s.handler(e)
          return
        }
      }
    }

    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [shortcuts])

  return (
    <ShortcutContext.Provider value={{ registerShortcut, allShortcuts: shortcuts }}>
      {children}
    </ShortcutContext.Provider>
  )
}
```

- [ ] **Step 2: Create the ShortcutCheatSheet modal**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Command, Keyboard } from 'lucide-react'
import { useShortcut } from './KeyboardShortcutProvider'

const DEFAULT_SHORTCUTS = [
  { key: 'n', ctrl: true, description: 'New order' },
  { key: 's', ctrl: true, description: 'Save / Confirm' },
  { key: '/', ctrl: true, description: 'Search / Focus search' },
  { key: '1', ctrl: true, description: 'Go to Dashboard' },
  { key: '2', ctrl: true, description: 'Go to Orders' },
  { key: '3', ctrl: true, description: 'Go to Products' },
  { key: '4', ctrl: true, description: 'Go to Inventory' },
  { key: 'Escape', description: 'Close modal / Blur input' },
]

export function ShortcutCheatSheet() {
  const [open, setOpen] = useState(false)

  useShortcut({
    key: '/',
    ctrl: true,
    shift: true,
    description: 'Show keyboard shortcuts',
    handler: () => setOpen((p) => !p),
  })

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-lg flex items-center justify-center text-silver/60 hover:text-silver hover:bg-silver/5 transition-colors"
        title="Keyboard shortcuts (Ctrl+Shift+/)"
      >
        <Keyboard className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-card border-border rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Command className="h-4 w-4 text-gold" />
                  <h2 className="font-semibold text-foreground text-sm">Keyboard Shortcuts</h2>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5 space-y-1 max-h-80 overflow-y-auto">
                {DEFAULT_SHORTCUTS.map((s) => (
                  <div key={`${s.key}-${s.ctrl}`} className="flex items-center justify-between py-2">
                    <span className="text-sm text-foreground">{s.description}</span>
                    <kbd className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs font-mono text-muted-foreground border border-border">
                      {s.ctrl && <span className="text-[10px]">⌘</span>}
                      {s.shift && <span className="text-[10px]">⇧</span>}
                      {s.key === 'Escape' ? 'Esc' : s.key === ' ' ? 'Space' : s.key === '/' ? '/' : s.key.toUpperCase()}
                    </kbd>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 bg-muted/30 border-t border-border">
                <p className="text-xs text-muted-foreground">Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">⌘/Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">⇧</kbd> + <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono border border-border">/</kbd> to toggle this panel</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 3: Wire provider into AdminShell**

Edit `src/components/admin/AdminShell.tsx`:

Add import:
```tsx
import { KeyboardShortcutProvider } from './KeyboardShortcutProvider'
import { ShortcutCheatSheet } from './ShortcutCheatSheet'
```

Wrap the content in `KeyboardShortcutProvider`. Add the ShortcutCheatSheet button next to DarkModeToggle in the Sign Out section of the Sidebar.

In `AdminShell.tsx`, wrap the entire return inside `KeyboardShortcutProvider`:

```tsx
  return (
    <AdminAuthGuard>
      <KeyboardShortcutProvider>
        {isLogin ? (
          <>{children}</>
        ) : (
          ...
        )}
        {!isLogin && <MobileBottomNav />}
      </KeyboardShortcutProvider>
    </AdminAuthGuard>
  )
```

Then in `src/components/admin/Sidebar.tsx`, add the ShortcutCheatSheet button next to DarkModeToggle. Edit the Sign Out section:

```tsx
        <div className="px-3 py-4 border-t border-silver/10 space-y-1">
          <div className="flex items-center gap-1">
            <DarkModeToggle />
            <ShortcutCheatSheet />
          </div>
          <button
            onClick={() => { logout(); router.push('/admin/login') }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-silver/60 hover:text-silver hover:bg-silver/5 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
```

Add import for `ShortcutCheatSheet` in `Sidebar.tsx`:
```tsx
import { ShortcutCheatSheet } from './ShortcutCheatSheet'
```

- [ ] **Step 4: Register admin page shortcuts**

Create `src/components/admin/AdminShortcuts.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { useShortcut } from './KeyboardShortcutProvider'

export function AdminShortcuts() {
  const router = useRouter()

  useShortcut({ key: '1', ctrl: true, description: 'Go to Dashboard', handler: () => router.push('/admin') })
  useShortcut({ key: '2', ctrl: true, description: 'Go to Orders', handler: () => router.push('/admin/orders') })
  useShortcut({ key: '3', ctrl: true, description: 'Go to Products', handler: () => router.push('/admin/products') })
  useShortcut({ key: '4', ctrl: true, description: 'Go to Inventory', handler: () => router.push('/admin/inventory') })

  return null
}
```

Add this to AdminShell inside the KeyboardShortcutProvider:
```tsx
import { AdminShortcuts } from './AdminShortcuts'
```
Add `<AdminShortcuts />` inside the provider after `<AdminAuthGuard>` content.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/KeyboardShortcutProvider.tsx src/components/admin/ShortcutCheatSheet.tsx src/components/admin/AdminShortcuts.tsx src/components/admin/AdminShell.tsx src/components/admin/Sidebar.tsx
git commit -m "feat(admin): keyboard shortcut provider, cheat sheet, and navigation shortcuts"
```
