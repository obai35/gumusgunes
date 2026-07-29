import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { toast } from 'sonner'
import type { Product, CartItem, PaymentMethod, AppliedDiscount, ReceiptData, HeldOrder } from '../types'

type Customer = { id: string; name: string; email: string; phone: string | null } | null

type PosState = {
  search: string
  products: Product[]
  totalProducts: number
  currentPage: number
  totalPages: number
  isLoadingProducts: boolean
  cart: CartItem[]
  discountCode: string
  appliedDiscount: AppliedDiscount | null
  checkoutLoading: boolean
  paymentMethod: PaymentMethod
  cashAmount: string
  cardAmount: string
  receipt: ReceiptData | null
  heldOrders: HeldOrder[]
  customer: Customer
  customerSearch: string
  orderNotes: string
  taxRate: number

  setSearch: (search: string) => void
  setProductPage: (products: Product[], total: number, page: number, totalPages: number, append?: boolean) => void
  setLoadingProducts: (loading: boolean) => void
  addToCart: (product: Product) => void
  updateQuantity: (productId: string, delta: number) => void
  removeFromCart: (productId: string) => void
  setItemDiscount: (productId: string, discount: number) => void
  setDiscountCode: (code: string) => void
  setAppliedDiscount: (discount: AppliedDiscount | null) => void
  setCheckoutLoading: (loading: boolean) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setCashAmount: (amount: string) => void
  setCardAmount: (amount: string) => void
  handleCashChange: (value: string) => void
  handleCardChange: (value: string) => void
  setReceipt: (receipt: ReceiptData | null) => void
  holdOrder: (label?: string) => void
  recallOrder: (held: HeldOrder) => void
  removeHeldOrder: (id: string) => void
  newSale: () => void
  setCustomer: (customer: Customer) => void
  setCustomerSearch: (search: string) => void
  setOrderNotes: (notes: string) => void
  setTaxRate: (rate: number) => void

  subtotal: () => number
  itemDiscountTotal: () => number
  discountAmount: () => number
  taxableAmount: () => number
  taxAmount: () => number
  total: () => number
  parsedCash: () => number
  parsedCard: () => number
  change: () => number
}

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
  search: '',
  products: [],
  totalProducts: 0,
  currentPage: 1,
  totalPages: 0,
  isLoadingProducts: false,
  cart: [],
  discountCode: '',
  appliedDiscount: null,
  checkoutLoading: false,
  paymentMethod: 'cash',
  cashAmount: '',
  cardAmount: '',
  receipt: null,
  heldOrders: [],
  customer: null,
  customerSearch: '',
  orderNotes: '',
  taxRate: 0,

  setSearch: (search) => set({ search }),
  setProductPage: (products, total, page, totalPages, append) => {
    if (append) {
      set((state) => ({
        products: [...state.products, ...products],
        totalProducts: total,
        currentPage: page,
        totalPages,
      }))
    } else {
      set({ products, totalProducts: total, currentPage: page, totalPages })
    }
  },
  setLoadingProducts: (loading) => set({ isLoadingProducts: loading }),

  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Not enough stock')
          return state
        }
        return {
          cart: state.cart.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        }
      }
      if (product.stock < 1) {
        toast.error('Out of stock')
        return state
      }
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            imageUrl: product.imageUrl,
            stock: product.stock,
          },
        ],
      }
    })
  },

  updateQuantity: (productId, delta) => {
    set((state) => {
      const item = state.cart.find((i) => i.productId === productId)
      if (!item) return state
      const newQty = item.quantity + delta
      if (newQty < 1) return { cart: state.cart.filter((i) => i.productId !== productId) }
      if (newQty > item.stock) {
        toast.error('Not enough stock')
        return state
      }
      return {
        cart: state.cart.map((i) =>
          i.productId === productId ? { ...i, quantity: newQty } : i
        ),
      }
    })
  },

  removeFromCart: (productId) => {
    set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) }))
  },

  setItemDiscount: (productId, discount) => {
    set((state) => ({
      cart: state.cart.map((i) =>
        i.productId === productId ? { ...i, discount } : i
      ),
    }))
  },

  setDiscountCode: (code) => set({ discountCode: code }),
  setAppliedDiscount: (discount) => set({ appliedDiscount: discount }),
  setCheckoutLoading: (loading) => set({ checkoutLoading: loading }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setCashAmount: (amount) => set({ cashAmount: amount }),
  setCardAmount: (amount) => set({ cardAmount: amount }),

  handleCashChange: (value) => {
    const state = get()
    set({ cashAmount: value })
    if (state.paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, state.total() - val)
      set({ cardAmount: remaining > 0 ? remaining.toFixed(2) : '0.00' })
    }
  },

  handleCardChange: (value) => {
    const state = get()
    set({ cardAmount: value })
    if (state.paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, state.total() - val)
      set({ cashAmount: remaining > 0 ? remaining.toFixed(2) : '0.00' })
    }
  },

  setReceipt: (receipt) => set({ receipt }),

  holdOrder: (label) => {
    const state = get()
    if (state.cart.length === 0) return
    const held: HeldOrder = {
      id: Date.now().toString(36),
      label: label || `Order #${state.heldOrders.length + 1}`,
      items: JSON.parse(JSON.stringify(state.cart)),
      heldAt: new Date().toISOString(),
    }
    set({
      heldOrders: [...state.heldOrders, held],
      cart: [],
      discountCode: '',
      appliedDiscount: null,
      cashAmount: '',
      cardAmount: '',
    })
    toast.success('Order held')
  },

  recallOrder: (held) => {
    set((state) => ({
      cart: held.items,
      heldOrders: state.heldOrders.filter((h) => h.id !== held.id),
    }))
    toast.success('Order recalled')
  },

  removeHeldOrder: (id) => {
    set((state) => ({ heldOrders: state.heldOrders.filter((h) => h.id !== id) }))
  },

  newSale: () => {
    set({
      cart: [],
      discountCode: '',
      appliedDiscount: null,
      receipt: null,
      search: '',
      products: [],
      totalProducts: 0,
      currentPage: 1,
      totalPages: 0,
      paymentMethod: 'cash',
      cashAmount: '',
      cardAmount: '',
      customer: null,
      customerSearch: '',
      orderNotes: '',
    })
  },

  setCustomer: (customer) => set({ customer }),
  setCustomerSearch: (search) => set({ customerSearch: search }),
  setOrderNotes: (notes) => set({ orderNotes: notes }),
  setTaxRate: (rate) => set({ taxRate: rate }),

  subtotal: () => get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  itemDiscountTotal: () => get().cart.reduce((sum, item) => sum + (item.discount || 0), 0),
  discountAmount: () => {
    const state = get()
    return (state.appliedDiscount?.amount || 0) + state.itemDiscountTotal()
  },
  taxableAmount: () => {
    const state = get()
    return Math.max(0, state.subtotal() - state.itemDiscountTotal())
  },
  taxAmount: () => {
    const state = get()
    return state.taxableAmount() * (state.taxRate / 100)
  },
  total: () => {
    const state = get()
    return Math.max(0, state.subtotal() - state.discountAmount() + state.taxAmount())
  },
  parsedCash: () => parseFloat(get().cashAmount) || 0,
  parsedCard: () => parseFloat(get().cardAmount) || 0,
  change: () => {
    const state = get()
    return state.paymentMethod === 'cash' ? Math.max(0, state.parsedCash() - state.total()) : 0
  },
}),
    {
      name: 'gg_pos',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        heldOrders: state.heldOrders,
        customer: state.customer,
        taxRate: state.taxRate,
        orderNotes: state.orderNotes,
      }),
    }
  )
)
