# Public Site Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the SPA-style homepage (overlays for product detail, cart, checkout) into proper Next.js routes.

**Architecture:** Extract shared content components from existing overlay components, create new pages at `/products`, `/products/[id]`, `/cart`, `/checkout`, update all navigation to use `router.push()`, then clean up overlays from homepage.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Zustand, Framer Motion

---

## File Structure

### Create
- `src/components/store/CartContent.tsx` — Cart UI extracted from CartDrawer
- `src/components/store/CheckoutContent.tsx` — Checkout UI extracted from CheckoutDialog
- `src/app/products/page.tsx` — Product listing page
- `src/app/products/[id]/page.tsx` — Product detail page
- `src/app/cart/page.tsx` — Cart page
- `src/app/checkout/page.tsx` — Checkout page

### Modify
- `src/components/store/CartDrawer.tsx` — Wrap CartContent in drawer shell
- `src/components/store/CheckoutDialog.tsx` — Wrap CheckoutContent in dialog shell
- `src/components/store/ProductCard.tsx` — Click → `router.push(/products/${id})` instead of `setProductModal(id)`
- `src/components/store/CategoryGrid.tsx` — Click → `router.push(/products?category=xxx)` instead of custom event
- `src/components/store/FeaturedProducts.tsx` — Click → `router.push(/products/${id})`
- `src/components/store/Header.tsx` — Cart icon → `/cart` instead of `openCart()`
- `src/app/page.tsx` — Remove overlay imports and renders (keep SearchDialog, WishlistDrawer, ExitIntentPopup)

### Delete (or keep unused — no cleanup needed)
- `ProductModal` overlay remains but won't be triggered after ProductCard update
- `CartDrawer`, `CheckoutDialog` remain but won't be triggered after navigation updates

---

### Task 1: Extract CartContent from CartDrawer

**Files:**
- Create: `src/components/store/CartContent.tsx`
- Modify: `src/components/store/CartDrawer.tsx`

- [ ] **Read CartDrawer.tsx to understand its structure**

Run: `Get-Content src\components\store\CartDrawer.tsx`

- [ ] **Create CartContent.tsx** — Extract the cart UI (item list, progress bar, recommendations, totals, checkout button) into a standalone component that receives no props and uses Zustand stores directly.

