# Gender-Based Cart & Checkout Loading Screens — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gender field to user accounts, collect it during registration, and show personalized animated SVG loading screens when navigating to cart or checkout.

**Architecture:** Gender flows from Prisma schema → API → registration form + profile settings → client auth store. Loading screens are client components rendered via a context provider in the root layout, triggered by a navigation hook that replaces direct `router.push()` calls.

**Tech Stack:** Next.js App Router, Prisma + PostgreSQL, framer-motion, Zustand, Zod

---

### Task 1: Prisma Schema — Add Gender enum + field

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Add Gender enum before User model**

```prisma
enum Gender {
  MALE
  FEMALE
}
```

- [ ] **Add gender field to User model**

```prisma
model User {
  // ... existing fields (keep everything)
  gender   Gender?
}
```

Insert after the `googleId` line (or before `totpSecret`).

---

### Task 2: Run Prisma migration

- [ ] **Generate migration**

```bash
npx prisma migrate dev --name add-gender-field
```

- [ ] **Verify migration applied**

```bash
npx prisma db push
```

---

### Task 3: Update register API to accept gender

**Files:**
- Modify: `src/app/api/customer/auth/register/route.ts`

- [ ] **Update RegisterSchema + create call**

Add to the schema at line 15 (after `phone`):
```ts
  gender: z.enum(['MALE', 'FEMALE']).optional(),
```

Update the `db.user.create` call to include gender:
```ts
    const user = await db.user.create({
      data: { email, name, password: await hashPassword(password), gender: parsed.data.gender },
    })
```

Update the response to include gender:
```ts
    const response = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
```

---

### Task 4: Update login API to return gender

**Files:**
- Modify: `src/app/api/customer/auth/login/route.ts`

- [ ] **Include gender in login response**

Line 46: change response to include gender:
```ts
      user: { id: user.id, email: user.email, name: user.name, gender: user.gender }
```

---

### Task 5: Update auth me API to return gender

**Files:**
- Modify: `src/app/api/customer/auth/me/route.ts`

- [ ] **Include gender in me response**

Line 24: change to:
```ts
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, gender: user.gender } })
```

---

### Task 6: Update profile API for gender

**Files:**
- Modify: `src/app/api/user/profile/route.ts`

- [ ] **Add gender to ProfileSchema**

After line 9 (`dateOfBirth`):
```ts
  gender: z.enum(['MALE', 'FEMALE']).optional(),
```

- [ ] **Include gender in GET response**

Line 17: add `gender` to select:
```ts
    select: { id: true, email: true, name: true, phone: true, gender: true, password: true, googleId: true },
```

Line 25: add to response:
```ts
    gender: profile.gender,
```

- [ ] **Include gender in PUT handler**

Line 40: destructure gender:
```ts
  const { name, phone, gender } = parsed.data
```

Line 42: add gender to update data:
```ts
    data: { name, phone, gender },
```

Line 44: add gender to select:
```ts
    select: { id: true, email: true, name: true, phone: true, gender: true },
```

---

### Task 7: Update auth store User type

**Files:**
- Modify: `src/lib/auth-store.ts`

- [ ] **Add gender to User type**

Line 5: change to:
```ts
type User = { id: string; email: string; name: string; gender?: string }
```

---

### Task 8: Add gender picker to registration page

**Files:**
- Modify: `src/app/register/page.tsx`

- [ ] **Add gender state + toggle UI**

After password error state (line 16), add:
```ts
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
```

After the password input block (after line 125), add:
```tsx
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Gender (optional)</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setGender('MALE')}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  gender === 'MALE'
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'border-border text-muted-foreground hover:border-gold/50'
                }`}
              >
                <span className="mr-1.5">👨</span> Man
              </button>
              <button
                type="button"
                onClick={() => setGender('FEMALE')}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  gender === 'FEMALE'
                    ? 'border-gold bg-gold/10 text-navy'
                    : 'border-border text-muted-foreground hover:border-gold/50'
                }`}
              >
                <span className="mr-1.5">👩</span> Woman
              </button>
            </div>
          </div>
```

- [ ] **Include gender in API call**

Line 31: change:
```ts
      body: JSON.stringify({ name: name.trim(), email, password, gender: gender || undefined }),
```

---

### Task 9: Add gender to profile section

**Files:**
- Modify: `src/app/account/ProfileSection.tsx`

- [ ] **Add gender state and field**

After phone state in `setProfile` (line 14), add:
```ts
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('')
```

In `fetchProfile` (line 40), add:
```ts
        setGender(data.gender || '')
```

- [ ] **Add gender toggle UI**

