# Polish & Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 structural animation improvements: header shrink, skeleton shimmer, cart exit animation, floating form labels, and animated validation feedback.

**Architecture:** CSS-only animations (Tailwind v4 `@theme` registration + custom `@keyframes`), CSS-only floating labels (peer/placeholder-shown pattern), framer-motion AnimatePresence for cart exit, state-based error classes for validation feedback.

**Tech Stack:** Tailwind CSS v4 (custom animations via `@theme`), framer-motion 12.x (AnimatePresence, motion.div), shadcn/ui Input/Label components, Next.js 15

**Note for implementer:** This project uses Tailwind CSS v4. Custom animations must be registered in the `@theme` block using `--animate-*` keys. Do NOT use `extend` or `animation` in `tailwind.config` — there is no tailwind.config. The `@theme` directive is in `globals.css`.

---

## File Structure

### Modified files:

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `--animate-shimmer`, `--animate-shake` to `@theme`; add `@keyframes shimmer`, `@keyframes shake` |
| `src/components/ui/skeleton.tsx` | Replace `animate-pulse` with shimmer animation |
| `src/components/store/Header.tsx` | Add height/size changes on `scrolled` state |
| `src/components/store/CartContent.tsx` | Wrap cart items in AnimatePresence, add exit animation |
| `src/app/login/page.tsx` | Floating labels + validation feedback |
| `src/app/register/page.tsx` | Floating labels + validation feedback |
| `src/app/forgot-password/page.tsx` | Floating labels + validation feedback |
| `src/app/reset-password/page.tsx` | Floating labels + validation feedback |
| `src/app/account/ProfileSection.tsx` | Floating labels + validation feedback |
| `src/app/account/AddressesSection.tsx` | Floating labels + validation feedback |
| `src/app/account/CardsSection.tsx` | Floating labels + validation feedback |
| `src/components/store/CheckoutContent.tsx` | Floating labels + validation feedback |

---

### Task 1: Register shimmer + shake animations in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `--animate-shimmer` and `--animate-shake` to the `@theme` block**

Add to the `@theme` block (after `--font-display` line, before the closing `}`):

```css
  --animate-shimmer: shimmer 2.5s ease-in-out infinite;
  --animate-shake: shake 0.3s ease-in-out;
```

- [ ] **Step 2: Add `@keyframes shimmer` and `@keyframes shake` after the `@theme` block**

Add after the `@theme` closing brace (before `:root`):

```css
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes shake {
  0%, 100% { transform: translateX(0) }
  20% { transform: translateX(-4px) }
  40% { transform: translateX(4px) }
  60% { transform: translateX(-4px) }
  80% { transform: translateX(4px) }
}
```

Now `animate-shimmer` and `animate-shake` are available as Tailwind utility classes.

- [ ] **Step 3: Verify**

Run: `npm run build` (or just confirm the CSS compiles without errors)

---

### Task 2: Update skeleton component with shimmer effect

**Files:**
- Modify: `src/components/ui/skeleton.tsx`

- [ ] **Step 1: Replace `animate-pulse` with shimmer animation**

Change the skeleton `className` from:
```
"bg-accent animate-pulse rounded-md"
```
to:
```
"bg-accent rounded-md bg-[length:200%_100%] animate-shimmer"
```

The `animate-shimmer` uses the `@keyframes shimmer` registered in `@theme`. The `bg-[length:200%_100%]` ensures the gradient can sweep across the element. The accent background color provides the base color; the shimmer gradient will be added inline via a pseudo-element or background image trick.

Wait — the current skeleton has no shimmer gradient, just a solid `bg-accent`. For a shimmer effect, we need a gradient that animates. The cleanest approach: replace the solid background with a gradient that includes the shimmer sweep.

Change to:
```
"rounded-md bg-[length:200%_100%] animate-shimmer bg-gradient-to-r from-accent via-accent/50 to-accent"
```

This creates a subtle bright sweep across the accent background. The shimmer keyframe moves the gradient left-to-right.

- [ ] **Step 2: Verify the skeleton still renders in the app**

Open any page that uses skeletons (e.g., account page, admin pages). They should show a horizontal shimmer sweep instead of the pulse opacity fade.

---

### Task 3: Header shrink on scroll

**Files:**
- Modify: `src/components/store/Header.tsx`

- [ ] **Step 1: Add conditional height class to the header container**

Change line 93:
```tsx
<div className="flex items-center justify-between h-20">
```
to:
```tsx
<div className={cn("flex items-center justify-between transition-all duration-500", scrolled ? "h-16" : "h-20")}>
```

- [ ] **Step 2: Shrink the logo in scrolled state**

