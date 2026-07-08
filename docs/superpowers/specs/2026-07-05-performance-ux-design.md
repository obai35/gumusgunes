# Performance UX — Design Spec

## Overview

Improve the user-perceived performance of the storefront through better loading indicators, page transitions, error handling, image placeholders, and optimistic updates. Split into two implementation phases.

## Phase 1 — Structural UX

High-visibility improvements that users see on every page visit.

### 1. Navigation Progress Bar

- **Component**: `src/components/ui/NavigationProgress.tsx`
- **Trigger**: Every route change — track `usePathname()` changes in a `useEffect`; show bar on pathname change, hide once suspense boundary resolves or after a timeout
- **Style**: 3px tall, `bg-gradient-to-r from-gold to-navy`, fixed top of viewport, `z-[100]`
- **Behavior**: Starts on navigation, fills to 80% quickly, completes on route finish, auto-hides after 200ms
- **Edge cases**: No flash on same-route navigations; hidden on initial page load (only route-to-route); cleanup on unmount
- **No external dependencies** — custom implementation using CSS transitions, not nprogress

### 2. Page Transitions

- **Component**: `src/components/ui/PageTransition.tsx`
- **Animation**: framer-motion `motion.div` with opacity fade (duration 0.2s)
- **Integration**: Wrap `<main>` children in root layout with `<AnimatePresence mode="wait"><PageTransition key={pathname}>{children}</PageTransition></AnimatePresence>`
- **Routes affected**: All store-facing pages (home, products, product detail, cart, checkout, account, login, register, forgot-password, reset-password)
- **Excluded**: Admin, POS — remain instant

### 3. Route-level loading.tsx

- **Pattern**: One `loading.tsx` per route segment importing `DiamondLoading`
- **Files to create**:
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
- **Each file**: ~5 lines, single export returning `<DiamondLoading />`

### 4. Route-level error.tsx + not-found.tsx

- **Component**: `src/components/store/ErrorFallback.tsx` — reusable warm branded error UI
  - Brand logo at top
  - "Something went wrong" heading
  - Brief description text
  - "Try Again" button (calls `reset()`)
  - "Go Home" link to `/`
- **Files to create**:
  - `src/app/error.tsx`
  - `src/app/products/error.tsx`
  - `src/app/products/[id]/error.tsx`
  - `src/app/cart/error.tsx`
  - `src/app/checkout/error.tsx`
  - `src/app/account/error.tsx`
- **Not-found**: `src/app/not-found.tsx` using same `ErrorFallback` with 404-specific messaging
- **Edge cases**: Error boundary catches render errors only (not async); `reset()` re-renders segment

## Phase 2 — Polish

Lower-visibility but impactful improvements.

### 5. Image Blur Placeholders

- **Build script**: `scripts/generate-blur.ts`
  - Scans `public/` for product images
  - Uses sharp to resize each to 10px wide
  - Outputs base64-encoded blurDataURL per image path
  - Saves mapping to `public/blur-map.json`
- **Utility**: `src/lib/blur.ts`
  - `getBlurDataUrl(imageUrl: string): string`
  - Reads from `blur-map.json`, falls back to a transparent placeholder
- **Components to update** (add `placeholder="blur"` + `blurDataURL`):
  - `ProductCard.tsx` — product thumbnails
  - `ProductModal.tsx` — product images
  - `CartContent.tsx` — cart item images
  - `OrderTrackingModal.tsx` — order item images
  - `BundleConfigurator.tsx` — bundle item images
- **Edge cases**: Image not in map → `<img loading="lazy">` fallback with no placeholder; external URL images (CDN) → skip blur

### 6. Optimistic Updates (Wishlist)

- **Hook**: Use React 19 `useOptimistic` in wishlist toggle components
- **Components affected**:
  - `ProductCard.tsx` — heart toggle
  - `ProductModal.tsx` — heart toggle  
  - `WishlistDrawer.tsx` — displays optimistic state
- **Pattern**:
  1. On click: call `addOptimistic(state => ({ ...state, isWishlisted: !state.isWishlisted }))`
  2. Send API request to `/api/wishlist` (POST or DELETE)
  3. On success: update the actual server state
  4. On error: revert optimistic state + toast "Failed to update wishlist"
- **Edge cases**: Double-click rapid fire — only last state matters; offline — toast error + revert

### 7. Admin Loading States

- **Files to update** (replace text "Loading..." with proper indicators):
  - `src/app/admin/branches/page.tsx`
  - `src/app/admin/settings/page.tsx`
  - `src/app/admin/reviews/page.tsx`
  - `src/app/admin/payments/*`
  - `src/app/admin/shipping/*`
- **Pattern**: Use existing `Skeleton` component or inline spinner matching admin theme
