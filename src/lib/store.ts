'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Product, CartItem } from '@/lib/types'

type CartState = {
  items: CartItem[]
  isOpen: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  subtotal: () => number
  count: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, quantity = 1) => {
        const items = get().items
        const existing = items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                : i
            ),
            isOpen: true,
          })
        } else {
          set({ items: [...items, { product, quantity: Math.min(quantity, product.stock) }], isOpen: true })
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.product.id !== productId) }),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.product.id !== productId) })
          return
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId
              ? { ...i, quantity: Math.min(quantity, i.product.stock) }
              : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'gg_cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
)

type UIState = {
  productModalId: string | null
  searchOpen: boolean
  wishlistOpen: boolean
  checkoutOpen: boolean
  mobileMenuOpen: boolean
  setProductModal: (id: string | null) => void
  setSearchOpen: (open: boolean) => void
  setWishlistOpen: (open: boolean) => void
  setCheckoutOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
}

export const useUI = create<UIState>((set) => ({
  productModalId: null,
  searchOpen: false,
  wishlistOpen: false,
  checkoutOpen: false,
  mobileMenuOpen: false,
  setProductModal: (id) => set({ productModalId: id }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setWishlistOpen: (open) => set({ wishlistOpen: open }),
  setCheckoutOpen: (open) => set({ checkoutOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}))

type WishlistState = {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids
        if (ids.includes(id)) {
          set({ ids: ids.filter((x) => x !== id) })
        } else {
          set({ ids: [...ids, id] })
        }
      },
      has: (id) => get().ids.includes(id),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'gg_wishlist',
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Recently viewed products (max 8, most recent first, no duplicates)
type RecentlyViewedState = {
  ids: string[]
  add: (id: string) => void
  clear: () => void
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => {
        const ids = get().ids.filter((x) => x !== id)
        set({ ids: [id, ...ids].slice(0, 8) })
      },
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'gg_recently_viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
