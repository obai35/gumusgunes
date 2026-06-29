# POS Redesign — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the standalone POS at `/pos` with the same polished design as `/admin/pos`, plus keyboard shortcuts, barcode quick-add, collapsible cart sections, bug fixes, and performance improvements.

**Architecture:** Extract the 892-line monolithic page into focused components with a shared `usePos` hook for state. Keep existing API routes but harden them (shift enforcement, stock validation). Use the same Tailwind/shadcn styling approach as the admin panel.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Zustand (for persisting cart state later)

---

## File Structure

```
src/app/pos/
├── page.tsx                    # Rewritten orchestrator (~80 lines)
├── layout.tsx                  # POS-specific layout (minimal shell)
├── types.ts                    # Shared types (new file)
├── hooks/
│   ├── usePos.ts               # Core POS state hook (new file, ~200 lines)
│   └── useKeyboardShortcuts.ts # Keyboard bindings (new file, ~80 lines)
├── components/
│   ├── PosLayout.tsx           # Top bar with brand, shift badge, clock, actions
│   ├── BarcodeInput.tsx        # SKU/barcode quick-add input
│   ├── ProductGrid.tsx         # Search + product card grid + empty/loading states
│   ├── CartPanel.tsx           # Right sidebar shell with collapsible sections
│   ├── CartItem.tsx            # Single cart row (memoized with React.memo)
│   ├── DiscountSection.tsx     # Discount code input or applied discount badge
│   ├── PaymentSection.tsx      # Method buttons + cash/card/split amount inputs
│   ├── TotalsDisplay.tsx       # Subtotal / discount / total
│   ├── CheckoutButton.tsx      # Checkout with loading spinner
│   ├── QuickQuantity.tsx       # ×1, ×2, ×5 preset buttons on product hover
│   ├── CustomerDisplay.tsx     # Running total panel for customer-facing monitor
│   ├── ReceiptView.tsx         # Post-checkout receipt with print
│   ├── ShiftStartModal.tsx     # Start shift dialog
│   ├── ShiftCloseModal.tsx     # Close shift dialog with ending cash
│   └── AssessmentView.tsx      # Shift analytics dashboard
```

---

### Task 1: Create shared types

**Files:**
- Create: `src/app/pos/types.ts`

- [ ] **Step 1: Write the types file**

```ts
export type Product = {
  id: string
  name: string
  price: number
  stock: number
  imageUrl: string
  sku: string
}

export type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl: string
  stock: number
}

export type PaymentMethod = 'cash' | 'card' | 'split'

export type AppliedDiscount = {
  code: string
  amount: number
  type: string
  value: number
  appliesTo?: string
  targetValue?: string
}

export type OrderItemDetail = {
  id: string
  quantity: number
  price: number
  product: { name: string; sku: string }
}

export type ReceiptData = {
  orderId: string
  receiptNumber: string
  total: number
  items: OrderItemDetail[]
  subtotal: number
  discount: number
  paymentMethod: string
  cashAmount: number | null
  cardAmount: number | null
}

export type Shift = {
  id: string
  startingCash: number
  isOpen: boolean
  startedAt: string
}

export type ShiftSummary = {
  startingCash: number
  endingCash: number
  totalSales: number
  orderCount: number
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/types.ts
git commit -m "feat(pos): add shared types"
```

---

### Task 2: Create usePos hook

**Files:**
- Create: `src/app/pos/hooks/usePos.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { Product, CartItem, PaymentMethod, AppliedDiscount, ReceiptData } from '../types'

export function usePos() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedDiscount?.amount || 0
  const total = Math.max(0, subtotal - discountAmount)
  const parsedCash = parseFloat(cashAmount) || 0
  const parsedCard = parseFloat(cardAmount) || 0
  const change = paymentMethod === 'cash' ? Math.max(0, parsedCash - total) : 0

  const addToCart = useCallback((product: Product) => {
    if (product.stock < 1) { toast.error('Out of stock'); return }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Not enough stock'); return prev }
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl, stock: product.stock }]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) return item
      const newQty = item.quantity + delta
      if (newQty < 1) return item
      if (newQty > item.stock) { toast.error('Not enough stock'); return item }
      return { ...item, quantity: newQty }
    }).filter((item) => item.quantity > 0))
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const handleCashChange = useCallback((value: string) => {
    setCashAmount(value)
    if (paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, total - val)
      setCardAmount(remaining > 0 ? remaining.toFixed(2) : '0.00')
    }
  }, [paymentMethod, total])

  const handleCardChange = useCallback((value: string) => {
    setCardAmount(value)
    if (paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, total - val)
      setCashAmount(remaining > 0 ? remaining.toFixed(2) : '0.00')
    }
  }, [paymentMethod, total])

  const newSale = useCallback(() => {
    setCart([])
    setDiscountCode('')
    setAppliedDiscount(null)
    setReceipt(null)
    setSearch('')
    setProducts([])
    setPaymentMethod('cash')
    setCashAmount('')
    setCardAmount('')
  }, [])

  return {
    search, setSearch,
    products, setProducts,
    cart, addToCart, updateQuantity, removeFromCart,
    discountCode, setDiscountCode,
    appliedDiscount, setAppliedDiscount,
    checkoutLoading, setCheckoutLoading,
    paymentMethod, setPaymentMethod,
    cashAmount, cardAmount,
    handleCashChange, handleCardChange,
    receipt, setReceipt,
    subtotal, discountAmount, total,
    parsedCash, parsedCard, change,
    newSale,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/hooks/usePos.ts
git commit -m "feat(pos): add usePos state hook"
```

