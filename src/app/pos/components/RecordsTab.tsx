'use client'

import { posFetch } from '@/lib/pos-client-fetch'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Search as SearchIcon } from 'lucide-react'

type Product = { id: string; name: string; sku: string; price: number; stock: number }
type Supplier = { id: string; name: string; phone?: string; email?: string }

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'split', label: 'Split' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'instapay', label: 'InstaPay' },
  { value: 'wallet', label: 'Wallet' },
]

function ManualOrderForm({ shiftId }: { shiftId: string }) {
  const [items, setItems] = useState<{ productId: string; name: string; quantity: number; price: number }[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [cardAmount, setCardAmount] = useState('')
  const [fullName, setFullName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!productSearch || productSearch.length < 2) { setProducts([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await posFetch(`/api/admin/pos/products?search=${encodeURIComponent(productSearch)}`)
        if (res.ok) setProducts(await res.json())
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [productSearch])

  function addItem(product: Product) {
    if (items.find((i) => i.productId === product.id)) {
      toast.info('Item already added')
      return
    }
    setItems([...items, { productId: product.id, name: product.name, quantity: 1, price: product.price }])
    setProductSearch('')
    setProducts([])
  }

  function removeItem(productId: string) {
    setItems(items.filter((i) => i.productId !== productId))
  }

  function updateItem(productId: string, field: 'quantity' | 'price', value: number) {
    setItems(items.map((i) => (i.productId === productId ? { ...i, [field]: value } : i)))
  }

  const totalAmount = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  async function handleSubmit() {
    if (items.length === 0) { toast.error('Add at least one item'); return }

    const body: any = {
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      paymentMethod,
      shiftId,
      notes: notes || undefined,
      fullName: fullName || undefined,
    }

    if (paymentMethod === 'split') {
      body.cashAmount = parseFloat(cashAmount) || 0
      body.cardAmount = parseFloat(cardAmount) || 0
    }

    setSubmitting(true)
    try {
      const res = await posFetch('/api/admin/pos/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Order created')
        setItems([])
        setFullName('')
        setNotes('')
        setCashAmount('')
        setCardAmount('')
        setPaymentMethod('cash')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create order')
      }
    } catch {
      toast.error('Failed to create order')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
        <input
          type="text"
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          placeholder="Search products to add..."
          className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
        />
        {products.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1a2e] border border-white/10 rounded-lg shadow-2xl z-10 max-h-48 overflow-y-auto">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gold/10 text-sm text-left"
              >
                <span className="font-medium text-silver-soft">{p.name}</span>
                <span className="text-white/40">E£{p.price.toFixed(2)} ({p.stock} left)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="pos-glass rounded-xl p-3 space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-2">
              <span className="flex-1 text-sm font-medium text-silver-soft truncate">{item.name}</span>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(item.productId, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-center text-silver-soft"
              />
              <input
                type="number"
                step="0.01"
                min={0}
                value={item.price}
                onChange={(e) => updateItem(item.productId, 'price', parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-right text-silver-soft"
              />
              <span className="text-sm font-medium text-gold w-20 text-right">E£{(item.quantity * item.price).toFixed(2)}</span>
              <button onClick={() => removeItem(item.productId)} className="p-1 text-white/40 hover:text-red-400">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1">Customer Name (optional)</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Walk-in Customer"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm.value} value={pm.value}>{pm.label}</option>
            ))}
          </select>
        </div>
      </div>

      {paymentMethod === 'split' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-white/40 block mb-1">Cash Amount</label>
            <input
              type="number"
              step="0.01"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 block mb-1">Card Amount</label>
            <input
              type="number"
              step="0.01"
              value={cardAmount}
              onChange={(e) => setCardAmount(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
            />
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-white/40 block mb-1">Notes (optional)</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes..."
          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-lg font-bold text-gold">Total: E£{totalAmount.toFixed(2)}</span>
        <button
          onClick={handleSubmit}
          disabled={submitting || items.length === 0}
          className="px-6 py-2 bg-gradient-to-r from-gold/90 to-gold text-navy-deep rounded-lg text-sm font-bold hover:from-gold hover:to-gold/90 disabled:opacity-40 transition-all shadow-lg shadow-gold/20"
        >
          {submitting ? 'Creating...' : 'Create Order'}
        </button>
      </div>
    </div>
  )
}

function ExpenseForm({ shiftId }: { shiftId: string }) {
  const [supplierSearch, setSupplierSearch] = useState('')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [newSupplierPhone, setNewSupplierPhone] = useState('')
  const [newSupplierEmail, setNewSupplierEmail] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!supplierSearch || supplierSearch.length < 1) { setSuppliers([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await posFetch(`/api/admin/pos/suppliers?search=${encodeURIComponent(supplierSearch)}`)
        if (res.ok) setSuppliers(await res.json())
      } catch {}
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])

  async function handleCreateSupplier() {
    if (!newSupplierName.trim()) return
    try {
      const res = await posFetch('/api/admin/pos/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSupplierName, phone: newSupplierPhone || undefined, email: newSupplierEmail || undefined }),
      })
      if (res.ok) {
        const supplier = await res.json()
        setSelectedSupplier(supplier)
        setShowNewSupplier(false)
        setNewSupplierName('')
        setNewSupplierPhone('')
        setNewSupplierEmail('')
        toast.success('Supplier created')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to create supplier')
      }
    } catch {
      toast.error('Failed to create supplier')
    }
  }

  async function handleSubmit() {
    if (!description.trim()) { toast.error('Description is required'); return }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Valid amount is required'); return }

    setSubmitting(true)
    try {
      const res = await posFetch('/api/admin/pos/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId,
          supplierId: selectedSupplier?.id || null,
          amount: parseFloat(amount),
          paymentMethod,
          description,
          invoiceNumber: invoiceNumber || undefined,
          notes: notes || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Expense recorded')
        setDescription('')
        setAmount('')
        setInvoiceNumber('')
        setNotes('')
        setSelectedSupplier(null)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to record expense')
      }
    } catch {
      toast.error('Failed to record expense')
    }
    setSubmitting(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-white/40 block mb-1">Supplier</label>
        {selectedSupplier ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gold/5 rounded-lg border border-gold/20">
            <span className="flex-1 text-sm font-medium text-silver-soft">{selectedSupplier.name}</span>
            <button onClick={() => { setSelectedSupplier(null); setSupplierSearch('') }} className="text-white/40 hover:text-red-400">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                placeholder="Search supplier or create new..."
                className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
              />
              {suppliers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0f1a2e] border border-white/10 rounded-lg shadow-2xl z-10 max-h-40 overflow-y-auto">
                  {suppliers.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedSupplier(s); setSuppliers([]); setSupplierSearch('') }}
                      className="w-full text-left px-3 py-2 hover:bg-gold/10 text-sm"
                    >
                      <span className="font-medium text-silver-soft">{s.name}</span>
                      {s.phone && <span className="text-white/40 ml-2">{s.phone}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => setShowNewSupplier(!showNewSupplier)} className="text-xs text-gold hover:text-gold/80 transition-colors">
              + Create new supplier
            </button>
          </div>
        )}
        {showNewSupplier && (
          <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10 space-y-2">
            <input
              type="text"
              value={newSupplierName}
              onChange={(e) => setNewSupplierName(e.target.value)}
              placeholder="Supplier name *"
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-silver-soft placeholder:text-white/20"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                placeholder="Phone"
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-silver-soft placeholder:text-white/20"
              />
              <input
                type="email"
                value={newSupplierEmail}
                onChange={(e) => setNewSupplierEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-silver-soft placeholder:text-white/20"
              />
            </div>
            <button onClick={handleCreateSupplier} className="px-4 py-1.5 bg-gold/15 text-gold rounded text-sm font-medium hover:bg-gold/25 transition-all border border-gold/20">
              Save Supplier
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-1">Description *</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was purchased?"
          className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1">Amount *</label>
          <input
            type="number"
            step="0.01"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          >
            {PAYMENT_METHODS.filter((pm) => pm.value !== 'split').map((pm) => (
              <option key={pm.value} value={pm.value}>{pm.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/40 block mb-1">Invoice Number (optional)</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="INV-001"
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting || !description.trim() || !amount || parseFloat(amount) <= 0}
        className="w-full px-6 py-2 bg-gradient-to-r from-gold/90 to-gold text-navy-deep rounded-lg text-sm font-bold hover:from-gold hover:to-gold/90 disabled:opacity-40 transition-all shadow-lg shadow-gold/20"
      >
        {submitting ? 'Recording...' : 'Record Expense'}
      </button>
    </div>
  )
}

export default function RecordsTab({ shiftId }: { shiftId: string }) {
  const [subTab, setSubTab] = useState<'order' | 'expense'>('order')

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setSubTab('order')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            subTab === 'order' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-white/40 hover:text-silver-soft border border-white/10 hover:border-gold/20 bg-white/5'
          }`}
        >
          Manual Order
        </button>
        <button
          onClick={() => setSubTab('expense')}
          className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
            subTab === 'expense' ? 'bg-gold/20 text-gold border border-gold/30' : 'text-white/40 hover:text-silver-soft border border-white/10 hover:border-gold/20 bg-white/5'
          }`}
        >
          Expense
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {subTab === 'order' ? <ManualOrderForm shiftId={shiftId} /> : <ExpenseForm shiftId={shiftId} />}
      </div>
    </div>
  )
}