After the phone field block (before the Save Changes button around line 184), add:
```tsx
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Gender</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setGender('MALE')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                gender === 'MALE'
                  ? 'border-gold bg-gold/10 text-navy'
                  : 'border-border text-muted-foreground hover:border-gold/50'
              }`}
            >
              <span className="mr-1.5">👨</span> Man
            </button>
            <button
              type="button"
              onClick={() => setGender('FEMALE')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                gender === 'FEMALE'
                  ? 'border-gold bg-gold/10 text-navy'
                  : 'border-border text-muted-foreground hover:border-gold/50'
              }`}
            >
              <span className="mr-1.5">👩</span> Woman
            </button>
          </div>
        </div>
```

- [ ] **Include gender in saveProfile API call**

Line 53: change:
```ts
      body: JSON.stringify({ name: profile.name, phone: profile.phone, gender: gender || undefined }),
```

---

### Task 10: Create navigation loading context

**Files:**
- Create: `src/components/store/NavigationLoadingProvider.tsx`

- [ ] **Create the provider component**

```tsx
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CartLoadingScreen } from './CartLoadingScreen'
import { CheckoutLoadingScreen } from './CheckoutLoadingScreen'

type LoadingType = 'cart' | 'checkout' | null

type NavContext = {
  loading: LoadingType
  navigateToCart: () => void
  navigateToCheckout: () => void
}

const NavCtx = createContext<NavContext>({
  loading: null,
  navigateToCart: () => {},
  navigateToCheckout: () => {},
})

export function usePageNavigation() {
  return useContext(NavCtx)
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState<LoadingType>(null)

  const navigateToCart = useCallback(() => {
    setLoading('cart')
    setTimeout(() => {
      router.push('/cart')
      setTimeout(() => setLoading(null), 100)
    }, 2800)
  }, [router])

  const navigateToCheckout = useCallback(() => {
    setLoading('checkout')
    setTimeout(() => {
      router.push('/checkout')
      setTimeout(() => setLoading(null), 100)
    }, 2800)
  }, [router])

  return (
    <NavCtx.Provider value={{ loading, navigateToCart, navigateToCheckout }}>
      {children}
      {loading === 'cart' && <CartLoadingScreen />}
      {loading === 'checkout' && <CheckoutLoadingScreen />}
    </NavCtx.Provider>
  )
}
```

---

### Task 11: Create CartLoadingScreen component

**Files:**
- Create: `src/components/store/CartLoadingScreen.tsx`

- [ ] **Create cart loading animation**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-store'

const GOLD = '#C9A96E'

const figureVariants = {
  hidden: { x: -200, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const armVariants = {
  hidden: { rotate: 0 },
  reach: {
    rotate: -30,
    transition: { duration: 0.5, delay: 0.7, ease: 'easeInOut' },
  },
  place: {
    rotate: 20,
    transition: { duration: 0.5, delay: 1.5, ease: 'easeInOut' },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0, x: 40, y: -20 },
  float: {
    opacity: 1,
    scale: 1.2,
    x: 100,
    y: 60,
    transition: { duration: 0.6, delay: 1.0, ease: 'easeOut' },
  },
  drop: {
    opacity: 0,
    scale: 0.3,
    x: 110,
    y: 80,
    transition: { duration: 0.3, delay: 1.8, ease: 'easeIn' },
  },
}

function MaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      {/* Head */}
      <circle cx="50" cy="40" r="14" fill="#f0d5b0" />
      {/* Hair */}
      <path d="M36 35 Q50 15 64 35 Q60 30 50 28 Q40 30 36 35Z" fill="#3a2a1a" />
      {/* Torso */}
      <path d="M40 54 L60 54 L55 85 L45 85Z" fill="#4a5568" />
      {/* Left arm */}
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(-15 35 57)" />
      </motion.g>
      {/* Right arm */}
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="56" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(15 65 57)" />
      </motion.g>
      {/* Legs */}
      <rect x="43" y="85" width="9" height="20" rx="3" fill="#2d3748" />
      <rect x="52" y="85" width="9" height="20" rx="3" fill="#2d3748" />
    </motion.g>
  )
}

function FemaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      {/* Head */}
      <circle cx="50" cy="40" r="13" fill="#f5dcc3" />
      {/* Hair - longer */}
      <path d="M37 35 Q50 10 63 35 Q58 28 50 26 Q42 28 37 35Z" fill="#5c3a1e" />
      <path d="M37 35 Q35 50 37 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M63 35 Q65 50 63 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Dress */}
      <path d="M38 54 L62 54 L66 90 L34 90Z" fill="#c53030" />
      {/* Left arm */}
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(-15 34 57)" />
      </motion.g>
      {/* Right arm */}
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="58" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(15 66 57)" />
      </motion.g>
      {/* Legs */}
      <rect x="44" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
      <rect x="53" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
    </motion.g>
  )
}

