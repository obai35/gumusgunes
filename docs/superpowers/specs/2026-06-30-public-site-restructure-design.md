# Public Site Restructure: SPA to Multi-Page

## Goal

Convert the current single-page-application (SPA) public site — where product listing, detail, cart, and checkout are all modal/drawer overlays on `/` — into proper Next.js routes with dedicated pages.

## Motivation

- **SEO**: Product detail pages get individual URLs, meta tags, and Open Graph images
- **UX**: Browser back/forward buttons work naturally; users can bookmark and share product links
- **Perceived performance**: Pages load independently without mounting/unmounting heavy overlays
- **Cleaner homepage**: Homepage becomes a focused landing page without overlay complexity

## Architecture

### Route Map

```
/                       → Homepage (cleaned up landing page)
/products               → Product listing with filters (sidebar + grid)
/products/[id]          → Product detail (full page replacing ProductModal)
/cart                   → Cart page (full page replacing CartDrawer)
/checkout               → Checkout page (replacing CheckoutDialog)
/checkout/success       → Order confirmation (new)
```

### Current State (Before)

```
/ (homepage page.tsx)
├── Header
├── Hero
├── FlashSaleBanner
├── TrustBadges
├── CategoryGrid
├── FeaturedProducts (featured)
├── PromoBanner
├── BundleConfigurator
├── FeaturedProducts (new arrivals)
├── ProductGrid (full listing)
├── FeaturedProducts (bestsellers)
├── RecentlyViewed
├── GiftFinder
├── AboutSection
├── CraftsmanshipTimeline
├── Testimonials
├── RewardsSection
├── Newsletter
├── Footer
├── ProductModal (overlay)
├── CartDrawer (overlay)
├── CheckoutDialog (overlay)
├── SearchDialog (overlay)
├── WishlistDrawer (overlay)
├── CompareModal / CompareTray (overlays)
└── ExitIntentPopup (overlay)
```

### Proposed State (After)

```
/ (homepage — lighter, no overlays)
├── Header
├── Hero (upgraded — cinematic)
├── CategoryGrid (preview cards linking to /products?category=xxx)
├── FeaturedProducts (preview cards linking to /products/[id])
├── AboutSection
├── Testimonials
├── Newsletter
├── Footer
├── SearchDialog (only overlay kept — utility)
├── WishlistDrawer (only overlay kept — utility)
└── ExitIntentPopup (only overlay kept — conversion)

/products
├── Header, Footer
├── Breadcrumb
├── Category sidebar (filter chips, sort, price range)
├── Product grid (4 columns)
├── Pagination (load more)
├── URL query params: ?category=&sort=&maxPrice=&page=

/products/[id]
├── Header, Footer
├── Breadcrumb
├── Two-column layout (image + details)
├── Image gallery with zoom
├── Specs, reviews, related products
├── Sticky mobile add-to-cart bar

/cart
├── Header, Footer
├── Breadcrumb
├── Item list with quantity controls
├── Free shipping progress bar
├── "Complete the look" recommendations
├── Order summary (subtotal, shipping, tax, total)
├── Checkout button → /checkout

/checkout
├── Header (minimal — no nav), Footer (minimal)
├── Two-column: form left, order summary right
├── Multi-step: Details → Payment → Processing → Done
├── Success redirects to /checkout/success?orderId=xxx
```

## Key Design Decisions

### Keep Zustand Stores
Cart, wishlist, recently viewed, compare, search — the Zustand stores remain unchanged. Only the UI component that renders them changes from overlay to page.

### Keep ProductCard Component
`ProductCard` stays but its click handler changes from `openModal(product)` to `router.push(/products/${product.id})`. Same for the wishlist/compare buttons.

### Keep Existing API Routes
`/api/products`, `/api/products/[id]`, `/api/categories`, `/api/orders` — all unchanged. The new pages fetch the same data.

### New Page Components (Minimal Wrappers)
Each new page is a thin wrapper that:
1. Fetches data (server component where possible, client component where interactivity required)
2. Renders the existing component tree inside a page layout
3. Passes the same props the SPA version received

## Component Changes Summary

| Component | Change |
|-----------|--------|
| `ProductGrid.tsx` | Extract into `/products/page.tsx` |
| `ProductModal.tsx` | Rewrite as `/products/[id]/page.tsx` — full page layout |
| `CartDrawer.tsx` | Rewrite as `/cart/page.tsx` — full page layout |
| `CheckoutDialog.tsx` | Rewrite as `/checkout/page.tsx` — two-column layout |
| `Header.tsx` | Update cart link from drawer trigger to `/cart` |
| `ProductCard.tsx` | Update click from `openModal()` to `router.push()` |
| `CategoryGrid.tsx` | Update links to `/products?category=xxx` |
| `FeaturedProducts.tsx` | Update links to `/products/[id]` |
| `page.tsx` (home) | Remove overlay states, modal/drawer imports |

## Visual Refresh

The restructure is paired with a visual refresh targeting these aspects:

### Hero (Cinematic Upgrade)
- Full-viewport height (100vh) with parallax background
- Gold gradient overlay on hero image
- Bold typography: large display text with subtle entrance animation
- Secondary CTA button for "Explore Collection" → `/products`

### Cleaner UI
- Remove BundleConfigurator, GiftFinder, CraftsmanshipTimeline, RewardsSection from immediate render (keep them but lazy-load further down or remove)
- Merge the 3 FeaturedProducts sections into one with tab switcher (Featured / New / Bestseller)
- Consistent card borders, shadows, and hover states

### Premium Polish
- Image reveal animation on scroll (Intersection Observer)
- Smooth page transitions between routes (Framer Motion AnimatePresence)
- Refined loading skeleton shapes matching card dimensions
- Micro-interactions: button press, card hover lift, subtle gold shimmer

## Error & Edge Cases

- **Product not found**: `/products/[id]` returns 404 with "Product not found" message and link to `/products`
- **Empty cart**: `/cart` shows large empty-state illustration with "Start Shopping" CTA
- **Empty category**: `/products?category=xxx` shows "No products found" with reset link
- **Checkout without cart items**: Redirect to `/cart` with toast message
- **Back from checkout**: Preserves form state via Zustand (checkout data already persisted)
- **Direct URL access**: All routes work when navigated to directly (no SPA state dependency)

## Responsive

- Product grid: 2 cols mobile, 3 cols tablet, 4 cols desktop
- Product detail: stacks vertically on mobile (image top, details bottom), sticky mobile buy bar
- Checkout: stacks vertically on mobile (summary below form)
- Category filter: slides in as drawer on mobile, persistent sidebar on desktop

## Out of Scope

- Admin panel changes (stays in existing sidebar layout)
- POS terminal (stays standalone at /pos)
- Performance optimizations beyond what naturally comes from page-level code splitting
- Dark mode enhancements (existing dark mode works)
