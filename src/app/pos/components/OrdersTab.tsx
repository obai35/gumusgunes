'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, X, Printer, Ban, AlertTriangle, Undo2 } from 'lucide-react'

type Order = {
  id: string
  orderNumber: string
  receiptNumber: string | null
  fullName: string
  totalAmount: number
  paymentMethod: string
  status: string
  paymentStatus: string
  createdAt: string
  items: { id: string; quantity: number; price: number; product: { name: string; sku: string } }[]
}

type SearchResponse = {
  orders: Order[]
  total: number
  page: number
  totalPages: number
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  confirmed: { label: 'Confirmed', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  processing: { label: 'Processing', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  shipped: { label: 'Shipped', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  delivered: { label: 'Delivered', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  cancelled: { label: 'Voided', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
}

export default function OrdersTab({ shiftId, onReturnOrder }: { shiftId?: string; onReturnOrder?: (orderId: string) => void }) {
  const [query, setQuery] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [voidConfirmId, setVoidConfirmId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding] = useState(false)

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

  async function handleVoid(orderId: string) {
    setVoiding(true)
    try {
      const res = await fetch('/api/admin/pos/orders/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason: voidReason }),
      })
      if (res.ok) {
        toast.success('Order voided')
        setVoidConfirmId(null)
        setVoidReason('')
        setSelectedOrder(null)
        handleSearch()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to void order')
      }
    } catch {
      toast.error('Failed to void order')
    }
    setVoiding(false)
  }

  function handleGiftReceipt(order: Order) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Gift Receipt — ${order.receiptNumber || order.orderNumber}</title>
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
          img { width: 32px; height: 32px; border-radius: 50%; }
          @media print { @page { margin: 8mm; } }
        </style></head>
        <body>
          <div class="text-center">
            <img src="/gumusgunes-logo.jpeg" alt="" style="margin:0 auto 8px" />
            <p style="font-size:18px;font-weight:600">Gümüş Güneş</p>
            <p class="text-xs">Gift Receipt</p>
            <p class="text-sm font-bold mt-2">${order.receiptNumber || order.orderNumber}</p>
            <p class="text-xs">${new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div class="border-b p-4">
            ${order.items.map((item) => `
              <div class="flex justify-between text-sm">
                <div class="font-bold">${item.product.name}</div>
              </div>
            `).join('')}
          </div>
          <p class="text-center text-xs" style="margin-top:16px">Thank you! No refund without original receipt.</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  function handleReprint(order: Order) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Receipt — ${order.receiptNumber || order.orderNumber}</title>
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
          .text-red { color: #ef4444; }
          @media print { @page { margin: 8mm; } }
        </style></head>
        <body>
          <div class="text-center">
            <img src="/gumusgunes-logo.jpeg" alt="" style="margin:0 auto 8px" />
            <p style="font-size:18px;font-weight:600">Gümüş Güneş</p>
            <p class="text-xs">In-store Purchase</p>
            <p class="text-sm font-bold mt-2">${order.receiptNumber || order.orderNumber}</p>
            <p class="text-xs">${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            ${order.status === 'cancelled' ? '<p class="text-red font-bold" style="margin-top:8px">** VOIDED **</p>' : ''}
            <p class="text-xs" style="margin-top:4px">Reprinted: ${new Date().toLocaleString()}</p>
          </div>
          <div class="border-b p-4">
            ${order.items.map((item) => `
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
            <div class="flex justify-between text-sm"><span>Total</span><span class="font-bold">$${order.totalAmount.toFixed(2)}</span></div>
          </div>
          <p class="text-center text-xs" style="margin-top:16px">Thank you for your purchase!</p>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const paymentLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    split: 'Split',
    bank_transfer: 'Bank Transfer',
    instapay: 'InstaPay',
    wallet: 'Wallet',
  }

  if (selectedOrder) {
    const statusCfg = statusConfig[selectedOrder.status] || { label: selectedOrder.status, color: 'text-white/40' }
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-silver-soft">
              Order #{selectedOrder.receiptNumber || selectedOrder.orderNumber}
            </h2>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>{statusCfg.label}</span>
          </div>
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

          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <button onClick={() => handleReprint(selectedOrder)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-white/10 text-sm text-silver-soft font-medium hover:bg-white/5 transition-all">
                <Printer className="h-4 w-4" /> Receipt
              </button>
              <button onClick={() => handleGiftReceipt(selectedOrder)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-white/10 text-sm text-silver-soft font-medium hover:bg-white/5 transition-all">
                <Printer className="h-4 w-4" /> Gift Receipt
              </button>
            </div>
            <div className="flex gap-2">
              {selectedOrder.status !== 'cancelled' && (
                <button onClick={() => onReturnOrder?.(selectedOrder.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-amber-500/20 text-sm text-amber-400 font-medium hover:bg-amber-500/10 transition-all">
                  <Undo2 className="h-4 w-4" /> Return Items
                </button>
              )}
              {selectedOrder.status !== 'cancelled' && (
                <button onClick={() => setVoidConfirmId(selectedOrder.id)} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-red-500/20 text-sm text-red-400 font-medium hover:bg-red-500/10 transition-all">
                  <Ban className="h-4 w-4" /> Void
                </button>
              )}
            </div>
          </div>
        </div>

        {voidConfirmId === selectedOrder.id && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setVoidConfirmId(null)}>
            <div className="pos-glass-strong rounded-xl p-6 w-80 space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-silver-soft">Void Order</h3>
                  <p className="text-xs text-white/40">This will return stock to inventory</p>
                </div>
              </div>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason for voiding (optional)"
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-silver-soft text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all resize-none"
              />
              <div className="flex gap-2">
                <button onClick={() => { setVoidConfirmId(null); setVoidReason('') }} className="flex-1 py-2.5 rounded-lg bg-white/5 text-white/50 text-sm hover:bg-white/10 transition-all">Cancel</button>
                <button onClick={() => handleVoid(selectedOrder.id)} disabled={voiding} className="flex-1 py-2.5 rounded-lg bg-red-500/80 text-white text-sm font-semibold hover:bg-red-500 transition-all disabled:opacity-50">
                  {voiding ? 'Voiding...' : 'Confirm Void'}
                </button>
              </div>
            </div>
          </div>
        )}
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
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-silver-soft truncate">
                      #{order.receiptNumber || order.orderNumber}
                    </p>
                    {order.status !== 'confirmed' && (
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border flex-shrink-0 ${(statusConfig[order.status]?.color) || 'text-white/40'}`}>
                        {statusConfig[order.status]?.label || order.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40 truncate mt-0.5">{order.fullName}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className={`text-sm font-bold ${order.status === 'cancelled' ? 'text-red-400 line-through' : 'text-gold'}`}>
                    ${order.totalAmount.toFixed(2)}
                  </p>
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
