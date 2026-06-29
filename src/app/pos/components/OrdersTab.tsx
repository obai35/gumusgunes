'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, X } from 'lucide-react'

type Order = {
  id: string
  orderNumber: string
  receiptNumber: string | null
  fullName: string
  totalAmount: number
  paymentMethod: string
  createdAt: string
  items: { id: string; quantity: number; price: number; product: { name: string; sku: string } }[]
}

type SearchResponse = {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

export default function OrdersTab({ shiftId }: { shiftId?: string }) {
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  async function handleSearch(page = 1) {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      if (shiftId) params.set('shiftId', shiftId)
      params.set('page', String(page))

      const res = await fetch(`/api/admin/pos/orders/search?${params}`)
      if (res.ok) setResults(await res.json())
      else toast.error('Search failed')
    } catch {
      toast.error('Search failed')
    }
    setLoading(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query || fromDate || toDate) handleSearch()
    }, 300)
    return () => clearTimeout(timer)
  }, [query, fromDate, toDate])

  const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    split: 'Split',
    bank_transfer: 'Bank Transfer',
    instapay: 'InstaPay',
    wallet: 'Wallet',
  }

  if (selectedOrder) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <h2 className="font-display text-lg font-semibold text-silver-soft">
            Order #{selectedOrder.receiptNumber || selectedOrder.orderNumber}
          </h2>
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/50 hover:text-silver-soft rounded-lg transition-all border border-white/10">
            <X className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 scroll-luxury">
          <div className="pos-glass rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-white/40">Customer</p>
                <p className="font-medium text-silver-soft">{selectedOrder.fullName}</p>
              </div>
              <div>
                <p className="text-white/40">Payment</p>
                <p className="font-medium text-silver-soft">{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-white/40">Date</p>
                <p className="font-medium text-silver-soft">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40">Total</p>
                <p className="font-medium text-gold">${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="pos-glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-silver-soft mb-3">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-2 text-silver-soft font-medium">{item.product.name}</td>
                    <td className="py-2 text-right text-white/50">{item.quantity}</td>
                    <td className="py-2 text-right text-white/50">${item.price.toFixed(2)}</td>
                    <td className="py-2 text-right text-silver-soft font-medium">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order number, receipt, or customer name..."
            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-silver-soft focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 text-sm text-white/50">Searching...</div>
      ) : results ? (
        <div className="flex-1 overflow-y-auto scroll-luxury">
          <p className="text-xs text-white/40 mb-2">{results.total} order{results.total !== 1 ? 's' : ''} found</p>
          <div className="space-y-2">
            {results.orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full flex items-center justify-between p-3 pos-glass rounded-lg hover:border-gold/30 transition-all text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-silver-soft truncate">
                    #{order.receiptNumber || order.orderNumber}
                  </p>
                  <p className="text-xs text-white/40 truncate">{order.fullName}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-gold">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-white/40">
                    {paymentLabels[order.paymentMethod] || order.paymentMethod}
                    {' · '}{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {results.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: results.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => handleSearch(p)}
                  className={`px-3 py-1 text-sm rounded-lg border transition-all ${
                    p === results.page ? 'bg-gold/20 text-gold border-gold/40' : 'border-white/10 text-white/40 hover:text-silver-soft hover:border-gold/20'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-white/40">
          Enter a search term or select a date range
        </div>
      )}
    </div>
  )
}