```tsx
'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Trash2, Plus, Minus, Truck } from 'lucide-react'
import { useCart } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/format'

export function CartContent() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, subtotal, count } = useCart()
  const { formatPrice } = useFormatPrice()
  const { t } = useTranslation()

  const FREE_SHIPPING_THRESHOLD = 100
  const subtotalValue = subtotal()
  const progress = Math.min((subtotalValue / FREE_SHIPPING_THRESHOLD) * 100, 100)
  const shipping = subtotalValue >= FREE_SHIPPING_THRESHOLD ? 0 : 9.99
  const tax = subtotalValue * 0.08
  const total = subtotalValue + shipping + tax

  const handleCheckout = useCallback(() => {
    router.push('/checkout')
  }, [router])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <ShoppingBag className="w-16 h-16 text-silver mb-4" />
        <p className="text-navy font-semibold mb-2">{t('cart.empty')}</p>
        <Link href="/products">
          <Button variant="outline">{t('cart.startShopping')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="w-4 h-4 text-gold" />
            <span className="text-xs text-silver">
              {subtotalValue >= FREE_SHIPPING_THRESHOLD
                ? t('cart.freeShipping')
                : t('cart.freeShippingProgress', {
                    amount: formatPrice(FREE_SHIPPING_THRESHOLD - subtotalValue),
                  })}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-amber-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="flex gap-4 py-4 border-b border-white/10"
            >
              <Link href={`/products/${item.product.id}`} className="shrink-0">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-white/5">
                  {item.product.images?.[0] && (
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.id}`}>
                  <h4 className="font-medium text-navy truncate">{item.product.name}</h4>
                </Link>
                <p className="text-xs text-silver">{item.product.material}</p>
                <p className="text-sm font-semibold text-navy mt-1">
                  {formatPrice(item.product.price)}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-white/10 hover:bg-white/5"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded border border-white/10 hover:bg-white/5"
                    disabled={item.quantity >= item.product.stock}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="ml-auto text-silver hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/10 p-4 sm:p-6 space-y-2">
        <div className="flex justify-between text-sm text-silver">
          <span>{t('cart.subtotal')} ({count()} {t('cart.items')})</span>
          <span>{formatPrice(subtotalValue)}</span>
        </div>
        <div className="flex justify-between text-sm text-silver">
          <span>{t('cart.shipping')}</span>
          <span>{shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-sm text-silver">
          <span>{t('cart.tax')}</span>
          <span>{formatPrice(tax)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-navy pt-2 border-t border-white/10">
          <span>{t('cart.total')}</span>
          <span className="bg-gradient-to-r from-gold to-amber-400 bg-clip-text text-transparent">
            {formatPrice(total)}
          </span>
        </div>
        <Button
          className="w-full mt-4 bg-gradient-to-r from-gold to-amber-400 text-navy-deep font-semibold hover:from-amber-400 hover:to-gold transition-all duration-300"
          onClick={handleCheckout}
        >
          {t('cart.checkout')}
        </Button>
        <Link
          href="/products"
          className="block text-center text-sm text-silver hover:text-gold transition-colors mt-2"
        >
          {t('cart.continueShopping')}
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Update CartDrawer.tsx** to wrap CartContent in the drawer shell (Sheet from shadcn), remove duplicated item list logic

```tsx
'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCart } from '@/lib/store'
import { useTranslation } from '@/hooks/use-translation'
import { CartContent } from './CartContent'

export function CartDrawer() {
  const { isOpen, closeCart, count } = useCart()
  const { t } = useTranslation()

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="w-full max-w-md bg-navy-deep border-l border-white/10 p-0 flex flex-col">
        <SheetHeader className="px-4 sm:px-6 pt-6 pb-2">
          <SheetTitle className="text-navy font-display text-xl">
            {t('cart.title')} ({count()})
          </SheetTitle>
        </SheetHeader>
        <CartContent />
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/store/CartContent.tsx src/components/store/CartDrawer.tsx
git commit -m "refactor: extract CartContent from CartDrawer for shared use"
```

---

### Task 2: Extract CheckoutContent from CheckoutDialog

**Files:**
- Create: `src/components/store/CheckoutContent.tsx`
- Modify: `src/components/store/CheckoutDialog.tsx`

- [ ] **Read CheckoutDialog.tsx**

Run: `Get-Content src\components\store\CheckoutDialog.tsx`

- [ ] **Create CheckoutContent.tsx** — Extract the full multi-step checkout logic (Details → Payment → Processing → Done) into a standalone component. It reads `checkoutOpen` from `useUI` and when rendered as a page, the "open" state is effectively always `true`.

```tsx
'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, CreditCard, Package, Truck } from 'lucide-react'
import { useCart, useUI } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

type CheckoutStep = 'details' | 'payment' | 'processing' | 'done'

export function CheckoutContent() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCart()
  const { setCheckoutOpen } = useUI()
  const { formatPrice } = useFormatPrice()
  const { t } = useTranslation()

  const [step, setStep] = useState<CheckoutStep>('details')
  const [form, setForm] = useState({ email: '', fullName: '', address: '', phone: '', city: '', postalCode: '', country: '', notes: '' })
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [orderId, setOrderId] = useState<string>('')

  const subtotalValue = subtotal()
  const shipping = subtotalValue >= 100 ? 0 : 9.99
  const tax = subtotalValue * 0.08
  const total = subtotalValue + shipping + tax

  const handleDetailsSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setStep('payment')
  }, [])

  const handlePayment = useCallback(async () => {
    setStep('processing')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.product.id, quantity: i.quantity })),
          shipping: form,
          paymentMethod,
          subtotal: subtotalValue,
          shippingFee: shipping,
          tax,
          total,
        }),
      })
      if (!res.ok) throw new Error('Order failed')
      const data = await res.json()
      setOrderId(data.id)
      clearCart()
      setStep('done')
    } catch {
      toast.error(t('checkout.error'))
      setStep('payment')
    }
  }, [items, form, paymentMethod, subtotalValue, shipping, tax, total, clearCart, setCheckoutOpen, t])

  const handleDone = useCallback(() => {
    setCheckoutOpen(false)
    router.push('/')
  }, [setCheckoutOpen, router])

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {(['details', 'payment', 'processing', 'done'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s ? 'bg-gold text-navy-deep' :
              ['details', 'payment', 'processing', 'done'].indexOf(step) > i ? 'bg-green-500 text-white' :
              'bg-white/10 text-silver'
            }`}>
              {['details', 'payment', 'processing', 'done'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < 3 && <div className="w-8 h-0.5 bg-white/10" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'details' && (
          <motion.form key="details" onSubmit={handleDetailsSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="text-xl font-display text-navy mb-4">{t('checkout.details')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t('checkout.email')}</Label><Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required type="email" /></div>
              <div><Label>{t('checkout.fullName')}</Label><Input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required /></div>
            </div>
            <div><Label>{t('checkout.address')}</Label><Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} required /></div>
            <div><Label>{t('checkout.phone')}</Label><Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>{t('checkout.city')}</Label><Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required /></div>
              <div><Label>{t('checkout.postalCode')}</Label><Input value={form.postalCode} onChange={e => setForm(p => ({ ...p, postalCode: e.target.value }))} required /></div>
              <div><Label>{t('checkout.country')}</Label><Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} required /></div>
            </div>
            <div><Label>{t('checkout.notes')}</Label><Input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
            <Button type="submit" className="w-full bg-gold text-navy-deep font-semibold">{t('checkout.continue')}</Button>
          </motion.form>
        )}

        {step === 'payment' && (
          <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <h2 className="text-xl font-display text-navy mb-4">{t('checkout.payment')}</h2>
            <p className="text-silver text-sm mb-4">{t('checkout.selectPayment')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['card', 'paypal', 'bank_transfer', 'cod', 'instapay', 'vodafone_cash'].map(method => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    paymentMethod === method
                      ? 'border-gold bg-gold/10 text-gold'
                      : 'border-white/10 text-silver hover:border-white/20'
                  }`}
                >
                  {t(`payment.${method}`)}
                </button>
              ))}
            </div>
            {/* Order summary */}
            <div className="bg-navy-deep rounded-xl p-4 space-y-2 mt-4">
              <div className="flex justify-between text-sm text-silver"><span>{t('cart.subtotal')}</span><span>{formatPrice(subtotalValue)}</span></div>
              <div className="flex justify-between text-sm text-silver"><span>{t('cart.shipping')}</span><span>{shipping === 0 ? t('cart.free') : formatPrice(shipping)}</span></div>
              <div className="flex justify-between text-sm text-silver"><span>{t('cart.tax')}</span><span>{formatPrice(tax)}</span></div>
              <div className="flex justify-between font-bold text-navy pt-2 border-t border-white/10"><span>{t('cart.total')}</span><span className="text-gold">{formatPrice(total)}</span></div>
            </div>
            <Button onClick={handlePayment} disabled={!paymentMethod} className="w-full bg-gold text-navy-deep font-semibold">{t('checkout.pay')}</Button>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-navy font-semibold">{t('checkout.processing')}</p>
            <p className="text-sm text-silver mt-2">{t('checkout.dontClose')}</p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-display text-navy mb-2">{t('checkout.success')}</h2>
            <p className="text-sm text-silver mb-2">{t('checkout.orderId')}: <span className="text-gold font-mono">{orderId}</span></p>
            <p className="text-sm text-silver mb-6">{t('checkout.confirmationEmail')}</p>
            <Button onClick={handleDone} className="bg-gold text-navy-deep font-semibold">{t('checkout.continueShopping')}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Update CheckoutDialog.tsx** to wrap CheckoutContent in a Dialog shell

```tsx
'use client'

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useUI } from '@/lib/store'
import { CheckoutContent } from './CheckoutContent'

export function CheckoutDialog() {
  const { checkoutOpen, setCheckoutOpen } = useUI()

  return (
    <Dialog open={checkoutOpen} onOpenChange={(open) => !open && setCheckoutOpen(false)}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-cream border border-white/20">
        <CheckoutContent />
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Commit**

```bash
git add src/components/store/CheckoutContent.tsx src/components/store/CheckoutDialog.tsx
git commit -m "refactor: extract CheckoutContent from CheckoutDialog for shared use"
```

---

### Task 3: Create /cart Page

**Files:**
- Create: `src/app/cart/page.tsx`

- [ ] **Create cart page** — Wraps CartContent with Header and Footer in a full page layout

```tsx
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CartContent } from '@/components/store/CartContent'

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="text-sm text-silver" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">Cart</li>
            </ol>
          </nav>
        </div>
        <h1 className="text-2xl font-display text-navy mb-6">Shopping Cart</h1>
        <CartContent />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/cart/page.tsx
git commit -m "feat: add /cart page"
```

---

### Task 4: Create /checkout Page

**Files:**
- Create: `src/app/checkout/page.tsx`

- [ ] **Create checkout page**

```tsx
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { CheckoutContent } from '@/components/store/CheckoutContent'

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <CheckoutContent />
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/checkout/page.tsx
git commit -m "feat: add /checkout page"
```

---

### Task 5: Create /products/[id] Product Detail Page

**Files:**
- Create: `src/app/products/[id]/page.tsx`

- [ ] **Read ProductModal.tsx to understand product detail layout**

Run: `Get-Content src\components\store\ProductModal.tsx`

- [ ] **Create product detail page** — Full-page version of ProductModal content

```tsx
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import ProductDetailClient from './ProductDetailClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params

  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: { select: { name: true, slug: true } },
      reviews: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, rating: true, comment: true, author: true, createdAt: true },
      },
      _count: { select: { reviews: true } },
    },
  })

  if (!product) notFound()

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-silver mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li><a href="/products" className="hover:text-gold transition-colors">Products</a></li>
              <li><span className="mx-2">/</span></li>
              <li><a href={`/products?category=${product.category.slug}`} className="hover:text-gold transition-colors">{product.category.name}</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{product.name}</li>
            </ol>
          </nav>

          <ProductDetailClient product={JSON.parse(JSON.stringify(product))} avgRating={avgRating} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Create ProductDetailClient.tsx** — Client component with all the interactive product detail UI (image gallery, add to cart, reviews, etc.). This is the interactive version of what ProductModal renders, adapted for a full-page layout.

Note: Read the actual ProductModal.tsx to understand exactly which interactive elements need to be in the client component. The key elements are:
- Image gallery with zoom
- Add to cart / wishlist buttons
- Quantity selector
- Review form submission
- "Complete the look" recommendations fetch

```tsx
'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Star, ShoppingBag, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useCart, useWishlist, useRecentlyViewed } from '@/lib/store'
import { useFormatPrice } from '@/hooks/use-format-price'
import { useTranslation } from '@/hooks/use-translation'
import { cn, discountPercent } from '@/lib/format'
import { toast } from 'sonner'
import type { Product } from '@/lib/types'

interface Props {
  product: Product & { category: { name: string; slug: string }; reviews: any[]; _count: { reviews: number } }
  avgRating: number
}

export default function ProductDetailClient({ product, avgRating }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const { addItem } = useCart()
  const wishlist = useWishlist()
  const { add: addToRecentlyViewed } = useRecentlyViewed()
  const { formatPrice } = useFormatPrice()
  const { t } = useTranslation()

  useEffect(() => { addToRecentlyViewed(product.id) }, [product.id, addToRecentlyViewed])

  const handleAddToCart = useCallback(() => {
    addItem(product as unknown as Product, quantity)
    toast.success(`${product.name} added to cart`)
  }, [product, quantity, addItem])

  const toggleWishlist = useCallback(() => {
    wishlist.toggle(product.id)
    toast.success(wishlist.has(product.id) ? t('wishlist.removed') : t('wishlist.saved'))
  }, [product.id, wishlist, t])

  const discount = product.compareAtPrice ? discountPercent(product.price, product.compareAtPrice) : 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Image Gallery */}
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 mb-4 group">
          {product.images?.[selectedImage] && (
            <Image
              src={product.images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority
            />
          )}
          {discount > 0 && (
            <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
        </div>
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                  i === selectedImage ? 'border-gold' : 'border-transparent'
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <p className="text-sm text-gold font-medium mb-1">{product.category.name}</p>
          <h1 className="text-3xl font-display text-navy">{product.name}</h1>
        </div>

        {avgRating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn('w-4 h-4', star <= Math.round(avgRating) ? 'text-gold fill-gold' : 'text-silver')}
                />
              ))}
            </div>
            <span className="text-sm text-silver">
              ({product._count.reviews} {t('product.reviews')})
            </span>
          </div>
        )}

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-navy">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-lg text-silver line-through">{formatPrice(product.compareAtPrice)}</span>
          )}
        </div>

        {product.description && (
          <p className="text-silver leading-relaxed">{product.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white/5 rounded-xl p-3">
            <span className="text-silver">{t('product.material')}</span>
            <p className="text-navy font-medium">{product.material}</p>
          </div>
          {product.weight && (
            <div className="bg-white/5 rounded-xl p-3">
              <span className="text-silver">{t('product.weight')}</span>
              <p className="text-navy font-medium">{product.weight}g</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-silver">{t('product.quantity')}:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:bg-white/5"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="w-8 h-8 flex items-center justify-center rounded border border-white/10 hover:bg-white/5"
              disabled={quantity >= product.stock}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs text-amber-400 ml-2">{t('product.onlyLeft', { count: product.stock })}</span>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="flex-1 bg-gradient-to-r from-gold to-amber-400 text-navy-deep font-semibold hover:from-amber-400 hover:to-gold transition-all duration-300"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            {product.stock === 0 ? t('product.outOfStock') : t('product.addToCart')}
          </Button>
          <Button
            variant="outline"
            onClick={toggleWishlist}
            className="border-white/10"
          >
            <Heart className={cn('w-4 h-4', wishlist.has(product.id) && 'fill-red-500 text-red-500')} />
          </Button>
        </div>

        {/* Reviews Section */}
        {product.reviews.length > 0 && (
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-display text-navy mb-4">{t('product.reviews')}</h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {product.reviews.map((review: any) => (
                <div key={review.id} className="bg-white/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-navy">{review.author}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={cn('w-3 h-3', star <= review.rating ? 'text-gold fill-gold' : 'text-silver')} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-silver">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/products/[id]/page.tsx src/app/products/[id]/ProductDetailClient.tsx
git commit -m "feat: add /products/[id] product detail page"
```

---

### Task 6: Create /products Listing Page

**Files:**
- Create: `src/app/products/page.tsx`

- [ ] **Create products listing page**

```tsx
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import ProductsPageClient from './ProductsPageClient'

export default async function ProductsPage() {
  const [categoriesRes, productsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/categories`, { cache: 'no-store' }).catch(() => null),
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/products?limit=100`, { cache: 'no-store' }).catch(() => null),
  ])

  const categories = categoriesRes?.ok ? await categoriesRes.json() : []
  const initialProducts = productsRes?.ok ? await productsRes.json() : []

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <nav className="text-sm text-silver mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">Products</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-display text-navy mb-8">Our Collection</h1>
          <ProductsPageClient categories={categories} initialProducts={initialProducts} />
        </div>
      </main>
      <Footer />
    </>
  )
}
```

- [ ] **Create ProductsPageClient.tsx** — Adapted from ProductGrid.tsx, using URL search params instead of local state for filters

```tsx
'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { SlidersHorizontal, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/store/ProductCard'
import { cn } from '@/lib/format'
import { useTranslation } from '@/hooks/use-translation'
import type { Product, Category } from '@/lib/types'

interface Props {
  categories: Category[]
  initialProducts: Product[]
}

export default function ProductsPageClient({ categories, initialProducts }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()

  const activeCategory = searchParams.get('category') || 'all'
  const sort = searchParams.get('sort') || 'newest'
  const maxPrice = Number(searchParams.get('maxPrice')) || 500

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loading, setLoading] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)
  const [showFilters, setShowFilters] = useState(false)

  const flatSubcategories = useMemo(
    () => categories.flatMap((cat) => cat.children || []),
    [categories]
  )

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`/products?${params.toString()}`, { scroll: false })
  }, [searchParams, router])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (sort !== 'newest') params.set('sort', sort)
      if (maxPrice < 500) params.set('maxPrice', String(maxPrice))
      params.set('limit', '100')
      const res = await fetch(`/api/products?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } finally {
      setLoading(false)
    }
  }, [activeCategory, sort, maxPrice])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const displayedProducts = products.slice(0, visibleCount)
  const hasMore = visibleCount < products.length

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => { updateParam('category', 'all'); setVisibleCount(8) }}
          className={cn(
            'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeCategory === 'all'
              ? 'bg-navy text-cream'
              : 'bg-white/5 text-silver hover:bg-white/10'
          )}
        >
          All
        </button>
        {flatSubcategories.map((cat: any) => (
          <button
            key={cat.slug}
            onClick={() => { updateParam('category', cat.slug); setVisibleCount(8) }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === cat.slug
                ? 'bg-navy text-cream'
                : 'bg-white/5 text-silver hover:bg-white/10'
            )}
          >
            {cat.name}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-silver"
          >
            <option value="newest">{t('products.sortNewest')}</option>
            <option value="price-asc">{t('products.sortPriceAsc')}</option>
            <option value="price-desc">{t('products.sortPriceDesc')}</option>
            <option value="rating">{t('products.sortRating')}</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              showFilters ? 'border-gold text-gold' : 'border-white/10 text-silver'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Price filter */}
      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mb-6 p-4 bg-white/5 rounded-xl"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-silver">{t('products.maxPrice')}</span>
            <span className="text-sm text-navy font-medium">${maxPrice}</span>
          </div>
          <input
            type="range"
            min={50}
            max={500}
            step={10}
            value={maxPrice}
            onChange={(e) => updateParam('maxPrice', e.target.value)}
            className="w-full accent-gold"
          />
          <div className="flex justify-between text-xs text-silver mt-1">
            <span>$50</span>
            <span>$500</span>
          </div>
        </motion.div>
      )}

      {/* Reset */}
      {(activeCategory !== 'all' || sort !== 'newest' || maxPrice < 500) && (
        <button
          onClick={() => { router.push('/products'); setVisibleCount(8) }}
          className="flex items-center gap-1 text-sm text-gold mb-4 hover:underline"
        >
          <X className="w-3 h-3" /> {t('products.clearFilters')}
        </button>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      )}

      {/* Grid */}
      {!loading && displayedProducts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-silver mb-4">{t('products.noMatch')}</p>
          <Button variant="outline" onClick={() => router.push('/products')}>
            {t('products.reset')}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {displayedProducts.map((product, i) => (
          <ProductCard key={product.id} product={product} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => setVisibleCount((c) => c + 8)}>
            {t('products.loadMore')}
          </Button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add src/app/products/page.tsx src/app/products/ProductsPageClient.tsx
git commit -m "feat: add /products listing page with URL-based filters"
```

---

### Task 7: Update Navigation — ProductCard, CategoryGrid, FeaturedProducts, Header

**Files:**
- Modify: `src/components/store/ProductCard.tsx`
- Modify: `src/components/store/CategoryGrid.tsx`
- Modify: `src/components/store/FeaturedProducts.tsx`
- Modify: `src/components/store/Header.tsx`

- [ ] **Update ProductCard.tsx** — Change click handler from `setProductModal(id)` to `router.push(/products/${id})`

```tsx
// Inside the component body, add:
import { useRouter } from 'next/navigation'

// Then in the component:
const router = useRouter()

// Change the card click handler:
const handleOpen = useCallback(() => {
  router.push(`/products/${product.id}`)
}, [router, product.id])

// Change the eye icon click handler:
const handleViewDetails = useCallback((e: React.MouseEvent) => {
  e.stopPropagation()
  router.push(`/products/${product.id}`)
}, [router, product.id])
```

- [ ] **Update CategoryGrid.tsx** — Change from custom event dispatch to `router.push(/products?category=slug)`

```tsx
// Add import:
import { useRouter } from 'next/navigation'

// Inside the component:
const router = useRouter()

// Replace the anchor click handler:
const handleCategoryClick = useCallback((e: React.MouseEvent, slug: string) => {
  e.preventDefault()
  router.push(`/products?category=${slug}`)
}, [router])

// In the JSX, replace the <a> with:
<button onClick={(e) => handleCategoryClick(e, cat.slug)} /* ... */>
```

- [ ] **Update FeaturedProducts.tsx** — Change "View All" and product card links to use `router.push()`

Read the file first:
Run: `Get-Content src\components\store\FeaturedProducts.tsx`

- [ ] **Update Header.tsx** — Change cart icon from `openCart()` to `router.push(/cart)`

```tsx
// In the cart icon click handler:
const router = useRouter()

// Replace openCart() with:
const handleCartClick = useCallback(() => {
  router.push('/cart')
}, [router])
```

- [ ] **Commit**

```bash
git add src/components/store/ProductCard.tsx src/components/store/CategoryGrid.tsx src/components/store/FeaturedProducts.tsx src/components/store/Header.tsx
git commit -m "refactor: update navigation from overlays to routes"
```

---

### Task 8: Clean Up Homepage Overlays

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Remove overlay lazy imports and renders from page.tsx** — Keep SearchDialog, WishlistDrawer, ExitIntentPopup (these are utility overlays). Remove ProductModal, CartDrawer, CheckoutDialog, CompareModal, CompareTray, OrderTrackingModal, ConciergeChat.

- [ ] **Commit**

```bash
git add src/app/page.tsx
git commit -m "refactor: remove overlay modal/drawer imports from homepage"
```

---

## Build & Verify

- [ ] **Build to catch all errors**

```bash
npx next build --webpack 2>&1 | Select-String -Pattern "error|Error|Compiled|✓"
```

- [ ] **Start dev server and manually test**

```bash
node node_modules\next\dist\bin\next dev -p 3000 --webpack
```

- [ ] **Test each new route:**
  - `/products` — loads with products, filters work, URL params update
  - `/products/[id]` — loads product detail, images show, add to cart works
  - `/cart` — shows cart items, quantity controls work, checkout button goes to /checkout
  - `/checkout` — checkout form works, payment selection, order submission
  - `/` — homepage no longer has overlay modals for cart/checkout/product

- [ ] **Fix any build errors found, then commit**
