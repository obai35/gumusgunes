# Polish & Animation — Design Spec

## Overview

Add structural animation polish to the storefront: header shrink on scroll, skeleton shimmer effect, cart item exit animation, floating form labels, and animated validation feedback.

## 1. Header Shrink on Scroll

**File**: `src/components/store/Header.tsx`

- The header already tracks `scrolled` state and applies background/shadow changes
- Add `scrolled ? 'h-16' : 'h-20'` to the header container class
- Shrink logo from `h-12 w-12` to `h-9 w-9` in scrolled state
- Reduce navigation text size from `text-sm` to `text-xs` in scrolled state
- The existing `transition-all duration-500` handles smooth animation between states
- No new state or logic needed — only class changes on existing `scrolled` variable

## 2. Skeleton Shimmer Effect

**File**: `src/components/ui/skeleton.tsx`
**File**: `src/app/globals.css` (register animation)

- Replace `animate-pulse` (simple opacity pulse) with a custom shimmer animation
- CSS shimmer: linear gradient sweep from transparent → white/10 → transparent, animated with keyframes
- Register in `@theme` block (Tailwind v4 syntax):
  ```css
  @theme {
    --animate-shimmer: shimmer 2.5s ease-in-out infinite;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  ```
- Skeleton gets `bg-[length:200%_100%]` + `animate-shimmer` + a shimmer gradient
- The skeleton component remains API-compatible — no prop changes
- All existing skeleton usage (admin pages, account sections) gets the effect automatically

## 3. Cart Item Exit Animation

**File**: `src/components/store/CartContent.tsx`

- Wrap cart items in `AnimatePresence`
- Each cart item row becomes a `motion.div` with:
  - `layout` — smooth layout shift when items are removed
  - `exit={{ opacity: 0, x: 80, height: 0 }}`
  - `transition={{ duration: 0.2 }}`
- Cart item key must be stable (use `item.product.id` or a unique key)
- Only cart items get this — not recommendations or other sections

## 4. Floating Labels

**Approach**: CSS-only using Tailwind `peer` + `placeholder-shown`

- Wrap each form field in a `<label className="relative">` with:
  - An `<input>` with `peer` + `placeholder=" "` (space — non-empty to trigger `placeholder-shown`)
  - A `<span>` that acts as the floating label, positioned over the input, animated with CSS transitions
- When input is focused or has content (`:not(:placeholder-shown)`), the label floats up above the input
- When input is empty and unfocused, the label sits inside the input as placeholder text

**Implementation pattern** (applied per input):
```tsx
<label className="relative block">
  <input
    className="peer h-11 w-full rounded-xl border border-border bg-white px-3 pt-3 text-sm outline-none transition-colors focus:border-gold"
    placeholder=" "
  />
  <span className="absolute left-3 top-3 text-sm text-muted-foreground transition-all duration-200 peer-focus:top-1.5 peer-focus:text-[11px] peer-focus:text-gold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[11px]">
    Label text
  </span>
</label>
```

**Files to update** (replace existing Input/label patterns):
- `src/app/account/ProfileSection.tsx` — name, email, phone
- `src/app/account/AddressesSection.tsx` — all address form fields
- `src/app/account/CardsSection.tsx` — card fields
- `src/app/login/page.tsx` — email, password
- `src/app/register/page.tsx` — registration fields
- `src/app/forgot-password/page.tsx` — email
- `src/app/reset-password/page.tsx` — email, password
- `src/components/store/CheckoutContent.tsx` — checkout fields
- Any other form inputs with Label + Input pattern

## 5. Animated Validation Feedback

**CSS**: Register in `@theme` + add `@keyframes` to `src/app/globals.css` (Tailwind v4 syntax):
```css
@theme {
  --animate-shake: shake 0.3s ease-in-out;
}
@keyframes shake {
  0%, 100% { transform: translateX(0) }
  20% { transform: translateX(-4px) }
  40% { transform: translateX(4px) }
  60% { transform: translateX(-4px) }
  80% { transform: translateX(4px) }
}
```

- Applied via a state-based `className` when validation fails
- Input gets `border-red-500` + `animate-shake` class on validation error
- Shake plays once (0.3s), border stays red until the user fixes the input
- Used in login, register, forgot-password, reset-password, account forms
- Combines with the floating label pattern — the label also turns red on error
- Error text below the input fades in with `transition-opacity duration-200`