function ShoppingCart() {
  return (
    <g>
      {/* Cart body */}
      <rect x="250" y="160" width="70" height="50" rx="8" fill="none" stroke={GOLD} strokeWidth="3" />
      {/* Cart grid lines */}
      <line x1="250" y1="175" x2="320" y2="175" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
      <line x1="250" y1="190" x2="320" y2="190" stroke={GOLD} strokeWidth="1.5" opacity="0.4" />
      {/* Handle */}
      <path d="M260 160 Q260 140 285 140 Q310 140 310 160" fill="none" stroke={GOLD} strokeWidth="3" />
      {/* Wheels */}
      <circle cx="265" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
      <circle cx="305" cy="215" r="8" fill="none" stroke={GOLD} strokeWidth="2.5" />
      {/* Items inside */}
      <circle cx="270" cy="185" r="5" fill={GOLD} opacity="0.6" />
      <rect x="290" y="180" width="10" height="10" rx="2" fill={GOLD} opacity="0.6" />
    </g>
  )
}

function SparkleItem() {
  return (
    <motion.g variants={itemVariants}>
      <polygon points="0,-12 5,-3 14,-3 7,4 9,14 0,8 -9,14 -7,4 -14,-3 -5,-3" fill={GOLD} />
    </motion.g>
  )
}

