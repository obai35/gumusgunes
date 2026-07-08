# Admin Panel Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish admin panel with consistent loading states, error boundaries, page transitions, and modal animations across all 20+ routes.

**Architecture:** Reuse existing `Skeleton` component (already has shimmer) for loaders; reuse `ErrorFallback` component for error boundaries; reuse `PageTransition` component for page transitions; add framer-motion `AnimatePresence` wrappers for modals.

**Tech Stack:** Next.js 15, Tailwind CSS v4, framer-motion 12.x, shadcn/ui Skeleton component, existing ErrorFallback component

---

## File Structure

### Modified files:

| File | Change |
|------|--------|
| `src/app/admin/products/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/orders/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/customers/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/reviews/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/newsletter/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/discounts/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/inventory/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/stock-transfers/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/payments/page.tsx` | Replace text loader with Skeleton |
| `src/app/admin/products/[id]/edit/StockHistory.tsx` | Replace null loader with Skeleton |
| `src/app/admin/orders/[id]/ReturnsSection.tsx` | Replace null loader with Skeleton |
| `src/app/admin/layout.tsx` | Add PageTransition wrapper |
| `src/app/admin/products/page.tsx` | Add modal animations (price modal, stock modal) |
| `src/app/admin/categories/page.tsx` | Add modal entrance animation |
| `src/app/admin/orders/[id]/EditOrderModal.tsx` | Add modal entrance animation |
| `src/app/admin/orders/[id]/ReturnModal.tsx` | Add modal entrance animation |
| `src/app/admin/admins/page.tsx` | Add modal entrance animation (admin + role modals) |
| `src/app/admin/accounting/page.tsx` | Add modal entrance animation (expense modal) |

### Created files:

| File | Content |
|------|---------|
| `src/app/admin/loading.tsx` | Full-page skeleton |
| `src/app/admin/products/loading.tsx` | Skeleton table |
| `src/app/admin/orders/loading.tsx` | Skeleton table |
| `src/app/admin/customers/loading.tsx` | Skeleton table |
| `src/app/admin/reviews/loading.tsx` | Skeleton cards |
| `src/app/admin/newsletter/loading.tsx` | Skeleton table |
| `src/app/admin/discounts/loading.tsx` | Skeleton table |
| `src/app/admin/inventory/loading.tsx` | Skeleton grid |
| `src/app/admin/branches/loading.tsx` | Skeleton grid |
| `src/app/admin/shipping/loading.tsx` | Skeleton tabs |
| `src/app/admin/accounting/loading.tsx` | Skeleton chart + table |
| `src/app/admin/settings/loading.tsx` | Skeleton form |
| `src/app/admin/admins/loading.tsx` | Skeleton table |
| `src/app/admin/payments/loading.tsx` | Skeleton grid |
| `src/app/admin/stock-transfers/loading.tsx` | Skeleton tabs |
| `src/app/admin/security/loading.tsx` | Skeleton form |
| `src/app/admin/editor/loading.tsx` | Skeleton editor layout |
| `src/app/admin/products/error.tsx` | Error boundary |
| `src/app/admin/orders/error.tsx` | Error boundary |
| `src/app/admin/customers/error.tsx` | Error boundary |
| `src/app/admin/discounts/error.tsx` | Error boundary |
| `src/app/admin/inventory/error.tsx` | Error boundary |
| `src/app/admin/accounting/error.tsx` | Error boundary |
| `src/app/admin/branches/error.tsx` | Error boundary |
| `src/app/admin/settings/error.tsx` | Error boundary |
| `src/app/admin/admins/error.tsx` | Error boundary |
| `src/app/admin/payments/error.tsx` | Error boundary |
| `src/app/admin/shipping/error.tsx` | Error boundary |
| `src/app/admin/stock-transfers/error.tsx` | Error boundary |
| `src/app/admin/reviews/error.tsx` | Error boundary |
| `src/app/admin/newsletter/error.tsx` | Error boundary |
| `src/app/admin/not-found.tsx` | 404 page |

---

