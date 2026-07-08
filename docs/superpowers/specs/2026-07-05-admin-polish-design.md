# Admin Panel Polish — Design Spec

## Overview

Polish the admin panel with consistent loading states, error boundaries, page transitions, and modal animations. Full sweep across all 20+ admin routes.

## 1. Loading State Consistency

### Replace plain-text loaders with Skeleton components

The following pages currently show plain text during loading — replace with `<Skeleton>` from `@/components/ui/skeleton`:

| File | Current | Replace with |
|------|---------|-------------|
| `src/app/admin/products/page.tsx` | `<p>Loading products...</p>` | Skeleton grid matching list layout (4-6 rows) |
| `src/app/admin/orders/page.tsx` | `<p>Loading orders...</p>` | Skeleton table rows (5 rows × 4 cells) |
| `src/app/admin/customers/page.tsx` | `<p>Loading customers...</p>` | Skeleton table rows |
| `src/app/admin/reviews/page.tsx` | `<p>Loading reviews...</p>` | Skeleton cards matching review layout |
| `src/app/admin/newsletter/page.tsx` | `<p>Loading subscribers...</p>` | Skeleton table rows |
| `src/app/admin/discounts/page.tsx` | Plain text or spinner | Skeleton table rows |
| `src/app/admin/inventory/page.tsx` | Plain text or spinner | Skeleton grid |
| `src/app/admin/stock-transfers/page.tsx` | Plain text or spinner | Skeleton tabs + content |
| `src/app/admin/payments/page.tsx` | Plain text or spinner | Skeleton grid |

### Fix null-loading pages

| File | Current | Fix |
|------|---------|-----|
| `src/app/admin/products/[id]/edit/StockHistory.tsx` | `if (loading) return null` | Show skeleton list (3-4 rows) |
| `src/app/admin/orders/[id]/ReturnsSection.tsx` | `if (loading) return null` | Show skeleton list |

### Add `loading.tsx` files

Create one per admin route segment — each renders a skeleton layout matching that page's structure. Files to create:

| Path | Content |
|------|---------|
| `src/app/admin/loading.tsx` | Full-page skeleton grid (dashboard-style) |
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

Note: Pages that already have skeleton loaders (Accounting, Branches, Settings, Admins) should still get a `loading.tsx` as a fallback — the existing client-side loading state acts as a refinement within the page.

## 2. Error Boundaries + Not Found

### Create `error.tsx` files

Each admin route segment gets an `error.tsx` that renders the `ErrorFallback` component with a "Try Again" button. The existing `src/app/admin/error.tsx` acts as the catch-all — route-specific ones provide finer granularity.

Create:
- `src/app/admin/products/error.tsx`
- `src/app/admin/orders/error.tsx`
- `src/app/admin/customers/error.tsx`
- `src/app/admin/discounts/error.tsx`
- `src/app/admin/inventory/error.tsx`
- `src/app/admin/accounting/error.tsx`
- `src/app/admin/branches/error.tsx`
- `src/app/admin/settings/error.tsx`
- `src/app/admin/admins/error.tsx`
- `src/app/admin/payments/error.tsx`
- `src/app/admin/shipping/error.tsx`
- `src/app/admin/stock-transfers/error.tsx`
- `src/app/admin/reviews/error.tsx`
- `src/app/admin/newsletter/error.tsx`

### Create `not-found.tsx`

`src/app/admin/not-found.tsx` — branded 404 with "Back to Dashboard" link. Reuse pattern from the storefront `not-found.tsx`.

### Add `notFound()` calls

Pages that fetch entities by ID should call `notFound()` when the entity isn't found:
- `src/app/admin/products/[id]/edit/page.tsx` — already does this ✅
- `src/app/admin/orders/[id]/page.tsx` — add `notFound()` for missing order
- Any other detail pages missing it

## 3. Page Transitions

### Component to reuse

The `PageTransition` component at `src/components/ui/PageTransition.tsx` wraps children in a `motion.div` with:
- `initial={{ opacity: 0 }}`
- `animate={{ opacity: 1 }}`
- `transition={{ duration: 0.2 }}`

### Implementation

- Wrap the admin layout's main content area (`<main>` in AdminShell or admin layout) in `<AnimatePresence mode="wait">` with a `key={pathname}` on the motion wrapper
- Use `usePathname()` from Next.js to derive the key
- This gives a 0.2s fade between all admin page navigations

### File to modify

- `src/app/admin/layout.tsx` (or the relevant shell layout) — add PageTransition wrapper

## 4. Modal Entrance/Exit Animations

### Target modals

The following modals need entrance/exit animations:

| Modal | File |
|-------|------|
| Product price modal | `src/app/admin/products/page.tsx` |
| Product stock modal | `src/app/admin/products/page.tsx` |
| Category create/edit modal | `src/app/admin/categories/page.tsx` |
| Edit order modal | `src/app/admin/orders/[id]/EditOrderModal.tsx` |
| Return modal | `src/app/admin/orders/[id]/ReturnModal.tsx` |
| Admin create/edit modal | `src/app/admin/admins/page.tsx` |
| Role create/edit modal | `src/app/admin/admins/page.tsx` |
| Expense modal | `src/app/admin/accounting/page.tsx` |

### Pattern

Wrap the modal overlay/backdrop in `motion.div`:
```tsx
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-xl"
      >
        {/* modal content */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

This is additive — each modal gets the framer-motion wrapper without changing its internal logic.
