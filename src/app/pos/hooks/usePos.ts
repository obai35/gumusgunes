import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import type { Product, CartItem, PaymentMethod, AppliedDiscount, ReceiptData, HeldOrder } from '../types'

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
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([])
  const [customer, setCustomer] = useState<{ id: string; name: string; email: string; phone: string | null } | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [taxRate, setTaxRate] = useState(0)

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart])
  const itemDiscountTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.discount || 0), 0), [cart])
  const discountAmount = (appliedDiscount?.amount || 0) + itemDiscountTotal
  const taxableAmount = useMemo(() => Math.max(0, subtotal - itemDiscountTotal), [subtotal, itemDiscountTotal])
  const taxAmount = useMemo(() => taxableAmount * (taxRate / 100), [taxableAmount, taxRate])
  const total = useMemo(() => Math.max(0, subtotal - discountAmount + taxAmount), [subtotal, discountAmount, taxAmount])
  const parsedCash = useMemo(() => parseFloat(cashAmount) || 0, [cashAmount])
  const parsedCard = useMemo(() => parseFloat(cardAmount) || 0, [cardAmount])
  const change = useMemo(() => paymentMethod === 'cash' ? Math.max(0, parsedCash - total) : 0, [paymentMethod, parsedCash, total])

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

  const setItemDiscount = useCallback((productId: string, discount: number) => {
    setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, discount } : i))
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

  const holdOrder = useCallback((label?: string) => {
    if (cart.length === 0) return
    const held: HeldOrder = {
      id: Date.now().toString(36),
      label: label || `Order #${heldOrders.length + 1}`,
      items: JSON.parse(JSON.stringify(cart)),
      heldAt: new Date().toISOString(),
    }
    setHeldOrders((prev) => [...prev, held])
    setCart([])
    setDiscountCode('')
    setAppliedDiscount(null)
    setCashAmount('')
    setCardAmount('')
    toast.success('Order held')
  }, [cart, heldOrders])

  const recallOrder = useCallback((held: HeldOrder) => {
    setCart(held.items)
    setHeldOrders((prev) => prev.filter((h) => h.id !== held.id))
    toast.success('Order recalled')
  }, [])

  const removeHeldOrder = useCallback((id: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== id))
  }, [])

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
    setCustomer(null)
    setCustomerSearch('')
    setOrderNotes('')
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
    subtotal, discountAmount, total, itemDiscountTotal, taxAmount, taxRate, setTaxRate,
    parsedCash, parsedCard, change,
    newSale,
    setItemDiscount,
    heldOrders, holdOrder, recallOrder, removeHeldOrder,
    customer, setCustomer,
    customerSearch, setCustomerSearch,
    orderNotes, setOrderNotes,
  }
}