### Task 1: Replace plain-text loaders with Skeleton components

**Files:**
- Modify: `src/app/admin/products/page.tsx`
- Modify: `src/app/admin/orders/page.tsx`
- Modify: `src/app/admin/customers/page.tsx`
- Modify: `src/app/admin/reviews/page.tsx`
- Modify: `src/app/admin/newsletter/page.tsx`
- Modify: `src/app/admin/discounts/page.tsx`
- Modify: `src/app/admin/inventory/page.tsx`
- Modify: `src/app/admin/stock-transfers/page.tsx`
- Modify: `src/app/admin/payments/page.tsx`

- [ ] **Step 1: For each file, find the text loading pattern and replace with Skeleton**

Common pattern to search for:
```tsx
if (loading) return <p>Loading ...</p>
```

Replace with a skeleton layout matching the page's content structure. Example for a table page (products, orders, customers, discounts):

```tsx
if (loading) return (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)
```

For grid pages (inventory, payments):
```tsx
if (loading) return (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="p-4 border border-border rounded-lg space-y-3">
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
)
```

For review cards page:
```tsx
if (loading) return (
  <div className="space-y-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="p-4 border border-border rounded-lg space-y-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
    ))}
  </div>
)
```

For tab pages (stock-transfers):
```tsx
if (loading) return (
  <div className="space-y-4">
    <div className="flex gap-2">
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-lg" />
      ))}
    </div>
  </div>
)
```

**IMPORTANT:** Read each file before editing to find the exact loading pattern. Some pages may use `<div className="animate-pulse">` instead of `<p>Loading...`. In both cases, replace with the Skeleton approach above.

Each file must also import `Skeleton` from `@/components/ui/skeleton` if not already imported.

- [ ] **Step 2: Verify each file is syntactically valid**

---

### Task 2: Fix null-loading pages

**Files:**
- Modify: `src/app/admin/products/[id]/edit/StockHistory.tsx`
- Modify: `src/app/admin/orders/[id]/ReturnsSection.tsx`

- [ ] **Step 1: Replace `if (loading) return null` in StockHistory.tsx**

Read the file first. Replace the null return with:
```tsx
if (loading) return (
  <div className="space-y-2">
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-lg" />
    ))}
  </div>
)
```

Make sure `Skeleton` is imported.

- [ ] **Step 2: Replace `if (loading) return null` in ReturnsSection.tsx**

Same pattern — read the file, replace null with skeleton list.

---

### Task 3: Create loading.tsx files

**Files:**
- Create: 17 files listed in the File Structure table above

- [ ] **Step 1: Create `src/app/admin/loading.tsx`**

```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24 ml-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
```

- [ ] **Step 2: Create all other loading.tsx files**

Each follows the same pattern with page-specific layout:

**Table pages** (products, orders, customers, discounts, admins, newsletter):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64 ml-auto" />
      </div>
      <div className="border border-border rounded-lg overflow-hidden">
        <div className="bg-muted/50 p-4 flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex gap-4 border-t border-border">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Grid pages** (branches, inventory, payments):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border border-border rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Form pages** (settings, security):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>
  )
}
```

**Tab pages** (shipping, stock-transfers):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
```

**Chart pages** (accounting):
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  )
}
```

**Editor page:**
```tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] gap-2 p-2">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[calc(100vh-8rem)] w-full rounded-lg" />
      </div>
      <Skeleton className="w-72 h-[calc(100vh-4rem)] rounded-lg" />
    </div>
  )
}
```

Create all 17 files with appropriate content.

---

### Task 4: Create error.tsx files

**Files:**
- Create: 14 files listed in the File Structure table above

- [ ] **Step 1: Check existing patterns**

Check if there's an existing error component pattern in the admin. Read `src/app/admin/error.tsx` to see the current global error boundary.

- [ ] **Step 2: Create error.tsx files**

All 14 error files follow the same pattern:

```tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-navy mb-2">Something went wrong</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-navy text-silver rounded-full text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}
```

Create all 14 files.

---

### Task 5: Create not-found.tsx + add notFound() calls

**Files:**
- Create: `src/app/admin/not-found.tsx`
- Modify: `src/app/admin/orders/[id]/page.tsx`

- [ ] **Step 1: Create `src/app/admin/not-found.tsx`**

```tsx
import Link from 'next/link'