Change line 103:
```tsx
<div className="relative h-12 w-12 rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold/60 transition-all">
```
to:
```tsx
<div className={cn("relative rounded-full overflow-hidden ring-2 ring-gold/30 group-hover:ring-gold/60 transition-all", scrolled ? "h-9 w-9" : "h-12 w-12")}>
```

- [ ] **Step 3: Reduce nav link text in scrolled state**

The nav links at lines 123-169 use `text-sm`. Replace the nav `<nav>` wrapper with:

Change line 122:
```tsx
<nav className="hidden lg:flex items-center gap-8">
```
to:
```tsx
<nav className={cn("hidden lg:flex items-center gap-8 transition-all", scrolled ? "text-xs" : "text-sm")}>
```

Note: `text-xs` on the nav element cascades down to child `text-sm` buttons. We need to override the child buttons. Rather than cascading, apply the class individually. So revert the nav to plain class and instead apply to category buttons and nav links:

For category buttons (line 132), change:
```tsx
className="flex items-center gap-1 text-sm font-medium text-navy/80 hover:text-gold transition-colors group"
```
to:
```tsx
className={cn("flex items-center gap-1 font-medium text-navy/80 hover:text-gold transition-colors group", scrolled ? "text-xs" : "text-sm")}
```

For nav links (line 164), change:
```tsx
className="relative text-sm font-medium text-navy/80 hover:text-gold transition-colors group"
```
to:
```tsx
className={cn("relative font-medium text-navy/80 hover:text-gold transition-colors group", scrolled ? "text-xs" : "text-sm")}
```

- [ ] **Step 4: Verify**

Scroll down on any page with the header. The header height should shrink from h-20 to h-16, logo from 48px to 36px, and nav text from 14px to 12px — all animated via `transition-all duration-500`.

---

### Task 4: Cart item exit animation

**Files:**
- Modify: `src/components/store/CartContent.tsx`

- [ ] **Step 1: Wrap the items map in AnimatePresence**

Import `AnimatePresence` at the top (framer-motion is already imported on line 7):
```tsx
import { motion, AnimatePresence } from 'framer-motion'
```

- [ ] **Step 2: Wrap cart items div with AnimatePresence and make each item a motion.div**

Change lines 101-153 from:
```tsx
<div className="flex-1 overflow-y-auto scroll-luxury p-5 space-y-4">
  {items.map((item) => (
    <div key={item.product.id} className="flex gap-3 group">
      ...
    </div>
  ))}
  ...
</div>
```
to:
```tsx
<div className="flex-1 overflow-y-auto scroll-luxury p-5 space-y-4">
  <AnimatePresence mode="popLayout">
    {items.map((item) => (
      <motion.div
        key={item.product.id}
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 80, height: 0 }}
        transition={{ duration: 0.2 }}
        className="flex gap-3 group"
      >
        ...
      </motion.div>
    ))}
  </AnimatePresence>
  ...
</div>
```

Note: `mode="popLayout"` ensures smooth layout shifts as items are removed. The `height: 0` in `exit` animates the item collapsing before removal.

- [ ] **Step 3: Verify**

Open the cart, add a few items, then remove one. The removed item should slide right and fade while the remaining items smoothly reflow into place.

---

### Task 5: Floating labels + validation feedback on auth pages

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/register/page.tsx`
- Modify: `src/app/forgot-password/page.tsx`
- Modify: `src/app/reset-password/page.tsx`

These 4 pages share the same raw `<label>` + `<input>` pattern. Each must be updated individually.

Common pattern for each input field (replace the existing `<div>` wrapper with a floating-label `<label>`):

**Before (login email example, lines 86-89):**
```tsx
<div>
  <label className="text-sm font-medium text-navy">Email</label>
  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border text-sm mt-1" placeholder="your@email.com" />
</div>
```

**After:**
```tsx
<label className="relative block">
  <input
    type="email"
    required
    value={email}
    onChange={(e) => { setEmail(e.target.value); setErrors(e => ({ ...e, email: '' })) }}
    className={cn(
      "peer w-full rounded-lg border px-3 pt-5 pb-2.5 text-sm outline-none transition-colors",
      errors.email ? "border-red-500 animate-shake" : "border-border focus:border-gold"
    )}
    placeholder=" "
  />
  <span className={cn(
    "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
    errors.email ? "text-red-500" : "text-muted-foreground",
    "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
    "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
  )}>
    Email
  </span>
  {errors.email && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.email}</p>}
</label>
```

#### Login page (login/page.tsx)

- [ ] **Step 1: Add imports**

Add to existing imports at top:
```tsx
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Add errors state**

