# Gender-Based Cart & Checkout Loading Screens

## Overview

Add a gender field to the User model, collect it during registration and allow editing in account settings. Use gender to show personalized animated SVG loading screens when navigating to the cart (`/cart`) and checkout (`/checkout`) pages.

## Motivation

The storefront has decorative visual effects (ambient mist, glow cursor, sparkle trail, glow reveal) that were recently added. To enhance the shopping experience further, animated loading screens on cart/checkout navigation make the brand feel more polished and premium.

## Gender Field

### Prisma Schema

```prisma
enum Gender {
  MALE
  FEMALE
}

model User {
  // ... existing fields
  gender Gender?
}
```

### Registration Page (`src/app/register/page.tsx`)

- Add a gender toggle row after the password field, before the submit button
- Two options: "👨 Man" / "👩 Woman" rendered as styled radio cards
- The selected option is highlighted with the gold accent color
- Field is optional (no validation error if unselected)

### API: POST /api/customer/auth/register

- Update `RegisterSchema` to accept `gender: z.enum(['MALE', 'FEMALE']).optional()`
- Include `gender` in `db.user.create()` data

### API: GET /api/user/profile

- Include `gender` in the response

### API: PUT /api/user/profile

- Accept `gender: z.enum(['MALE', 'FEMALE']).optional()` in `ProfileSchema`

### Account ProfileSection (`src/app/account/ProfileSection.tsx`)

- Add a gender field below phone
- Toggle between MALE/FEMALE with styled radio buttons
- Saved via existing saveProfile flow

## Loading Screen Animation

### Component: `CartLoadingScreen` (`src/components/store/CartLoadingScreen.tsx`)

A full-screen overlay (z-50) rendered via a client component that:

**Layout:**
- Fixed inset-0 overlay with navy/cream background
- Centered animated scene: SVG figure (left) + shopping cart (right)
- Text below: "Adding to your bag..." (cart) / "Processing your order..." (checkout)

**Animation (framer-motion):**
- **Scene:** A simple human figure (gender-styled SVG), a sparkly jewelry item, a shopping cart
- **Sequence:**
  1. Figure walks into frame from left (0s–0.5s)
  2. Figure reaches arm toward a floating golden diamond/sparkle (0.5s–1.0s)
  3. Figure picks up the item and moves arm toward the cart (1.0s–2.0s)
  4. Item drops into cart with a gentle bounce (2.0s–2.5s)
  5. A brief pause, then the page navigates (2.5s–3.0s)

**Gender handling:**
- Read `user.gender` from `useAuth()` store
- If `MALE`: show a male figure (shorter hair, broader shoulders in SVG)
- If `FEMALE`: show a female figure (longer hair, dress silhouette in SVG)
- If guest or no gender: show male figure (1.2s), then female figure (1.2s), total ~2.5s

**SVG figures:**
- Simple geometric style matching the brand aesthetic
- Male: angular jaw, short hair, pants
- Female: softer lines, long hair, dress
- Both use the brand gold (#C9A96E) accent colors

### Component: `CheckoutLoadingScreen` (`src/components/store/CheckoutLoadingScreen.tsx`)

- Same animation base as cart but different theme:
  - Figure presents item at a checkout counter instead of cart
  - Text: "Processing your order..."
  - Gender handling identical to cart version

### Shared Animation Primitive

To avoid duplication, create a shared sub-component or utility for the figure animation. The cart/checkout screens differ only in:
- Background scene elements (cart vs checkout counter)
- Text displayed
- Duration

## Navigation Integration

### Approach

Create a lightweight **loading context** or **hook** (`usePageNavigation`) that:
1. Intercepts navigation to `/cart` and `/checkout`
2. Shows the appropriate loading overlay
3. After animation completes, performs the actual `router.push()`

### Files to modify

- `src/components/store/Header.tsx`: cart button currently calls `router.push('/cart')`. Replace with loading-triggered navigation.
- `src/components/store/CartContent.tsx`: checkout button calls `router.push('/checkout')`. Same treatment.
- `src/components/store/CartDrawer.tsx`: checkout button inside drawer (if it exists). Same treatment.

### Implementation detail

```tsx
// usePageNavigation hook
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function usePageNavigation() {
  const router = useRouter()
  const [loading, setLoading] = useState<'cart' | 'checkout' | null>(null)

  const navigateToCart = () => {
    setLoading('cart')
    setTimeout(() => {
      router.push('/cart')
      setLoading(null)
    }, 2500)
  }

  const navigateToCheckout = () => {
    setLoading('checkout')
    setTimeout(() => {
      router.push('/checkout')
      setLoading(null)
    }, 2500)
  }

  return { loading, navigateToCart, navigateToCheckout }
}
```

The overlay renders in the root layout or as a sibling to the page content.

## Disable Effects from Admin/POS

- Already done: `StorefrontEffects` guards against `/admin` and `/pos` paths using `window.location.pathname`
- `NavigationProgress` (gold progress bar) remains on all pages — it's useful UX and not a decorative effect
- No further changes needed

## Animation Assets

All illustrations are inline SVG components (no external image assets). The figures are geometric/minimalist:

- **Male figure:** ~15-20 SVG elements (head, torso, arms, legs, pants, short hair)
- **Female figure:** ~15-20 SVG elements (head, torso, arms, legs, dress, long hair)
- **Cart:** ~8-10 SVG elements (body, wheels, handle)
- **Item:** 1 golden diamond/sparkle shape
- **Checkout counter:** ~10 SVG elements

## Files Changed

1. `prisma/schema.prisma` — add Gender enum + gender field to User
2. `src/app/api/customer/auth/register/route.ts` — accept gender
3. `src/app/api/user/profile/route.ts` — return+accept gender
4. `src/app/register/page.tsx` — add gender picker
5. `src/app/account/ProfileSection.tsx` — add gender edit
6. `src/lib/auth-store.ts` — update User type to include gender
7. `src/components/store/CartLoadingScreen.tsx` — new
8. `src/components/store/CheckoutLoadingScreen.tsx` — new
9. `src/hooks/usePageNavigation.ts` — new
10. `src/components/store/Header.tsx` — use navigation hook for cart button
11. `src/components/store/CartContent.tsx` — use navigation hook for checkout button
12. `src/app/layout.tsx` — render loading overlay from context

## Open Questions

1. Exact animation duration — finalize during implementation (2.5s target)
2. Whether to render the overlay in root layout or inside each page — root layout is simpler

## Spec Self-Review

- No placeholders or TODOs remain
- Sections are consistent: gender flows from schema → API → forms → loading screen
- Scope is focused: exactly one feature (gender + loading screens) with no scope creep
- No ambiguity: gender is MALE/FEMALE enum, loading screens follow same animation base