export default function AdminNotFound() {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6">
        <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-display font-semibold text-navy mb-2">404</h1>
      <p className="text-muted-foreground mb-6">This page doesn&apos;t exist.</p>
      <Link
        href="/admin"
        className="px-6 py-2.5 bg-navy text-silver rounded-full text-sm font-medium hover:bg-navy/90 transition-colors"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
```

- [ ] **Step 2: Add `notFound()` to order detail page**

Read `src/app/admin/orders/[id]/page.tsx`. Find where the order is fetched. After the fetch fails (order is null/undefined), add:
```tsx
import { notFound } from 'next/navigation'
```

And after verifying the order doesn't exist:
```tsx
if (!order) notFound()
```

---

### Task 6: Add page transitions to admin layout

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Read the current admin layout**

Find the main content rendering area (typically where `<main>` or `{children}` is rendered).

- [ ] **Step 2: Add PageTransition wrapper**

```tsx
import { PageTransition } from '@/components/ui/PageTransition'
import { usePathname } from 'next/navigation'

// Inside the layout component, wrap the content:
<AnimatePresence mode="wait">
  <PageTransition key={usePathname()}>
    {children}
  </PageTransition>
</AnimatePresence>
```

Note: If the admin layout is a server component, it needs to be converted to a client component (add `'use client'` at the top) since `usePathname` and `AnimatePresence` are client-only.

Check if `PageTransition` component already exists and what its API is. If it doesn't already include an `AnimatePresence` wrapper, you may need to add one in the layout:

```tsx
'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* existing layout structure with {children} */}
      </motion.div>
    </AnimatePresence>
  )
}
```

Actually, re-use the existing `PageTransition` component. First read it to understand its API:
```tsx
'use client'

import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
```

If this is the API, use it like:
```tsx
<AnimatePresence mode="wait">
  <PageTransition key={pathname}>
    {children}
  </PageTransition>
</AnimatePresence>
```

Replace the existing `{children}` rendering with the above.

---

### Task 7: Add modal entrance/exit animations

**Files:**
- Modify: `src/app/admin/products/page.tsx` (price modal, stock modal)
- Modify: `src/app/admin/categories/page.tsx` (category modal)
- Modify: `src/app/admin/orders/[id]/EditOrderModal.tsx`
- Modify: `src/app/admin/orders/[id]/ReturnModal.tsx`
- Modify: `src/app/admin/admins/page.tsx` (admin + role modals)
- Modify: `src/app/admin/accounting/page.tsx` (expense modal)

- [ ] **Step 1: Read each file to understand modal structure**

Each modal likely follows a pattern like:
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
    <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
      {/* modal content */}
    </div>
  </div>
)}
```

- [ ] **Step 2: Wrap each modal with framer-motion**

Each modal gets the same pattern:

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Replace:
{showModal && ( ... )}

// With:
<AnimatePresence>
  {showModal && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={closeModal}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {/* modal content - unchanged */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

For each file:
1. Check if framer-motion is already imported (if not, add the import)
2. Find the modal overlay div
3. Wrap in the AnimatePresence + motion.div pattern
4. Keep all internal modal content and logic unchanged

---

### Self-Review Checklist

1. **Spec coverage:**
   - Loading state consistency → Tasks 1, 2, 3 ✓
   - Error boundaries + not found → Tasks 4, 5 ✓
   - Page transitions → Task 6 ✓
   - Modal animations → Task 7 ✓

2. **Placeholder scan:** No TBD, TODO, or vague instructions found.

3. **Type consistency:** All components use `'use client'` where needed. All error.tsx files use the same signature. All loading.tsx files use the same `Skeleton` component. All modals use the same `AnimatePresence` + `motion.div` pattern.
