'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X, DollarSign, CreditCard, SplitSquareVertical, Printer } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

type Product = { id: string; name: string; price: number; stock: number; imageUrl: string; sku: string }
type CartItem = { productId: string; name: string; price: number; quantity: number; imageUrl: string; stock: number }
type PaymentMethod = 'cash' | 'card' | 'split'
type OrderItemDetail = { id: string; quantity: number; price: number; product: { name: string; sku: string } }

export default function POSPage() {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [selectedBranchId, setSelectedBranchId] = useState('')
  const [shift, setShift] = useState<any>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number; type: string; value: number; appliesTo?: string; targetValue?: string } | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')

  useEffect(() => {
    fetch('/api/admin/branches').then((r) => r.json()).then((data) => setBranches(data.branches || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedBranchId) { setShift(null); return }
    fetch(`/api/admin/pos/shifts/active?branchId=${selectedBranchId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.shift) { setShift(data.shift) }
        else {
          fetch('/api/admin/pos/shifts/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ branchId: selectedBranchId, startingCash: 0 }),
          }).then((r) => r.json()).then((data2) => { if (data2.shift) setShift(data2.shift) })
        }
      })
      .catch(() => {})
  }, [selectedBranchId])
  const [receipt, setReceipt] = useState<{ orderId: string; receiptNumber: string; total: number; items: OrderItemDetail[]; subtotal: number; discount: number; paymentMethod: string; cashAmount: number | null; cardAmount: number | null } | null>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ search })
      if (selectedBranchId) params.set('branchId', selectedBranchId)
      const res = await fetch(`/api/admin/pos/products?${params}`)
      if (res.ok) setProducts(await res.json())
    }, search.length < 1 ? 0 : 200)
    return () => clearTimeout(timer)
  }, [search, selectedBranchId])

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
      body: JSON.stringify({ code: discountCode, subtotal, items: cart.map(i => ({ productId: i.productId, price: i.price, quantity: i.quantity })) }),
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
  const parsedCash = parseFloat(cashAmount) || 0
  const parsedCard = parseFloat(cardAmount) || 0
  const change = paymentMethod === 'cash' ? Math.max(0, parsedCash - total) : 0

  function validatePayment(): string | null {
    if (paymentMethod === 'cash') {
      if (parsedCash < total) return `Amount tendered ($${parsedCash.toFixed(2)}) is less than total ($${total.toFixed(2)})`
    }
    if (paymentMethod === 'split') {
      if (parsedCash <= 0 || parsedCard <= 0) return 'Both cash and card amounts must be greater than 0 for split payment'
    }
    return null
  }

  function handleCashChange(value: string) {
    setCashAmount(value)
    if (paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, total - val)
      setCardAmount(remaining > 0 ? remaining.toFixed(2) : '0.00')
    }
  }

  function handleCardChange(value: string) {
    setCardAmount(value)
    if (paymentMethod === 'split') {
      const val = parseFloat(value) || 0
      const remaining = Math.max(0, total - val)
      setCashAmount(remaining > 0 ? remaining.toFixed(2) : '0.00')
    }
  }

  async function checkout() {
    if (cart.length === 0) return
    const validationError = validatePayment()
    if (validationError) { toast.error(validationError); return }
    setCheckoutLoading(true)
    try {
      if (!shift) { toast.error('No active shift. Select a branch first.'); setCheckoutLoading(false); return }
      const body: any = {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        discountCode: appliedDiscount?.code,
        paymentMethod,
        shiftId: shift.id,
      }
      if (paymentMethod === 'cash' || paymentMethod === 'split') body.cashAmount = parsedCash
      if (paymentMethod === 'split') body.cardAmount = parsedCard

      const res = await fetch('/api/admin/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        setReceipt({
          orderId: data.orderId,
          receiptNumber: data.order?.receiptNumber || '',
          total: data.total,
          items: data.order?.items || [],
          subtotal: data.order?.subtotal || subtotal,
          discount: data.order?.discountAmount || discountAmount,
          paymentMethod: data.order?.paymentMethod || paymentMethod,
          cashAmount: data.order?.cashAmount || null,
          cardAmount: data.order?.cardAmount || null,
        })
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
    setPaymentMethod('cash')
    setCashAmount('')
    setCardAmount('')
  }

  function printReceipt() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { font-family: monospace; padding: 20px; max-width: 320px; margin: 0 auto; }
            .text-center { text-align: center; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .border-b { border-bottom: 1px dashed #ccc; }
            .border-t { border-top: 1px dashed #ccc; }
            .p-4 { padding: 16px; }
            .p-6 { padding: 24px; }
            .mb-2 { margin-bottom: 8px; }
            .mt-2 { margin-top: 8px; }
            .text-lg { font-size: 18px; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .font-bold { font-weight: bold; }
            .font-mono { font-family: monospace; }
            .tracking-wider { letter-spacing: 1px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            img { width: 32px; height: 32px; border-radius: 50%; }
            .items-center { align-items: center; }
            .gap-2 { gap: 8px; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .min-w-0 { min-width: 0; }
            .flex-1 { flex: 1; }
            .text-gray-500 { color: #888; }
            .text-green-600 { color: #16a34a; }
            .text-blue-600 { color: #2563eb; }
            @media print { @page { margin: 8mm; } }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px">
              <img src="/gumusgunes-logo.jpeg" alt="" />
              <span style="font-size:18px;font-weight:600">Gümüş Güneş</span>
            </div>
            <p class="text-xs text-gray-500">In-store Purchase</p>
            <p class="text-sm font-bold font-mono mt-2 tracking-wider">${receipt.receiptNumber}</p>
            <p class="text-xs text-gray-500">${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div class="border-b p-4" style="border-style:dashed">
            ${receipt.items.map((item: any) => `
              <div class="flex justify-between text-sm">
                <div class="flex-1 min-w-0" style="margin-right:8px">
                  <p class="font-bold truncate">${item.product.name}</p>
                  <p class="text-xs text-gray-500 font-mono">${item.product.sku} × ${item.quantity}</p>
                </div>
                <span class="font-bold">$${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          <div class="p-4" style="border-bottom:1px dashed #ccc">
            <div class="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>$${receipt.subtotal.toFixed(2)}</span>
            </div>
            ${receipt.discount > 0 ? `
              <div class="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-$${receipt.discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="flex justify-between text-lg font-bold" style="padding-top:8px;border-top:1px dashed #ccc;margin-top:8px">
              <span>Total</span>
              <span>$${receipt.total.toFixed(2)}</span>
            </div>
          </div>
          <div class="p-4" style="border-bottom:1px dashed #ccc;background:#f9f9f9">
            <p class="text-xs font-bold text-gray-500" style="text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Payment</p>
            ${receipt.paymentMethod === 'cash' ? `
              <div class="flex justify-between text-sm">
                <span>Cash</span>
                <span class="font-bold">$${receipt.total.toFixed(2)}</span>
              </div>
            ` : ''}
            ${receipt.paymentMethod === 'card' ? `
              <div class="flex justify-between text-sm">
                <span>Card</span>
                <span class="font-bold">$${receipt.total.toFixed(2)}</span>
              </div>
            ` : ''}
            ${receipt.paymentMethod === 'split' ? `
              <div class="flex justify-between text-sm">
                <span>Cash</span>
                <span class="font-bold">$${(receipt.cashAmount || 0).toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span>Card</span>
                <span class="font-bold">$${(receipt.cardAmount || 0).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
          <p class="text-center text-xs text-gray-500" style="margin-top:16px">Thank you for your purchase!</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (receipt) {
    return (
      <div className="flex items-start justify-center min-h-[60vh] pt-8" id="pos-receipt">
        <div className="bg-white rounded-xl border border-border shadow-sm w-full max-w-sm">
          {/* Receipt header */}
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

          {/* Line items */}
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

          {/* Totals */}
          <div className="p-4 space-y-1 border-b border-dashed border-border">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-${receipt.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border">
              <span>Total</span>
              <span>${receipt.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment breakdown */}
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

          {/* Actions */}
          <div className="p-4 space-y-2">
            <button onClick={printReceipt} className="w-full px-6 py-2.5 border border-border rounded-lg text-sm text-navy font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Printer className="h-4 w-4" /> Print Receipt
            </button>
            <button onClick={newSale} className="w-full px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">New Sale</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-6">
      {/* Products Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex gap-2 mb-4 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm"
              autoFocus
            />
          </div>
          <select
            value={selectedBranchId}
            onChange={(e) => setSelectedBranchId(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-border text-sm bg-white min-w-[160px]"
          >
            <option value="">All Warehouse Stock</option>
            {branches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 content-start min-h-0">
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

      {/* Cart Panel — sticky to right side, always visible */}
      <div className="w-[320px] min-w-[320px] flex flex-col bg-white rounded-xl border border-border shrink-0 self-start sticky top-0 max-h-[calc(100dvh-3rem)]">
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between mb-3 flex-shrink-0">
            <h2 className="font-semibold text-navy flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Cart ({cart.length})</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-0">
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

          <div className="flex-shrink-0 space-y-3">
            {/* Discount */}
            {appliedDiscount ? (
              <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg text-sm">
                <div>
                  <span className="text-green-700 font-medium">Discount: -${discountAmount.toFixed(2)}</span>
                  {appliedDiscount.appliesTo && appliedDiscount.appliesTo !== 'all' && (
                    <span className="text-green-600 text-xs ml-2">({appliedDiscount.targetValue})</span>
                  )}
                </div>
                <button onClick={removeDiscount} className="text-green-500 hover:text-green-700"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} placeholder="Promo or employee code" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm" onKeyDown={(e) => e.key === 'Enter' && applyDiscount()} />
                <button onClick={applyDiscount} className="px-3 py-2 bg-gray-100 text-navy rounded-lg text-sm hover:bg-gray-200 transition-colors">Apply</button>
              </div>
            )}

            {/* Payment Method */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Payment Method</p>
              <div className="flex gap-2">
                {[
                  { id: 'cash' as PaymentMethod, label: 'Cash', icon: DollarSign },
                  { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard },
                  { id: 'split' as PaymentMethod, label: 'Split', icon: SplitSquareVertical },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
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
            </div>

            {/* Cash / Split Amount Inputs */}
            {(paymentMethod === 'cash' || paymentMethod === 'split') && (
              <div className="space-y-2">
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
                      onChange={(e) => handleCashChange(e.target.value)}
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
              <div>
                <label className="text-xs text-muted-foreground font-medium">Card Amount *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => handleCardChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              {discountAmount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-${discountAmount.toFixed(2)}</span></div>}
              <div className="flex justify-between text-lg font-bold text-navy pt-1 border-t border-border"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>

            <button
              onClick={checkout}
              disabled={cart.length === 0 || checkoutLoading || (paymentMethod === 'cash' && parsedCash < total && parsedCash > 0) || (paymentMethod === 'split' && (parsedCash <= 0 || parsedCard <= 0 || Math.abs(parsedCash + parsedCard - total) > 0.01))}
              className="w-full px-6 py-3 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {checkoutLoading ? 'Processing...' : paymentMethod === 'cash' ? `Cash $${total.toFixed(2)}` : paymentMethod === 'card' ? `Card $${total.toFixed(2)}` : `Split $${total.toFixed(2)}`}
            </button>
          </div>{/* end bottom section */}
        </div>{/* end inner wrapper */}
      </div>{/* end cart panel */}
    </div>
  )
}
