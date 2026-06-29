# POS Redesign — Phase 1: Foundation

Date: 2026-06-29

## Overview

Modernize the existing POS system at `/admin/pos` with a polished UI, bug fixes, reliability improvements, and keyboard-driven workflow. This is Phase 1 of a multi-phase roadmap; it focuses on the foundation without adding major new features (barcode, refunds, holds, customers, etc. are Phase 2+).

## Layout

- **Top bar**: Navy (#1a2744) brand bar with logo, shift status (open/closed badge), branch name, and current date/time.
- **Search & barcode row**: Full-width row with a product name/SKU search input (debounced 300ms) and a dedicated barcode/SKU quick-add input.
- **Product grid**: 3-column responsive grid showing product cards (image, name, SKU, price, stock count). Low stock items show red badge. Out-of-stock items are grayed out.
- **Cart sidebar (right)**: 380px sticky panel with collapsible sections:
  - **Items**: Scrollable list of cart items with +/− qty controls and remove button
  - **Discount**: Collapsed by default — expand to enter promo/employee code or view applied discount
  - **Payment**: Three method buttons (Cash, Card, Split) with linked amount inputs for split
  - **Totals**: Subtotal, discount (if any), total
  - **Checkout button**: Full-width navy button showing total and payment method

## Component Architecture

```
src/app/admin/pos/
├── page.tsx                    # Orchestrator — renders layout, manages high-level state
├── components/
│   ├── PosLayout.tsx           # Top bar + shell layout
│   ├── ProductGrid.tsx         # Search input + product card grid
│   ├── BarcodeInput.tsx        # SKU/barcode quick-add with auto-focus
│   ├── CartPanel.tsx           # Right sidebar container with collapsible sections
│   ├── CartItem.tsx            # Single cart item row (memoized)
│   ├── DiscountSection.tsx     # Discount code input or applied discount display
│   ├── PaymentSection.tsx      # Payment method selector + amount inputs
│   ├── TotalsDisplay.tsx       # Subtotal / discount / total
│   ├── ReceiptView.tsx         # Post-checkout receipt screen
│   └── CheckoutButton.tsx      # Checkout button with loading/total display
├── hooks/
│   ├── usePos.ts               # Core POS state (cart, discount, payment, receipt)
│   └── useKeyboardShortcuts.ts # F1-F6, Enter, Escape bindings
└── types.ts                    # Shared TypeScript types
```

## State Management

State stays in the `usePos` custom hook using `useState` + `useCallback`. This is intentionally simple — if Phase 2 features (refunds, holds, customers) add complexity, migrate to Zustand.

## Bug Fixes

1. **Stock validation**: Validate stock on every quantity change (not just initial add). Clamp max quantity to available stock.
2. **Shift enforcement**: Make `shiftId` required in checkout API. Show shift picker if no active shift. Block checkout without open shift.
3. **Payment validation**: Reject negative/zero amounts. Improve split payment validation (cash + card must equal total within 0.01 tolerance).
4. **Empty / loading / error states**: Loading skeleton for product grid. Error state with retry button. Empty state for no results. Proper disabled states during checkout.
5. **Number input safety**: Parse and clamp all numeric inputs. Handle NaN, negative, and non-numeric characters gracefully.
6. **Search debounce**: Switch from 200ms to 300ms with leading-edge behavior for barcode scanning.

## UX Features

1. **Keyboard shortcuts**: F1 (Cash), F2 (Card), F3 (Split), F4 (focus search), F6 (focus barcode), Enter (checkout), Escape (clear/close).
2. **Barcode/SKU quick-add**: Dedicated input at top. On Enter, instantly looks up product by SKU and adds 1 to cart. Shows success/not-found feedback.
3. **Quick quantity presets**: Clicking a product card shows +1/+2/+5 buttons instead of always incrementing by 1.
4. **Customer display panel**: Compact panel showing running total and item count (for secondary monitor).
5. **Number pad support**: Quick amount buttons ($5, $10, $20, $50, $100) for cash entry.

## Performance

- 300ms debounced search with leading edge for barcode
- In-memory product search result cache (per query)
- Lazy-loaded images in product grid
- Memoized cart item components to prevent full re-renders
- API limits results to 20 products per search

## API Improvements

No new endpoints. Existing endpoints will be hardened:

- `POST /api/admin/pos/checkout` — Make `shiftId` required, improve error messages
- `GET /api/admin/pos/products` — Add `limit=20` query param, return minimal fields
- `POST /api/admin/pos/validate-discount` — No changes needed

## Future Phases (Not In Scope)

- Barcode scanning with physical scanner hardware
- Customer management (create, lookup, attach to orders)
- Refunds and returns from POS
- Hold/recall orders
- Multi-currency support
- Offline mode with sync
