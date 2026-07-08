# Performance UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve perceived performance through navigation progress bar, page transitions, loading/error route files, image blur placeholders, optimistic wishlist updates, and admin loading states.

**Architecture:** Phase 1 adds structural UX (progress bar, transitions, loading/error pages) — all independent new files plus a layout.tsx change. Phase 2 adds polish (blur images, optimistic updates, admin skeletons). Each phase produces independently testable software.

**Tech Stack:** Next.js 16, framer-motion, sharp, React 19 `useOptimistic`, shadcn Skeleton, existing DiamondLoading component.

---

### Task 1: Navigation Progress Bar

**Files:**
- Create: `src/components/ui/NavigationProgress.tsx`

- [ ] **Step 1: Create NavigationProgress component**

```tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/format'

export function NavigationProgress() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setLoading(true)
    setProgress(20)
    const fast = setTimeout(() => setProgress(70), 100)
    const slow = setTimeout(() => setProgress(85), 400)

    // Simulate navigation completion after route settles
    const done = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
    }, 600)

    return () => { clearTimeout(fast); clearTimeout(slow); clearTimeout(done) }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-muted">
      <div
        className="h-full bg-gradient-to-r from-gold to-navy transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verify component compiles**

Run: `npm run build 2>&1 | Select-String -Pattern "error" -NotMatch | Select-Object -First 5`
Expected: Build succeeds (ignore Logtail warnings)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/NavigationProgress.tsx
git commit -m "feat: add navigation progress bar"
```

### Task 2: Page Transition Component

**Files:**
- Create: `src/components/ui/PageTransition.tsx`

- [ ] **Step 1: Create PageTransition component**

```tsx
'use client'

import { motion } from 'framer-motion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/PageTransition.tsx
git commit -m "feat: add page transition fade component"
```

### Task 3: Integrate NavigationProgress + PageTransition into Root Layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read current layout imports and structure**

Read the first 30 lines and the `<body>` section of `src/app/layout.tsx` to understand current structure.

- [ ] **Step 2: Add NavigationProgress and AnimatePresence + PageTransition**

Add import for `NavigationProgress`, `PageTransition`, `AnimatePresence`, `usePathname`.

Import snippet:
```tsx
import { NavigationProgress } from '@/components/ui/NavigationProgress'
import { PageTransition } from '@/components/ui/PageTransition'
import { AnimatePresence } from 'framer-motion'
```

Add `<NavigationProgress />` inside the body, before the main content.

Wrap the main content area with:
```tsx
<AnimatePresence mode="wait">
  <PageTransition key={pathname}>
    {children}
  </PageTransition>
</AnimatePresence>
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: integrate navigation progress bar and page transitions"
```

### Task 4: Route-level loading.tsx Files

**Files:**
- Create (10 files):
  - `src/app/loading.tsx`
  - `src/app/products/loading.tsx`
  - `src/app/products/[id]/loading.tsx`
  - `src/app/cart/loading.tsx`
  - `src/app/checkout/loading.tsx`
  - `src/app/account/loading.tsx`
  - `src/app/login/loading.tsx`
  - `src/app/register/loading.tsx`
  - `src/app/forgot-password/loading.tsx`
  - `src/app/reset-password/loading.tsx`

- [ ] **Step 1: Create all loading.tsx files**

Each file has the same content:
```tsx
import { DiamondLoading } from '@/components/store/DiamondLoading'

export default function Loading() {
  return <DiamondLoading />
}
```

Create all 10 files in parallel.

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 3: Commit**

```bash
git add src/app/loading.tsx src/app/products/loading.tsx src/app/products/\[id\]/loading.tsx src/app/cart/loading.tsx src/app/checkout/loading.tsx src/app/account/loading.tsx src/app/login/loading.tsx src/app/register/loading.tsx src/app/forgot-password/loading.tsx src/app/reset-password/loading.tsx
git commit -m "feat: add route-level loading states with DiamondLoading"
```

### Task 5: ErrorFallback Component + error.tsx + not-found.tsx