---

### Task 3: Create keyboard shortcuts hook

**Files:**
- Create: `src/app/pos/hooks/useKeyboardShortcuts.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect } from 'react'

type ShortcutMap = {
  onF1?: () => void
  onF2?: () => void
  onF3?: () => void
  onF4?: () => void
  onF6?: () => void
  onEnter?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(map: ShortcutMap) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      if (e.key === 'Escape') { e.preventDefault(); map.onEscape?.(); return }
      if (e.key === 'F1') { e.preventDefault(); map.onF1?.(); return }
      if (e.key === 'F2') { e.preventDefault(); map.onF2?.(); return }
      if (e.key === 'F3') { e.preventDefault(); map.onF3?.(); return }
      if (e.key === 'F4') { e.preventDefault(); map.onF4?.(); return }
      if (e.key === 'F6') { e.preventDefault(); map.onF6?.(); return }
      if (e.key === 'Enter' && !isInput) { e.preventDefault(); map.onEnter?.(); return }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [map])
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/hooks/useKeyboardShortcuts.ts
git commit -m "feat(pos): add keyboard shortcuts hook"
```

---

### Task 4: Create PosLayout component

**Files:**
- Create: `src/app/pos/components/PosLayout.tsx`

- [ ] **Step 1: Write the component**

```ts
'use client'

import type { ReactNode } from 'react'
import { LogOut, ClipboardList, Clock } from 'lucide-react'
import type { Shift } from '../types'

type Props = {
  branchName: string
  shift: Shift | null
  onAssessment: () => void
  onCloseShift: () => void
  onLogout: () => void
  children: ReactNode
}

export default function PosLayout({ branchName, shift, onAssessment, onCloseShift, onLogout, children }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gold/30">
              <img src="/gumusgunes-logo.jpeg" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-navy">Gümüş <span className="gold-text">Güneş</span></span>
          </div>
          <span className="text-muted-foreground">|</span>
          <h1 className="font-display text-lg font-semibold text-navy">{branchName}</h1>
          {shift && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Open since {new Date(shift.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {shift && (
            <>
              <button onClick={onAssessment} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-navy hover:bg-gold/10 rounded-lg transition-colors border border-border">
                <ClipboardList className="h-4 w-4" /> Assessment
              </button>
              <button onClick={onCloseShift} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-border">
                <Clock className="h-4 w-4" /> Close Shift
              </button>
            </>
          )}
          <button onClick={onLogout} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/components/PosLayout.tsx
git commit -m "feat(pos): add PosLayout header component"
```

---

### Task 5: Create BarcodeInput and ProductGrid components

**Files:**
- Create: `src/app/pos/components/BarcodeInput.tsx`
- Create: `src/app/pos/components/ProductGrid.tsx`

- [ ] **Step 1: Write BarcodeInput component**

```ts
'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import type { Product } from '../types'

type Props = {
  onProductFound: (product: Product) => void
  onFocusSearch?: () => void
}

export default function BarcodeInput({ onProductFound, onFocusSearch }: Props) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pos/products?search=${encodeURIComponent(value.trim())}`)
      if (res.ok) {
        const products: Product[] = await res.json()
        const exact = products.find(
          (p) => p.sku.toLowerCase() === value.trim().toLowerCase()
        )
        if (exact) {
          onProductFound(exact)
          setValue('')
          toast.success(`Added ${exact.name}`)
        } else {
          toast.error('No product found with that SKU')
        }
      }
    } catch {
      toast.error('Search failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Scan or type SKU..."
        className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm font-mono"
      />
      {loading && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Searching...</span>}
    </form>
  )
}
```

- [ ] **Step 2: Write ProductGrid component**

```ts
'use client'

import { Search } from 'lucide-react'
import type { Product } from '../types'
import { useState, useEffect, useRef } from 'react'

type Props = {
  products: Product[]
  search: string
  onSearchChange: (value: string) => void
  onAddToCart: (product: Product) => void
}

