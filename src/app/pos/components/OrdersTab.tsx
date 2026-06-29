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
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-navy">
            Order #{selectedOrder.receiptNumber || selectedOrder.orderNumber}
          </h2>
          <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-navy rounded-lg transition-colors border border-border">
            <X className="h-4 w-4" /> Back
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium text-navy">{selectedOrder.fullName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium text-navy">{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium text-navy">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium text-navy">${selectedOrder.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-navy mb-3">Items</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Product</th>
                  <th className="pb-2 font-medium text-right">Qty</th>
                  <th className="pb-2 font-medium text-right">Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items.map((item) => (
                  <tr key={item.id} className="border-b border-border/50">
                    <td className="py-2 text-navy font-medium">{item.product.name}</td>
                    <td className="py-2 text-right text-muted-foreground">{item.quantity}</td>
                    <td className="py-2 text-right text-muted-foreground">${item.price.toFixed(2)}</td>
                    <td className="py-2 text-right text-navy font-medium">${(item.quantity * item.price).toFixed(2)}</td>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order number, receipt, or customer name..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground block mb-1">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 bg-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">Searching...</div>
      ) : results ? (
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs text-muted-foreground mb-2">{results.total} order{results.total !== 1 ? 's' : ''} found</p>
          <div className="space-y-2">
            {results.orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-border hover:border-gold/40 transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy truncate">
                    #{order.receiptNumber || order.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{order.fullName}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-medium text-navy">${order.totalAmount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
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
                  className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                    p === results.page ? 'bg-navy text-silver border-navy' : 'border-border text-muted-foreground hover:text-navy'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
          Enter a search term or select a date range
        </div>
      )}
    </div>
  )
}