**Files:**
- Create: `src/components/store/ErrorFallback.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/products/error.tsx`
- Create: `src/app/products/[id]/error.tsx`
- Create: `src/app/cart/error.tsx`
- Create: `src/app/checkout/error.tsx`
- Create: `src/app/account/error.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Create ErrorFallback component**

```tsx
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
  error?: Error & { digest?: string }
  reset?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({ reset, title = 'Something went wrong', message = 'An unexpected error occurred. Please try again.' }: Props) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-gold/30 mx-auto mb-6">
          <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex items-center justify-center gap-3">
          {reset && (
            <Button onClick={reset} className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">
              Try Again
            </Button>
          )}
          <Link href="/" className="text-sm text-gold hover:underline font-medium">Go Home</Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create error.tsx files**

Each file (except `/products/[id]`):
```tsx
'use client'

import { ErrorFallback } from '@/components/store/ErrorFallback'

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorFallback error={error} reset={reset} />
}
```

For `/products/[id]/error.tsx` — same pattern, just a different path.

Create all 6 `error.tsx` files in parallel.

- [ ] **Step 3: Create not-found.tsx**

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="h-16 w-16 rounded-full overflow-hidden ring-2 ring-gold/30 mx-auto mb-6">
          <img src="/gumusgunes-logo.jpeg" alt="Gümüş Güneş" className="h-full w-full object-cover" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-navy mb-2">Page Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/">
          <Button className="rounded-full bg-navy text-silver hover:bg-gold hover:text-navy-deep press">Go Home</Button>
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 5: Commit**

```bash
git add src/components/store/ErrorFallback.tsx src/app/error.tsx src/app/products/error.tsx src/app/products/\[id\]/error.tsx src/app/cart/error.tsx src/app/checkout/error.tsx src/app/account/error.tsx src/app/not-found.tsx
git commit -m "feat: add error pages and not-found page"
```

### Task 6: Image Blur Placeholder Build Script

**Files:**
- Create: `scripts/generate-blur.ts`
- Create: `src/lib/blur.ts`
- Modify: `src/components/store/ProductCard.tsx`
- Modify: `src/components/store/ProductModal.tsx`
- Modify: `src/components/store/CartContent.tsx`
- Modify: `src/components/store/OrderTrackingModal.tsx`
- Modify: `src/components/store/BundleConfigurator.tsx`

- [ ] **Step 1: Read current Image usage in 5 target components**

Read `ProductCard.tsx`, `ProductModal.tsx`, `CartContent.tsx`, `OrderTrackingModal.tsx`, `BundleConfigurator.tsx` to understand current image patterns.

- [ ] **Step 2: Create the blur generation script**

```ts
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'

const PUBLIC_DIR = path.join(process.cwd(), 'public')
const OUTPUT = path.join(process.cwd(), 'src', 'lib', 'blur-map.json')

async function generate() {
  const map: Record<string, string> = {}
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp']

  async function scan(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await scan(full)
      else if (imageExts.includes(path.extname(entry.name).toLowerCase())) {
        try {
          const buf = await sharp(full).resize(10).jpeg({ quality: 30 }).toBuffer()
          map['/' + path.relative(PUBLIC_DIR, full).replace(/\\/g, '/')] = `data:image/jpeg;base64,${buf.toString('base64')}`
        } catch { /* skip unreadable */ }
      }
    }
  }

  await scan(PUBLIC_DIR)
  await fs.writeFile(OUTPUT, JSON.stringify(map))
  console.log(`Generated blur placeholders for ${Object.keys(map).length} images`)
}

generate().catch(console.error)
```

- [ ] **Step 3: Create the blur utility**

```ts
import blurMap from '@/lib/blur-map.json'

export function getBlurDataUrl(imageUrl: string): string | undefined {
  if (!imageUrl || imageUrl.startsWith('http')) return undefined
  return (blurMap as Record<string, string>)[imageUrl]
}
```

- [ ] **Step 4: Run the generation script once**

Run: `npx tsx scripts/generate-blur.ts`
Expected: Creates `src/lib/blur-map.json` with placeholder data

- [ ] **Step 5: Add blur to ProductCard.tsx**

Add import `import { getBlurDataUrl } from '@/lib/blur'`. Find the `<Image>` component and add `placeholder="blur"` and `blurDataURL={getBlurDataUrl(image.src)}`.

- [ ] **Step 6: Apply same pattern to ProductModal, CartContent, OrderTrackingModal, BundleConfigurator**

Same change: import `getBlurDataUrl`, add `placeholder="blur"` + `blurDataURL` to each Image component.

- [ ] **Step 7: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 8: Commit**