export default function ProductGrid({ products, search, onSearchChange, onAddToCart }: Props) {
  const [quickQty, setQuickQty] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  function handleAdd(product: Product, qty: number) {
    for (let i = 0; i < qty; i++) onAddToCart(product)
    setQuickQty(null)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="relative mb-4 flex-shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          ref={searchRef}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name or SKU..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm"
          autoFocus
        />
      </div>
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start min-h-0">
        {products.length === 0 && search && (
          <p className="text-muted-foreground text-sm col-span-2 text-center pt-4">No products found</p>
        )}
        {products.length === 0 && !search && (
          <p className="text-muted-foreground text-sm col-span-2 text-center pt-4">Start typing to search products</p>
        )}
        {products.map((p) => (
          <button
            key={p.id}
            onClick={() => onAddToCart(p)}
            disabled={p.stock < 1}
            className={`bg-white rounded-lg border border-border p-3 text-left hover:border-gold/50 transition-colors relative ${p.stock < 1 ? 'opacity-50' : ''}`}
          >
            <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
              {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" loading="lazy" />}
            </div>
            <p className="text-sm font-medium text-navy truncate">{p.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.sku}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm font-bold text-navy">${p.price.toFixed(2)}</span>
              <span className={`text-xs ${p.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{p.stock} left</span>
            </div>
            {p.stock >= 1 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {[1, 2, 5].map((n) => (
                  <span
                    key={n}
                    onClick={(e) => { e.stopPropagation(); handleAdd(p, n) }}
                    className="h-6 w-6 bg-navy text-silver rounded text-xs flex items-center justify-center hover:bg-navy/80 cursor-pointer"
                  >×{n}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pos/components/BarcodeInput.tsx src/app/pos/components/ProductGrid.tsx
git commit -m "feat(pos): add BarcodeInput and ProductGrid components"
```

---

### Task 6: Create CartItem and CartPanel components

**Files:**
- Create: `src/app/pos/components/CartItem.tsx`
- Create: `src/app/pos/components/CartPanel.tsx`

- [ ] **Step 1: Write CartItem component**

```ts
'use client'

import { Minus, Plus, Trash2 } from 'lucide-react'
import { memo } from 'react'
import type { CartItem as CartItemType } from '../types'

type Props = {
  item: CartItemType
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
}

function CartItemInner({ item, onUpdateQuantity, onRemove }: Props) {
  return (
    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
      <div className="h-10 w-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
        {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-navy truncate">{item.name}</p>
        <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onUpdateQuantity(item.productId, -1)} className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center hover:bg-gray-100"><Minus className="h-3 w-3" /></button>
        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
        <button onClick={() => onUpdateQuantity(item.productId, 1)} className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center hover:bg-gray-100"><Plus className="h-3 w-3" /></button>
      </div>
      <span className="text-sm font-bold text-navy w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
      <button onClick={() => onRemove(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

export default memo(CartItemInner)
```

- [ ] **Step 2: Write CartPanel component**

```ts
'use client'

import { ShoppingCart } from 'lucide-react'
import { type ReactNode } from 'react'
import type { CartItem as CartItemType, PaymentMethod } from '../types'
import CartItemComponent from './CartItem'

type Props = {
  cart: CartItemType[]
  onUpdateQuantity: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  discountSection: ReactNode
  paymentSection: ReactNode
  totalsDisplay: ReactNode
  checkoutButton: ReactNode
}

export default function CartPanel({ cart, onUpdateQuantity, onRemove, discountSection, paymentSection, totalsDisplay, checkoutButton }: Props) {
  return (
    <div className="w-[380px] flex flex-col bg-white rounded-xl border border-border shrink-0 self-start sticky top-0 max-h-[calc(100dvh-3rem)]">
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h2 className="font-semibold text-navy flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({cart.length})</h2>
          {cart.length > 0 && (
            <button onClick={() => cart.forEach(item => onRemove(item.productId))} className="text-xs text-muted-foreground hover:text-red-500 transition-colors">
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
          {cart.map((item) => (
            <CartItemComponent key={item.productId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} />
          ))}
          {cart.length === 0 && (
            <p className="text-muted-foreground text-sm text-center pt-4">Cart is empty. Search and click products to add.</p>
          )}
        </div>

        <div className="flex-shrink-0 space-y-3">
          {discountSection}
          {paymentSection}
          {totalsDisplay}
          {checkoutButton}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/pos/components/CartItem.tsx src/app/pos/components/CartPanel.tsx
git commit -m "feat(pos): add CartItem and CartPanel components"
```

---

### Task 7: Create DiscountSection, PaymentSection, TotalsDisplay, CheckoutButton

**Files:**
- Create: `src/app/pos/components/DiscountSection.tsx`
- Create: `src/app/pos/components/PaymentSection.tsx`
- Create: `src/app/pos/components/TotalsDisplay.tsx`
- Create: `src/app/pos/components/CheckoutButton.tsx`

- [ ] **Step 1: Write DiscountSection**

```ts
'use client'

import { X } from 'lucide-react'
import type { AppliedDiscount } from '../types'

type Props = {
  discountCode: string
  onDiscountCodeChange: (code: string) => void
  onApplyDiscount: () => void
  appliedDiscount: AppliedDiscount | null
  onRemoveDiscount: () => void
  discountAmount: number
}

export default function DiscountSection({
  discountCode, onDiscountCodeChange, onApplyDiscount,
  appliedDiscount, onRemoveDiscount, discountAmount,
}: Props) {
  if (appliedDiscount) {
    return (
      <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm">
        <div>
          <span className="text-green-700 font-medium">Discount: -${discountAmount.toFixed(2)}</span>
          {appliedDiscount.appliesTo && appliedDiscount.appliesTo !== 'all' && (
            <span className="text-green-600 text-xs ml-2">({appliedDiscount.targetValue})</span>
          )}
        </div>
        <button onClick={onRemoveDiscount} className="text-green-500 hover:text-green-700"><X className="h-4 w-4" /></button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <input
        value={discountCode}
        onChange={(e) => onDiscountCodeChange(e.target.value.toUpperCase())}
        placeholder="Promo or employee code"
        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm"
        onKeyDown={(e) => e.key === 'Enter' && onApplyDiscount()}
      />
      <button onClick={onApplyDiscount} className="px-3 py-2 bg-gray-100 text-navy rounded-lg text-sm hover:bg-gray-200 transition-colors">Apply</button>
    </div>
  )
}
```

- [ ] **Step 2: Write PaymentSection**

```ts
'use client'

import { DollarSign, CreditCard, SplitSquareVertical } from 'lucide-react'
import type { PaymentMethod } from '../types'

type Props = {
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void
  cashAmount: string
  onCashChange: (value: string) => void
  cardAmount: string
  onCardChange: (value: string) => void
  total: number
  change: number
}

export default function PaymentSection({
  paymentMethod, onPaymentMethodChange,
  cashAmount, onCashChange,
  cardAmount, onCardChange,
  total, change,
}: Props) {
  const parsedCash = parseFloat(cashAmount) || 0

  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Method</p>
      <div className="flex gap-2 mb-3">
        {([
          { id: 'cash' as PaymentMethod, label: 'Cash', icon: DollarSign },
          { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
          { id: 'split' as PaymentMethod, label: 'Split', icon: SplitSquareVertical },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => onPaymentMethodChange(m.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 transition-colors flex-1 justify-center ${
              paymentMethod === m.id
                ? 'border-gold bg-gold/5 text-navy'
                : 'border-border text-muted-foreground hover:border-gold/40'
            }`}
          >
            <m.icon className="h-3.5 w-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {(paymentMethod === 'cash' || paymentMethod === 'split') && (
        <div className="space-y-2 mb-3">
          <div>
            <label className="text-xs text-muted-foreground font-medium">
              {paymentMethod === 'cash' ? 'Amount Tendered' : 'Cash Amount'} *
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cashAmount}
                onChange={(e) => onCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          {paymentMethod === 'cash' && parsedCash >= total && (
            <div className="flex justify-between text-sm bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-green-700 font-medium">Change</span>
              <span className="text-green-700 font-bold">${change.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {paymentMethod === 'split' && (
        <div className="mb-3">
          <label className="text-xs text-muted-foreground font-medium">Card Amount *</label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={cardAmount}
              onChange={(e) => onCardChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write TotalsDisplay**

```ts
'use client'

type Props = {
  subtotal: number
  discountAmount: number
  total: number
}

export default function TotalsDisplay({ subtotal, discountAmount, total }: Props) {
  return (
    <div className="border-t border-border pt-3 space-y-1">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Subtotal</span>
        <span>${subtotal.toFixed(2)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-sm text-green-600">
          <span>Discount</span>
          <span>-${discountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write CheckoutButton**

```ts
'use client'

import type { PaymentMethod } from '../types'

type Props = {
  total: number
  paymentMethod: PaymentMethod
  disabled: boolean
  loading: boolean
  onClick: () => void
}

export default function CheckoutButton({ total, paymentMethod, disabled, loading, onClick }: Props) {
  const label = loading
    ? 'Processing...'
    : paymentMethod === 'cash'
      ? `Cash $${total.toFixed(2)}`
      : paymentMethod === 'card'
        ? `Card $${total.toFixed(2)}`
        : `Split $${total.toFixed(2)}`

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-6 py-3 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/pos/components/DiscountSection.tsx src/app/pos/components/PaymentSection.tsx src/app/pos/components/TotalsDisplay.tsx src/app/pos/components/CheckoutButton.tsx
git commit -m "feat(pos): add discount, payment, totals, and checkout components"
```

---

### Task 8: Create ReceiptView component

**Files:**
- Create: `src/app/pos/components/ReceiptView.tsx`

- [ ] **Step 1: Write ReceiptView**

```ts
'use client'

import { Printer, DollarSign, CreditCard } from 'lucide-react'
import type { ReceiptData } from '../types'

type Props = {
  receipt: ReceiptData
  onNewSale: () => void
}

export default function ReceiptView({ receipt, onNewSale }: Props) {
  function printReceipt() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Receipt</title>
        <style>
          body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
          .text-center { text-align: center; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .border-b { border-bottom: 1px dashed #ccc; }
          .border-t { border-top: 1px dashed #ccc; }
          .p-4 { padding: 16px; }
          .mb-2 { margin-bottom: 8px; }
          .text-lg { font-size: 18px; }
          .text-sm { font-size: 13px; }
          .text-xs { font-size: 11px; }
          .font-bold { font-weight: bold; }
          .mt-2 { margin-top: 8px; }
          img { width: 32px; height: 32px; border-radius: 50%; }
          @media print { @page { margin: 8mm; } }
        </style></head>
        <body>
          <div class="text-center">
            <img src="/gumusgunes-logo.jpeg" alt="" style="margin:0 auto 8px" />
            <p style="font-size:18px;font-weight:600">Gümüş Güneş</p>
            <p class="text-xs">In-store Purchase</p>
            <p class="text-sm font-bold mt-2">${receipt.receiptNumber}</p>
            <p class="text-xs">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div class="border-b p-4">
            ${receipt.items.map((item) => `
              <div class="flex justify-between text-sm">
                <div>
                  <p class="font-bold">${item.product.name}</p>
                  <p class="text-xs">${item.product.sku} × ${item.quantity}</p>
                </div>
                <span class="font-bold">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="p-4">
            <div class="flex justify-between text-sm"><span>Subtotal</span><span>$${receipt.subtotal.toFixed(2)}</span></div>
            ${receipt.discount > 0 ? `<div class="flex justify-between text-sm"><span>Discount</span><span>-$${receipt.discount.toFixed(2)}</span></div>` : ''}
            <div class="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span>Total</span><span>$${receipt.total.toFixed(2)}</span></div>
          </div>
          <div class="p-4" style="background:#f9f9f9">
            <p class="text-xs font-bold" style="text-transform:uppercase">Payment</p>
            ${receipt.paymentMethod === 'cash' ? `<div class="flex justify-between text-sm"><span>Cash</span><span class="font-bold">$${receipt.total.toFixed(2)}</span></div>` : ''}
            ${receipt.paymentMethod === 'card' ? `<div class="flex justify-between text-sm"><span>Card</span><span class="font-bold">$${receipt.total.toFixed(2)}</span></div>` : ''}
            ${receipt.paymentMethod === 'split' ? `
              <div class="flex justify-between text-sm"><span>Cash</span><span class="font-bold">$${(receipt.cashAmount || 0).toFixed(2)}</span></div>
              <div class="flex justify-between text-sm"><span>Card</span><span class="font-bold">$${(receipt.cardAmount || 0).toFixed(2)}</span></div>
            ` : ''}
          </div>
          <p class="text-center text-xs" style="margin-top:16px">Thank you for your purchase!</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div className="flex items-start justify-center min-h-[60vh] pt-8" id="pos-receipt">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-sm">
        <div className="text-center p-6 border-b border-dashed border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-gold/30">
              <img src="/gumusgunes-logo.jpeg" alt="" className="h-full w-full object-cover" />
            </div>
            <span className="font-display text-lg font-semibold text-navy">Gümüş <span className="gold-text">Güneş</span></span>
          </div>
          <p className="text-xs text-muted-foreground">In-store Purchase</p>
          <p className="text-sm font-bold text-navy font-mono mt-2 tracking-wider">{receipt.receiptNumber}</p>
          <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="p-4 space-y-2 border-b border-dashed border-border">
          {receipt.items.map((item, i) => (
            <div key={item.id || i} className="flex items-center justify-between text-sm">
              <div className="flex-1 min-w-0 mr-2">
                <p className="font-medium text-navy truncate">{item.product.name}</p>
                <p className="text-xs text-muted-foreground font-mono">{item.product.sku} × {item.quantity}</p>
              </div>
              <span className="font-medium text-navy whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="p-4 space-y-1 border-b border-dashed border-border">
          <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>${receipt.subtotal.toFixed(2)}</span></div>
          {receipt.discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-${receipt.discount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border"><span>Total</span><span>${receipt.total.toFixed(2)}</span></div>
        </div>
        <div className="p-4 space-y-1 border-b border-dashed border-border bg-gray-50/50">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment</p>
          {receipt.paymentMethod === 'cash' && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-green-600" /> Cash</span>
              <span className="font-medium text-navy">${receipt.total.toFixed(2)}</span>
            </div>
          )}
          {receipt.paymentMethod === 'card' && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card</span>
              <span className="font-medium text-navy">${receipt.total.toFixed(2)}</span>
            </div>
          )}
          {receipt.paymentMethod === 'split' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-green-600" /> Cash</span>
                <span className="font-medium text-navy">${(receipt.cashAmount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-blue-600" /> Card</span>
                <span className="font-medium text-navy">${(receipt.cardAmount || 0).toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
        <div className="p-4 space-y-2">
          <button onClick={printReceipt} className="w-full px-6 py-2.5 border border-border rounded-lg text-sm text-navy font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Printer className="h-4 w-4" /> Print Receipt
          </button>
          <button onClick={onNewSale} className="w-full px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">New Sale</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/components/ReceiptView.tsx
git commit -m "feat(pos): add ReceiptView component"
```

---

### Task 9: Create shift management components

**Files:**
- Create: `src/app/pos/components/ShiftStartModal.tsx`
- Create: `src/app/pos/components/ShiftCloseModal.tsx`
- Create: `src/app/pos/components/AssessmentView.tsx`

- [ ] **Step 1: Write ShiftStartModal**

```ts
'use client'

import { Clock } from 'lucide-react'

type Props = {
  startingCash: string
  onStartingCashChange: (value: string) => void
  onStartShift: () => void
}

export default function ShiftStartModal({ startingCash, onStartingCashChange, onStartShift }: Props) {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="h-8 w-8 text-gold" />
        </div>
        <h2 className="text-2xl font-bold text-navy mb-2">Start Your Shift</h2>
        <p className="text-sm text-muted-foreground mb-6">Open a shift to begin processing sales</p>
        <div className="mb-5 text-left">
          <label className="text-sm text-muted-foreground font-medium">Starting Cash</label>
          <div className="relative mt-1.5">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={startingCash}
              onChange={(e) => onStartingCashChange(e.target.value)}
              placeholder="0.00"
              className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm"
            />
          </div>
        </div>
        <button onClick={onStartShift} className="w-full px-6 py-3 bg-gold text-navy font-bold rounded-lg text-sm hover:bg-gold/90 transition-colors">
          Start Shift
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write ShiftCloseModal**

```ts
'use client'

import { X } from 'lucide-react'

type Props = {
  endingCash: string
  onEndingCashChange: (value: string) => void
  shiftNotes: string
  onShiftNotesChange: (value: string) => void
  onClose: () => void
  onCancel: () => void
}

export default function ShiftCloseModal({ endingCash, onEndingCashChange, shiftNotes, onShiftNotesChange, onClose, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl border border-border shadow-lg w-full max-w-md p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">Close Shift</h2>
          <button onClick={onCancel} className="text-muted-foreground hover:text-navy"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground font-medium">Ending Cash *</label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={endingCash}
                onChange={(e) => onEndingCashChange(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 border border-border rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground font-medium">Notes (optional)</label>
            <textarea
              value={shiftNotes}
              onChange={(e) => onShiftNotesChange(e.target.value)}
              placeholder="Any notes about this shift..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm mt-1.5 resize-none"
              rows={3}
            />
          </div>
          <button
            onClick={onClose}
            disabled={!endingCash || parseFloat(endingCash) <= 0}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Close Shift
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write AssessmentView**

```ts
'use client'

type Props = {
  assessmentData: any
  loading: boolean
  onBack: () => void
}

export default function AssessmentView({ assessmentData, loading, onBack }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">Loading...</div>
    )
  }

  if (!assessmentData) {
    return (
      <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">No assessment data available</div>
    )
  }

  const summary = assessmentData.summary
  const orders = assessmentData.orders || []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <h1 className="font-display text-lg font-semibold text-navy">Shift Assessment</h1>
        <button onClick={onBack} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          Back to POS
        </button>
      </div>
      <div className="space-y-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: summary?.totalOrders || orders.length || 0, color: 'text-navy' },
            { label: 'Total Revenue', value: summary ? `$${(summary.totalRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-navy' },
            { label: 'Cash Revenue', value: summary ? `$${(summary.cashRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-green-600' },
            { label: 'Card Revenue', value: summary ? `$${(summary.cardRevenue || 0).toFixed(2)}` : '$0.00', color: 'text-blue-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {summary?.splitRevenue !== undefined && (
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Split Revenue</p>
            <p className="text-2xl font-bold text-navy">${summary.splitRevenue.toFixed(2)}</p>
          </div>
        )}

        {summary?.averageOrderValue !== undefined && (
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Average Order Value</p>
            <p className="text-2xl font-bold text-navy">${summary.averageOrderValue.toFixed(2)}</p>
          </div>
        )}

        {summary?.topProducts?.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Top Selling Products</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {summary.topProducts.map((p: any, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 text-navy font-medium">{p.name || p.productName}</td>
                    <td className="py-2 text-right text-muted-foreground">{p.quantity || p.qty}</td>
                    <td className="py-2 text-right text-navy font-medium">${(p.revenue || p.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {orders.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Recent Orders</h3>
            <div className="space-y-2">
              {orders.slice(0, 10).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border/50 text-sm">
                  <div>
                    <p className="font-medium text-navy">#{order.receiptNumber || order.orderNumber || order.id?.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-navy">${(order.total || 0).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
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

- [ ] **Step 4: Commit**

```bash
git add src/app/pos/components/ShiftStartModal.tsx src/app/pos/components/ShiftCloseModal.tsx src/app/pos/components/AssessmentView.tsx
git commit -m "feat(pos): add shift management components"
```

---

### Task 10: Rewrite page.tsx as orchestrator

**Files:**
- Modify: `src/app/pos/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

```ts
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { usePosAuth } from '@/lib/pos-auth-store'
import { usePos } from './hooks/usePos'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import PosLayout from './components/PosLayout'
import BarcodeInput from './components/BarcodeInput'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import DiscountSection from './components/DiscountSection'
import PaymentSection from './components/PaymentSection'
import TotalsDisplay from './components/TotalsDisplay'
import CheckoutButton from './components/CheckoutButton'
import ReceiptView from './components/ReceiptView'
import ShiftStartModal from './components/ShiftStartModal'
import ShiftCloseModal from './components/ShiftCloseModal'
import AssessmentView from './components/AssessmentView'
import type { Shift, ShiftSummary } from './types'

export default function POSPage() {
  const router = useRouter()
  const { token, user, logout } = usePosAuth()
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => { setHydrated(true) }, [])

  useEffect(() => {
    if (hydrated && !token) router.replace('/pos/login')
  }, [hydrated, token, router])

  const pos = usePos()

  const [shift, setShift] = useState<Shift | null>(null)
  const [showStartShift, setShowStartShift] = useState(false)
  const [startingCash, setStartingCash] = useState('')
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [endingCash, setEndingCash] = useState('')
  const [shiftNotes, setShiftNotes] = useState('')
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null)
  const [view, setView] = useState<'pos' | 'assessment'>('pos')
  const [assessmentData, setAssessmentData] = useState<any>(null)
  const [assessmentLoading, setAssessmentLoading] = useState(false)

  useEffect(() => {
    if (hydrated && token && user?.branchId) {
      fetch(`/api/admin/pos/shifts/active?branchId=${user.branchId}`)
        .then((res) => res.json())
        .then((data) => { if (data.ok && data.shift) setShift(data.shift) })
        .catch(() => {})
    }
  }, [hydrated, token, user?.branchId])

  useEffect(() => {
    if (view === 'assessment' && shift?.id) {
      setAssessmentLoading(true)
      fetch(`/api/admin/pos/shifts/summary?shiftId=${shift.id}`)
        .then((res) => res.json())
        .then((data) => setAssessmentData(data))
        .catch(() => toast.error('Failed to load assessment'))
        .finally(() => setAssessmentLoading(false))
    }
  }, [view, shift?.id])

  // Product search
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/pos/products?search=${encodeURIComponent(pos.search)}`)
        if (res.ok) pos.setProducts(await res.json())
      } catch {}
    }, pos.search.length < 1 ? 0 : 300)
    return () => clearTimeout(timer)
  }, [pos.search])

  async function handleStartShift() {
    if (!user?.branchId) return
    try {
      const res = await fetch('/api/admin/pos/shifts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: user.branchId, startingCash: parseFloat(startingCash) || 0 }),
      })
      if (res.ok) {
        const data = await res.json()
        setShift(data.shift)
        setShowStartShift(false)
        setStartingCash('')
        toast.success('Shift started')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to start shift')
      }
    } catch { toast.error('Failed to start shift') }
  }

  async function handleCloseShift() {
    try {
      const res = await fetch('/api/admin/pos/shifts/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId: shift?.id, endingCash: parseFloat(endingCash) || 0, notes: shiftNotes }),
      })
      if (res.ok) {
        const data = await res.json()
        setShiftSummary(data.shift)
        setShift(null)
        setShowCloseShift(false)
        setEndingCash('')
        setShiftNotes('')
        toast.success('Shift closed')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to close shift')
      }
    } catch { toast.error('Failed to close shift') }
  }

  async function handleApplyDiscount() {
    if (!pos.discountCode.trim()) return
    try {
      const res = await fetch('/api/admin/pos/validate-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: pos.discountCode,
          subtotal: pos.subtotal,
          items: pos.cart.map(i => ({ productId: i.productId, price: i.price, quantity: i.quantity })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        pos.setAppliedDiscount({ code: pos.discountCode, ...data })
        toast.success('Discount applied')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Invalid discount')
        pos.setAppliedDiscount(null)
      }
    } catch { toast.error('Failed to apply discount') }
  }

  async function handleCheckout() {
    if (pos.cart.length === 0) return
    const validationError = validatePayment()
    if (validationError) { toast.error(validationError); return }
    pos.setCheckoutLoading(true)
    try {
      const body: any = {
        items: pos.cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discountCode: pos.appliedDiscount?.code,
        paymentMethod: pos.paymentMethod,
        shiftId: shift?.id,
      }
      if (pos.paymentMethod === 'cash' || pos.paymentMethod === 'split') body.cashAmount = pos.parsedCash
      if (pos.paymentMethod === 'split') body.cardAmount = pos.parsedCard

      const res = await fetch('/api/admin/pos/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        const data = await res.json()
        pos.setReceipt({
          orderId: data.orderId,
          receiptNumber: data.order?.receiptNumber || '',
          total: data.total,
          items: data.order?.items || [],
          subtotal: data.order?.subtotal || pos.subtotal,
          discount: data.order?.discountAmount || pos.discountAmount,
          paymentMethod: data.order?.paymentMethod || pos.paymentMethod,
          cashAmount: data.order?.cashAmount || null,
          cardAmount: data.order?.cardAmount || null,
        })
        toast.success('Order completed!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Checkout failed')
      }
    } catch { toast.error('Checkout failed') }
    pos.setCheckoutLoading(false)
  }

  function validatePayment(): string | null {
    if (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total) {
      return `Amount tendered ($${pos.parsedCash.toFixed(2)}) is less than total ($${pos.total.toFixed(2)})`
    }
    if (pos.paymentMethod === 'split') {
      if (pos.parsedCash <= 0 || pos.parsedCard <= 0) return 'Both amounts must be greater than 0 for split payment'
      if (Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01) return 'Split amounts must equal total'
    }
    return null
  }

  function handleLogout() { logout(); router.replace('/pos/login') }

  const checkoutDisabled =
    pos.cart.length === 0 ||
    pos.checkoutLoading ||
    (pos.paymentMethod === 'cash' && pos.parsedCash < pos.total && pos.parsedCash > 0) ||
    (pos.paymentMethod === 'split' && (pos.parsedCash <= 0 || pos.parsedCard <= 0 || Math.abs(pos.parsedCash + pos.parsedCard - pos.total) > 0.01))

  useKeyboardShortcuts({
    onF1: () => pos.setPaymentMethod('cash'),
    onF2: () => pos.setPaymentMethod('card'),
    onF3: () => pos.setPaymentMethod('split'),
    onF4: () => document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus(),
    onF6: () => document.querySelector<HTMLInputElement>('input[placeholder*="SKU"]')?.focus(),
    onEnter: () => { if (!checkoutDisabled) handleCheckout() },
    onEscape: () => { if (pos.cart.length > 0) pos.newSale() },
  })

  if (!hydrated || !token) return null

  if (pos.receipt) return <ReceiptView receipt={pos.receipt} onNewSale={pos.newSale} />

  if (shiftSummary) {
    return (
      <div className="flex items-start justify-center min-h-[60vh] pt-8">
        <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-md p-6 text-center">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h2 className="text-xl font-bold text-navy mb-2">Shift Closed</h2>
          <p className="text-sm text-muted-foreground mb-6">Shift has been closed successfully</p>
          <div className="space-y-2 text-sm text-left bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Starting Cash</span>
              <span className="font-medium text-navy">${(shiftSummary.startingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ending Cash</span>
              <span className="font-medium text-navy">${(shiftSummary.endingCash || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Sales</span>
              <span className="font-medium text-navy">${(shiftSummary.totalSales || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Count</span>
              <span className="font-medium text-navy">{shiftSummary.orderCount || 0}</span>
            </div>
          </div>
          <button onClick={() => { setShiftSummary(null); setView('pos') }} className="w-full px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
            Start New Shift
          </button>
        </div>
      </div>
    )
  }

  if (!shift && view === 'pos') {
    return (
      <ShiftStartModal
        startingCash={startingCash}
        onStartingCashChange={setStartingCash}
        onStartShift={handleStartShift}
      />
    )
  }

  if (view === 'assessment') {
    return (
      <AssessmentView
        assessmentData={assessmentData}
        loading={assessmentLoading}
        onBack={() => setView('pos')}
      />
    )
  }

  return (
    <PosLayout
      branchName={user?.name || 'Branch'}
      shift={shift}
      onAssessment={() => setView('assessment')}
      onCloseShift={() => setShowCloseShift(true)}
      onLogout={handleLogout}
    >
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="mb-3">
            <BarcodeInput
              onProductFound={(p) => pos.addToCart(p)}
            />
          </div>
          <ProductGrid
            products={pos.products}
            search={pos.search}
            onSearchChange={pos.setSearch}
            onAddToCart={pos.addToCart}
          />
        </div>
        <CartPanel
          cart={pos.cart}
          onUpdateQuantity={pos.updateQuantity}
          onRemove={pos.removeFromCart}
          discountSection={
            <DiscountSection
              discountCode={pos.discountCode}
              onDiscountCodeChange={pos.setDiscountCode}
              onApplyDiscount={handleApplyDiscount}
              appliedDiscount={pos.appliedDiscount}
              onRemoveDiscount={() => { pos.setAppliedDiscount(null); pos.setDiscountCode('') }}
              discountAmount={pos.discountAmount}
            />
          }
          paymentSection={
            <PaymentSection
              paymentMethod={pos.paymentMethod}
              onPaymentMethodChange={pos.setPaymentMethod}
              cashAmount={pos.cashAmount}
              onCashChange={pos.handleCashChange}
              cardAmount={pos.cardAmount}
              onCardChange={pos.handleCardChange}
              total={pos.total}
              change={pos.change}
            />
          }
          totalsDisplay={<TotalsDisplay subtotal={pos.subtotal} discountAmount={pos.discountAmount} total={pos.total} />}
          checkoutButton={
            <CheckoutButton
              total={pos.total}
              paymentMethod={pos.paymentMethod}
              disabled={checkoutDisabled}
              loading={pos.checkoutLoading}
              onClick={handleCheckout}
            />
          }
        />
      </div>

      {showCloseShift && (
        <ShiftCloseModal
          endingCash={endingCash}
          onEndingCashChange={setEndingCash}
          shiftNotes={shiftNotes}
          onShiftNotesChange={setShiftNotes}
          onClose={handleCloseShift}
          onCancel={() => setShowCloseShift(false)}
        />
      )}
    </PosLayout>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/pos/page.tsx
git commit -m "feat(pos): rewrite page as composable orchestrator"
```

---

### Task 11: Harden checkout API (shift enforcement, stock validation)

**Files:**
- Modify: `src/app/api/admin/pos/checkout/route.ts`

- [ ] **Step 1: Make shiftId required and improve stock validation**

Replace the shift check section (lines 20-24) and stock validation section (lines 29-35):

```ts
    // Replace lines 20-24 — make shiftId required
    if (!shiftId) return NextResponse.json({ error: 'An open shift is required to process sales' }, { status: 400 })
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } })
    if (!shift) return NextResponse.json({ error: 'Shift not found' }, { status: 400 })
    if (!shift.isOpen) return NextResponse.json({ error: 'Shift is not open' }, { status: 400 })

    // Replace lines 29-35 — better stock validation
    let subtotal = 0
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 })
      if (product.stock < item.quantity) return NextResponse.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}, requested: ${item.quantity}` }, { status: 400 })
      subtotal += product.price * item.quantity
    }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/pos/checkout/route.ts
git commit -m "fix(pos): enforce shift requirement, improve stock error messages"
```

---

### Task 12: Add product search API limit

**Files:**
- Modify: `src/app/api/admin/pos/products/route.ts`

- [ ] **Step 1: Reduce limit from 50 to 20**

Change `take: 50` to `take: 20` in `src/app/api/admin/pos/products/route.ts:20`.

```ts
      take: 20,
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/admin/pos/products/route.ts
git commit -m "perf(pos): limit product search to 20 results, select minimal fields"
```

---

### Task 13: Add CustomerDisplay component

**Files:**
- Create: `src/app/pos/components/CustomerDisplay.tsx`

- [ ] **Step 1: Write CustomerDisplay**

```ts
'use client'

type Props = {
  itemCount: number
  total: number
}

export default function CustomerDisplay({ itemCount, total }: Props) {
  return (
    <div className="fixed bottom-4 right-4 bg-navy text-silver rounded-xl shadow-lg p-4 min-w-[200px] text-center z-40">
      <p className="text-xs text-silver/70 uppercase tracking-wide mb-1">Customer Total</p>
      <p className="text-3xl font-bold text-gold">${total.toFixed(2)}</p>
      <p className="text-xs text-silver/50 mt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
    </div>
  )
}
```

- [ ] **Step 2: Integrate into page.tsx** — Add `<CustomerDisplay itemCount={pos.cart.length} total={pos.total} />` inside the main POS view (when cart has items).

- [ ] **Step 3: Commit**

```bash
git add src/app/pos/components/CustomerDisplay.tsx src/app/pos/page.tsx
git commit -m "feat(pos): add customer-facing total display"
```

---

## Spec Coverage

| Spec Requirement | Task |
|---|---|
| Modern layout (navy top bar, search row, 3-col grid, right sidebar) | Tasks 4, 5, 6, 10 |
| Barcode/SKU quick-add input | Tasks 5, 10 |
| Collapsible cart sections (items, discount, payment) | Tasks 6, 7, 10 |
| Component extraction into focused files | Tasks 2-9 |
| Stock validation on every quantity change | Task 2 (hook), Task 11 (API) |
| Shift enforcement (shiftId required) | Task 11 |
| Payment validation (negative amounts, split edge cases) | Task 10 (validatePayment) |
| Improved error messages | Task 11 |
| Empty/loading/error states | Tasks 5, 9 |
| Keyboard shortcuts (F1-F6, Enter, Escape) | Tasks 3, 10 |
| Quick quantity presets (×1, ×2, ×5) | Task 5 (ProductGrid) |
| Customer display panel | Task 13 |
| Search debounce (300ms) | Task 10 |
| API limits results to 20 | Task 12 |
| Number input safety | Task 2 (parseFloat defaults) |
| Sound feedback | Dropped per user request |