export function CartLoadingScreen() {
  const { user } = useAuth()
  const gender = user?.gender
  const [showFemale, setShowFemale] = useState(false)

  useEffect(() => {
    if (!gender) {
      const timer = setTimeout(() => setShowFemale(true), 1400)
      return () => clearTimeout(timer)
    }
  }, [gender])

  return (
    <div className="fixed inset-0 z-[100] bg-navy-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <svg viewBox="0 0 400 280" className="w-80 h-56">
          {!showFemale && (
            <motion.g
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
            >
              <MaleFigure />
              <ShoppingCart />
              <motion.g
                initial="hidden"
                animate={['float', 'drop']}
                style={{ x: 50, y: 50 }}
              >
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
          {(gender === 'FEMALE' || showFemale) && (
            <motion.g
              initial="hidden"
              animate="visible"
            >
              <FemaleFigure />
              <ShoppingCart />
              <motion.g
                initial="hidden"
                animate={['float', 'drop']}
                style={{ x: 50, y: 50 }}
              >
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
        </svg>
        <p className="font-display text-sm text-gold tracking-wider uppercase animate-pulse">
          Adding to your bag...
        </p>
      </div>
    </div>
  )
}
```

---

### Task 12: Create CheckoutLoadingScreen component

**Files:**
- Create: `src/components/store/CheckoutLoadingScreen.tsx`

- [ ] **Create checkout loading animation**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-store'

const GOLD = '#C9A96E'

const figureVariants = {
  hidden: { x: -200, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const armVariants = {
  hidden: { rotate: 0 },
  reach: {
    rotate: -30,
    transition: { duration: 0.5, delay: 0.7, ease: 'easeInOut' },
  },
  present: {
    rotate: 0,
    transition: { duration: 0.5, delay: 1.5, ease: 'easeInOut' },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0, x: 40 },
  float: {
    opacity: 1,
    scale: 1.2,
    x: 90,
    y: -10,
    transition: { duration: 0.6, delay: 1.0, ease: 'easeOut' },
  },
  done: {
    opacity: 0,
    transition: { duration: 0.3, delay: 2.0 },
  },
}

function MaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      <circle cx="50" cy="40" r="14" fill="#f0d5b0" />
      <path d="M36 35 Q50 15 64 35 Q60 30 50 28 Q40 30 36 35Z" fill="#3a2a1a" />
      <path d="M40 54 L60 54 L55 85 L45 85Z" fill="#4a5568" />
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(-15 35 57)" />
      </motion.g>
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="56" y="54" width="18" height="7" rx="3" fill="#f0d5b0" transform="rotate(15 65 57)" />
      </motion.g>
      <rect x="43" y="85" width="9" height="20" rx="3" fill="#2d3748" />
      <rect x="52" y="85" width="9" height="20" rx="3" fill="#2d3748" />
    </motion.g>
  )
}

function FemaleFigure() {
  return (
    <motion.g variants={figureVariants}>
      <circle cx="50" cy="40" r="13" fill="#f5dcc3" />
      <path d="M37 35 Q50 10 63 35 Q58 28 50 26 Q42 28 37 35Z" fill="#5c3a1e" />
      <path d="M37 35 Q35 50 37 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M63 35 Q65 50 63 65" stroke="#5c3a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M38 54 L62 54 L66 90 L34 90Z" fill="#c53030" />
      <motion.g variants={armVariants} style={{ originX: '45px', originY: '56px' }}>
        <rect x="26" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(-15 34 57)" />
      </motion.g>
      <motion.g variants={armVariants} style={{ originX: '55px', originY: '56px' }}>
        <rect x="58" y="54" width="16" height="6" rx="3" fill="#f5dcc3" transform="rotate(15 66 57)" />
      </motion.g>
      <rect x="44" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
      <rect x="53" y="88" width="7" height="17" rx="2" fill="#f5dcc3" />
    </motion.g>
  )
}

function CheckoutCounter() {
  return (
    <g>
      {/* Counter table */}
      <rect x="240" y="170" width="100" height="35" rx="4" fill="none" stroke={GOLD} strokeWidth="3" />
      {/* Card reader */}
      <rect x="280" y="155" width="20" height="15" rx="2" fill="none" stroke={GOLD} strokeWidth="2" />
      {/* Screen */}
      <rect x="250" y="145" width="25" height="20" rx="2" fill="none" stroke={GOLD} strokeWidth="1.5" />
      {/* Receipt */}
      <rect x="325" y="160" width="8" height="25" rx="1" fill={GOLD} opacity="0.3" />
      {/* Items on counter */}
      <circle cx="260" cy="165" r="4" fill={GOLD} opacity="0.5" />
      <rect x="300" y="165" width="8" height="6" rx="1" fill={GOLD} opacity="0.5" />
    </g>
  )
}

function SparkleItem() {
  return (
    <motion.g variants={itemVariants}>
      <polygon points="0,-12 5,-3 14,-3 7,4 9,14 0,8 -9,14 -7,4 -14,-3 -5,-3" fill={GOLD} />
    </motion.g>
  )
}

export function CheckoutLoadingScreen() {
  const { user } = useAuth()
  const gender = user?.gender
  const [showFemale, setShowFemale] = useState(false)

  useEffect(() => {
    if (!gender) {
      const timer = setTimeout(() => setShowFemale(true), 1400)
      return () => clearTimeout(timer)
    }
  }, [gender])

  return (
    <div className="fixed inset-0 z-[100] bg-navy-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <svg viewBox="0 0 400 280" className="w-80 h-56">
          {!showFemale && (
            <motion.g initial="hidden" animate="visible" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
              <MaleFigure />
              <CheckoutCounter />
              <motion.g initial="hidden" animate={['float', 'done']} style={{ x: 50, y: 40 }}>
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
          {(gender === 'FEMALE' || showFemale) && (
            <motion.g initial="hidden" animate="visible">
              <FemaleFigure />
              <CheckoutCounter />
              <motion.g initial="hidden" animate={['float', 'done']} style={{ x: 50, y: 40 }}>
                <SparkleItem />
              </motion.g>
            </motion.g>
          )}
        </svg>
        <p className="font-display text-sm text-gold tracking-wider uppercase animate-pulse">
          Processing your order...
        </p>
      </div>
    </div>
  )
}
```

---

### Task 13: Wire up provider in root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Import and wrap NavigationLoadingProvider**

Add import:
```tsx
import { NavigationLoadingProvider } from '@/components/store/NavigationLoadingProvider'
```

After the opening `<body>` tag, wrap the content area:
```tsx
      <body ...>
        <StorefrontEffects />
        <NavigationProgress />
        <AuthHydrator />
        <NavigationLoadingProvider>
          <DesignProvider>
            <PageViewWrapper>{children}</PageViewWrapper>
          </DesignProvider>
        </NavigationLoadingProvider>
        <EditModeGate />
        <Toaster />
      </body>
```

---

### Task 14: Update cart button in Header

**Files:**
- Modify: `src/components/store/Header.tsx`

- [ ] **Replace router.push with navigation hook**

At the top (after other imports), add:
```tsx
import { usePageNavigation } from './NavigationLoadingProvider'
```

Inside the component, add:
```tsx
  const { navigateToCart } = usePageNavigation()
```

Line 186: change:
```tsx
<button onClick={() => navigateToCart()} ...>
```

---

### Task 15: Update checkout button in CartContent

**Files:**
- Modify: `src/components/store/CartContent.tsx`

- [ ] **Replace router.push with navigation hook**

At the top, add import:
```tsx
import { usePageNavigation } from './NavigationLoadingProvider'
```

Inside the component, add:
```tsx
  const { navigateToCheckout } = usePageNavigation()
```

Line 55: change:
```tsx
    navigateToCheckout()
```

---

### Task 16: Build and verify

- [ ] **Build the project**

```bash
npm run build
```

Expected: `✓ Compiled successfully`

- [ ] **Commit all changes**

```bash
git add .
git commit -m "feat: add gender field + animated cart/checkout loading screens"
git push origin main
```