After line 16 (`const [totpEmail, setTotpEmail] = useState('')`):
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 3: Add validation to handleSubmit**

After line 23 (`e.preventDefault()`), add validation:
```tsx
const newErrors: Record<string, string> = {}
if (!email) newErrors.email = 'Email is required'
if (!password) newErrors.password = 'Password is required'
if (Object.keys(newErrors).length) { setErrors(newErrors); return }
```

- [ ] **Step 4: Replace email input (lines 86-89) with floating label pattern** using the template above

- [ ] **Step 5: Replace password input (lines 91-93) with floating label pattern** using the template above

#### Register page (register/page.tsx)

- [ ] **Step 1-3: Same pattern** as login — add `cn` import, `errors` state, validation in handleSubmit

- [ ] **Step 4-6: Replace name, email, password inputs** with floating label pattern

#### Forgot password page (forgot-password/page.tsx)

- [ ] **Step 1-3: Same pattern** — add `cn` import, `errors` state, validation in handleSubmit

- [ ] **Step 4: Replace email input** with floating label pattern

#### Reset password page (reset-password/page.tsx)

- [ ] **Step 1: Add imports**

```tsx
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Add errors state**

After line 19 (`const [done, setDone] = useState(false)`):
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 3: Replace email input (lines 93-94) with floating label pattern**

- [ ] **Step 4: Replace password input (lines 96-112) with floating label pattern**

The password field has a show/hide toggle button. Wrap the entire container in the floating label:
```tsx
<label className="relative block">
  <div className="relative">
    <input
      type={showPwd ? 'text' : 'password'}
      required
      value={password}
      onChange={(e) => { setPassword(e.target.value); setErrors(e => ({ ...e, password: '' })) }}
      className={cn(
        "peer w-full rounded-lg border px-3 pt-5 pb-2.5 pr-10 text-sm outline-none transition-colors",
        errors.password ? "border-red-500 animate-shake" : "border-border focus:border-gold"
      )}
      placeholder=" "
      minLength={8}
    />
    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy z-10">
      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
  <span className={cn(
    "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
    errors.password ? "text-red-500" : "text-muted-foreground",
    "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
    "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
  )}>
    New Password
  </span>
  {errors.password && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.password}</p>}
</label>
```

---

### Task 6: Floating labels + validation on account section forms

**Files:**
- Modify: `src/app/account/ProfileSection.tsx`
- Modify: `src/app/account/AddressesSection.tsx`
- Modify: `src/app/account/CardsSection.tsx`

These files use shadcn `<Label>` + `<Input>` with `space-y-1.5` wrappers. The floating label replaces both.

**Before (ProfileSection Name, lines 140-143):**
```tsx
<div className="space-y-1.5">
  <Label>Name</Label>
  <Input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
</div>
```

**After:**
```tsx
<label className="relative block">
  <Input
    value={profile.name}
    onChange={(e) => { setProfile(p => ({ ...p, name: e.target.value })); setErrors(e => ({ ...e, name: '' })) }}
    className={cn(
      "peer rounded-xl pt-5",
      errors.name ? "border-red-500 animate-shake" : ""
    )}
    placeholder=" "
  />
  <span className={cn(
    "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
    errors.name ? "text-red-500" : "text-muted-foreground",
    "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
    "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
  )}>
    Name
  </span>
  {errors.name && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.name}</p>}
</label>
```

#### ProfileSection

- [ ] **Step 1: Add `cn` import**

```tsx
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Add errors state before the return statement**

```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 3: Add validation to saveProfile**

At the start of `saveProfile`, before the try block:
```tsx
const newErrors: Record<string, string> = {}
if (!profile.name.trim()) newErrors.name = 'Name is required'
if (Object.keys(newErrors).length) { setErrors(newErrors); return }
```

- [ ] **Step 4: Replace Name input (lines 140-143)** with floating label pattern

- [ ] **Step 5: Replace Email input (lines 144-148)**

The email is disabled — it still gets a floating label but no error state:
```tsx
<label className="relative block">
  <Input value={profile.email} disabled className="peer rounded-xl pt-5 bg-secondary/50" placeholder=" " />
  <span className="absolute left-3 top-1.5 text-sm text-muted-foreground transition-all duration-200 pointer-events-none peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold">
    Email
  </span>
  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
</label>
```

- [ ] **Step 6: Replace Phone input (lines 149-152)** with floating label pattern

#### AddressesSection

- [ ] **Step 1: Add `cn` import**

```tsx
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Add errors state**