```bash
git add scripts/generate-blur.ts src/lib/blur.ts src/lib/blur-map.json src/components/store/ProductCard.tsx src/components/store/ProductModal.tsx src/components/store/CartContent.tsx src/components/store/OrderTrackingModal.tsx src/components/store/BundleConfigurator.tsx
git commit -m "feat: add blur image placeholders to product images"
```

### Task 7: Update Image Components with Blur Placeholders

**Files:**
- Modify: `src/components/store/ProductCard.tsx`
- Modify: `src/components/store/ProductModal.tsx`
- Modify: `src/components/store/BundleConfigurator.tsx`

- [ ] **Step 1: Update ProductCard.tsx**

Read the current image usage in ProductCard.tsx. Add `placeholder="blur"` and `blurDataURL={getBlurDataUrl(imageUrl)}` to existing `Image` components. Import `getBlurDataUrl` from `@/lib/blur`.

- [ ] **Step 2: Update ProductModal.tsx**

Same pattern — read current image usage, add blur placeholder.

- [ ] **Step 3: Update BundleConfigurator.tsx**

Same pattern — read current image usage, add blur placeholder.

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 5: Commit**

```bash
git add src/components/store/ProductCard.tsx src/components/store/ProductModal.tsx src/components/store/BundleConfigurator.tsx
git commit -m "feat: add blur image placeholders to product images"
```

### Task 8: Optimistic Wishlist Updates

**Files:**
- Modify: `src/components/store/ProductCard.tsx`
- Modify: `src/components/store/ProductModal.tsx`
- Modify: `src/components/store/WishlistDrawer.tsx`

- [ ] **Step 1: Read current wishlist logic in ProductCard.tsx**

Read the heart button / wishlist toggle section. Understand the current API call pattern and how `isWishlisted` is derived from zustand store.

- [ ] **Step 2: Add useOptimistic to ProductCard wishlist toggle**

Wrap the wishlisted state with `useOptimistic`. Pattern:

```tsx
import { useOptimistic, startTransition } from 'react'

// Inside component — wrap zustand state:
const [optWishlisted, addOptimistic] = useOptimistic(
  isWishlisted,
  (_, next) => next
)

// On click:
async function toggleWishlist(e: React.MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  const next = !isWishlisted

  startTransition(() => addOptimistic(next))

  const res = await fetch('/api/wishlist', {
    method: next ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  })

  if (res.ok) {
    // Update zustand to match server state
    useWishlist.getState().toggleProduct(productId)
  } else {
    toast.error('Failed to update wishlist')
    // Optimistic auto-reverts on next render since zustand unchanged
  }
}

// Use optWishlisted for heart icon fill/outline
```

- [ ] **Step 3: Apply same pattern to ProductModal.tsx**

Read current wishlist toggle in ProductModal, apply same `useOptimistic` + `startTransition` pattern.

- [ ] **Step 4: Apply optimistic state display to WishlistDrawer.tsx**

Read the WishlistDrawer to ensure it reflects the optimistic state. Since WishlistDrawer reads from the zustand store which is updated after API success, the optimistic toggle in ProductCard/ProductModal is sufficient — the drawer will show the correct state once the zustand store updates.

- [ ] **Step 5: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 6: Commit**

```bash
git add src/components/store/ProductCard.tsx src/components/store/ProductModal.tsx src/components/store/WishlistDrawer.tsx
git commit -m "feat: add optimistic wishlist updates"
```

### Task 9: Admin Loading States

**Files:**
- Modify: `src/app/admin/branches/page.tsx`
- Modify: `src/app/admin/settings/page.tsx`
- Modify: `src/app/admin/reviews/page.tsx`
- Modify: Admin payment pages under `src/app/admin/payments/`
- Modify: Admin shipping pages under `src/app/admin/shipping/`

- [ ] **Step 1: Read each file to find "Loading..." text patterns**

For each admin file, find the text-based loading state.

- [ ] **Step 2: Replace text "Loading..." with Skeleton component**

Replace:
```tsx
<p>Loading...</p>
```
with:
```tsx
<div className="space-y-3 p-4"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-64" /><Skeleton className="h-4 w-40" /></div>
```

Import `Skeleton` from `@/components/ui/skeleton` if not already imported.

Apply to all admin files found.

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1`
Expected: Compiles successfully

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/branches/page.tsx src/app/admin/settings/page.tsx src/app/admin/reviews/page.tsx src/app/admin/payments/ src/app/admin/shipping/
git commit -m "feat: replace text loading states with skeletons in admin"
```
