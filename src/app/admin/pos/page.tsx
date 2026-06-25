'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type Product = { id: string; name: string; price: number; stock: number; imageUrl: string; sku: string }
type CartItem = { productId: string; name: string; price: number; quantity: number; imageUrl: string; stock: number }

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; type: string; value: number } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [receipt, setReceipt] = useState<{ orderId: string; total: number } | null>(null)

  useEffect(() => {
    if (search.length < 1) { setProducts([]); return }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/admin/pos/products?search=${encodeURIComponent(search)}`)
      if (res.ok) setProducts(await res.json())
    }, 200)
    return () => clearTimeout(timer)
  }, [search])

  function addToCart(product: Product) {
    if (product.stock < 1) { toast.error('Out of stock'); return }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.quantity >= product.stock) { toast.error('Not enough stock'); return prev }
        return prev.map((i) => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, imageUrl: product.imageUrl, stock: product.stock }]
    })
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) return item
      const newQty = item.quantity + delta
      if (newQty < 1) return item
      if (newQty > item.stock) { toast.error('Not enough stock'); return item }
      return { ...item, quantity: newQty }
    }).filter((item) => item.quantity > 0))
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  async function applyDiscount() {
    if (!discountCode.trim()) return
    const res = await fetch(`/api/admin/pos/validate-discount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: discountCode, subtotal }),
    })
    if (res.ok) {
      const data = await res.json()
      setAppliedDiscount({ code: discountCode, ...data })
      toast.success('Discount applied')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Invalid discount')
      setAppliedDiscount(null)
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null)
    setDiscountCode('')
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = appliedDiscount?.amount || 0
  const total = Math.max(0, subtotal - discountAmount)

  async function checkout() {
    if (cart.length === 0) return
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/admin/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })), discountCode: appliedDiscount?.code }),
      })
      if (res.ok) {
        const data = await res.json()
        setReceipt({ orderId: data.orderId, total: data.total })
        toast.success('Order completed!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Checkout failed')
      }
    } catch {
      toast.error('Checkout failed')
    }
    setCheckoutLoading(false)
  }

  function newSale() {
    setCart([])
    setDiscountCode('')
    setAppliedDiscount(null)
    setReceipt(null)
    setSearch('')
    setProducts([])
  }

  if (receipt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center bg-white p-8 rounded-xl border border-border max-w-sm">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-display font-semibold text-navy mb-2">Payment Successful</h2>
          <p className="text-muted-foreground mb-1">Order #{receipt.orderId.slice(-8).toUpperCase()}</p>
          <p className="text-2xl font-bold text-navy mb-6">${receipt.total.toFixed(2)}</p>
          <button onClick={newSale} className="w-full px-6 py-3 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">New Sale</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm"
            autoFocus
          />
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock < 1}
              className={`bg-white rounded-lg border border-border p-3 text-left hover:border-gold/50 transition-colors ${p.stock < 1 ? 'opacity-50' : ''}`}
            >
              <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                {p.imageUrl && <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />}
              </div>
              <p className="text-sm font-medium text-navy truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.sku}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold text-navy">${p.price.toFixed(2)}</span>
                <span className={`text-xs ${p.stock < 5 ? 'text-red-500' : 'text-green-600'}`}>{p.stock} left</span>
              </div>
            </button>
          ))}
          {search && products.length === 0 && <p className="text-muted-foreground text-sm col-span-2 text-center pt-4">No products found</p>}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-[380px] flex flex-col bg-white rounded-xl border border-border p-4 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-navy flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({cart.length})</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
              <div className="h-10 w-10 bg-gray-200 rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQuantity(item.productId, -1)} className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center hover:bg-gray-100"><Minus className="h-3 w-3" /></button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, 1)} className="h-6 w-6 rounded bg-white border border-border flex items-center justify-center hover:bg-gray-100"><Plus className="h-3 w-3" /></button>
              </div>
              <span className="text-sm font-bold text-navy w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          {cart.length === 0 && <p className="text-muted-foreground text-sm text-center pt-4">Cart is empty. Search and click products to add.</p>}
        </div>

        {/* Discount */}
        <div className="mb-3">
          {appliedDiscount ? (
            <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm">
              <span className="text-green-700 font-medium">Discount: -${discountAmount.toFixed(2)}</span>
              <button onClick={removeDiscount} className="text-green-500 hover:text-green-700"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="Promo or employee code" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && applyDiscount()} />
              <button onClick={applyDiscount} className="px-3 py-2 bg-gray-100 text-navy rounded-lg text-sm hover:bg-gray-200 transition-colors">Apply</button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-border pt-3 space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
          {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
          <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>

        <button
          onClick={checkout}
          disabled={cart.length === 0 || checkoutLoading}
          className="mt-3 w-full px-6 py-3 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {checkoutLoading ? 'Processing...' : `Charge $${total.toFixed(2)}`}
        </button>
      </div>
    </div>
  )
}