```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 3: Add validation to saveAddress**

At the start of `saveAddress`:
```tsx
const newErrors: Record<string, string> = {}
if (!addressForm.fullName.trim()) newErrors.fullName = 'Name is required'
if (!addressForm.street.trim()) newErrors.street = 'Street is required'
if (!addressForm.city.trim()) newErrors.city = 'City is required'
if (!addressForm.postalCode.trim()) newErrors.postalCode = 'Postal code is required'
if (Object.keys(newErrors).length) { setErrors(newErrors); return }
```

- [ ] **Step 4: Replace all form inputs in the address form (lines 91-118)** with floating label pattern

Each of: Full Name, Phone, Street, City, State/Region, Postal Code, Country

#### CardsSection

- [ ] **Step 1: Add `cn` import**

```tsx
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Add errors state**

```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 3: Add validation to saveCard**

At the start of `saveCard`:
```tsx
const newErrors: Record<string, string> = {}
if (!cardForm.cardNumber || cardForm.cardNumber.length < 4) newErrors.cardNumber = 'Enter at least 4 digits'
if (!cardForm.expiryMonth) newErrors.expiryMonth = 'Required'
if (!cardForm.expiryYear) newErrors.expiryYear = 'Required'
if (Object.keys(newErrors).length) { setErrors(newErrors); return }
```

- [ ] **Step 4: Replace Card Nickname, Card Number, Expiry Month, Expiry Year** with floating label pattern

---

### Task 7: Floating labels + validation on checkout

**Files:**
- Modify: `src/components/store/CheckoutContent.tsx`

- [ ] **Step 1: Add errors state**

After line 63 (after `form` state):
```tsx
const [errors, setErrors] = useState<Record<string, string>>({})
```

- [ ] **Step 2: Add `clearErrors` handler in onChange for each field**

Each existing onChange in the form fields needs to clear the corresponding error. Example for email (line 251):
```tsx
onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(e => ({ ...e, email: '' }) })
```

- [ ] **Step 3: Add validation to handleDetailsSubmit**

Replace the existing validation (lines 187-192):
```tsx
const handleDetailsSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const newErrors: Record<string, string> = {}
  if (!form.email.trim()) newErrors.email = 'Email is required'
  if (!form.fullName.trim()) newErrors.fullName = 'Name is required'
  if (!form.address.trim()) newErrors.address = 'Address is required'
  if (!form.city.trim()) newErrors.city = 'City is required'
  if (!form.postalCode.trim()) newErrors.postalCode = 'Postal code is required'
  if (Object.keys(newErrors).length) { setErrors(newErrors); return }
  setStep('payment')
}
```

- [ ] **Step 4: Replace checkout form inputs** with floating label pattern

For each field in the checkout form (email, fullName, address, city, postalCode, country, phone):

**Before (email, lines 249-252):**
```tsx
<div className="space-y-1.5">
  <Label htmlFor="email">{t('checkout.email')} *</Label>
  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="rounded-xl" />
</div>
```

**After:**
```tsx
<label className="relative block">
  <Input
    id="email"
    type="email"
    required
    value={form.email}
    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors(e => ({ ...e, email: '' })) }}
    className={cn("peer rounded-xl pt-5", errors.email ? "border-red-500 animate-shake" : "")}
    placeholder=" "
  />
  <span className={cn(
    "absolute left-3 top-1.5 text-sm transition-all duration-200 pointer-events-none",
    errors.email ? "text-red-500" : "text-muted-foreground",
    "peer-focus:top-0.5 peer-focus:text-[11px] peer-focus:text-gold",
    "peer-[:not(:placeholder-shown)]:top-0.5 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:text-gold"
  )}>
    {t('checkout.email')} *
  </span>
  {errors.email && <p className="text-xs text-red-500 mt-1 transition-opacity duration-200">{errors.email}</p>}
</label>
```

Note: The notes textarea and gift-wrap section do NOT get floating labels — they use different UI patterns.

---

### Self-Review Checklist

1. **Spec coverage:**
   - Header shrink on scroll → Task 3 ✓
   - Skeleton shimmer effect → Task 2 ✓
   - Cart item exit animation → Task 4 ✓
   - Floating labels → Tasks 5, 6, 7 ✓
   - Animated validation feedback → Tasks 5, 6, 7 (integrated with floating labels) ✓

2. **Placeholder scan:** No TBD, TODO, "implement later" patterns found.

3. **Type consistency:** All `errors` state uses `Record<string, string>`. All `setErrors` usage consistent across components. All `cn` imports in new/changed code use `@/lib/utils` (the proper shadcn clsx+twMerge version). The Header already uses `@/lib/format` which has its own `cn` — that's fine, don't change it.
