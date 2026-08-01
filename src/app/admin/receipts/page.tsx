'use client'

import { useState } from 'react'
import { Search, ExternalLink, Receipt, DollarSign, CreditCard, SplitSquareVertical } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Order = {
  id: string
  orderNumber: string
  receiptNumber: string | null
  fullName: string
  email: string
  totalAmount: number
  subtotal: number
  discountAmount: number | null
  paymentMethod: string
  cashAmount: number | null
  cardAmount: number | null
  status: string
  createdAt: string
}

export default function ReceiptsPage() {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [searched, setSearched] = useState(false)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  async function handleSearch() {
    if (!search.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const res = await fetch(`/api/admin/orders/lookup?q=${encodeURIComponent(search)}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])
      } else {
        toast.error(ta('Search failed'))
      }
    } catch {
      toast.error(ta('Search failed'))
    }
    setLoading(false)
  }

  function getPaymentIcon(method: string) {
    switch (method) {
      case 'cash': return <DollarSign className="h-3.5 w-3.5 text-green-600" />
      case 'card': return <CreditCard className="h-3.5 w-3.5 text-blue-600" />
      case 'split': return <SplitSquareVertical className="h-3.5 w-3.5 text-gold" />
      default: return null
    }
  }

  function getPaymentLabel(method: string, cashAmount: number | null, cardAmount: number | null) {
    if (method === 'split') {
      return ta(`Split (Cash ${fmtCurrency(cashAmount || 0)} + Card ${fmtCurrency(cardAmount || 0)})`)
    }
    return method.charAt(0).toUpperCase() + method.slice(1)
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    confirmed: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-blue-100 text-blue-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6 flex items-center gap-2">
        <Receipt className="h-6 w-6 text-gold" /> {ta('Receipt Lookup')}
      </h1>

      {/* Search */}
      <div className="flex gap-3 mb-6 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={ta('Search by receipt number (R-...) or order number (P-... or O-...)')}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border text-sm"
            autoFocus
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading || !search.trim()}
          className="px-5 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50 transition-colors"
        >
          {loading ? ta('Searching...') : ta('Search')}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <Receipt className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">{ta(`No receipts found for "${search}"`)}</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-border p-5 hover:border-gold/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {order.receiptNumber && (
                        <span className="font-mono font-bold text-navy text-sm tracking-wider">{order.receiptNumber}</span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">#{order.orderNumber}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{fmtDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                    <Link href={`/admin/orders/${order.id}`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
                      {ta('View')} <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{ta('Customer')}</p>
                    <p className="font-medium text-navy">{order.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ta('Total')}</p>
                    <p className="font-bold text-navy">{fmtCurrency(order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ta('Payment')}</p>
                    <p className="font-medium text-navy flex items-center gap-1">
                      {getPaymentIcon(order.paymentMethod)}
                      {getPaymentLabel(order.paymentMethod, order.cashAmount, order.cardAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{ta('Discount')}</p>
                    <p className={`font-medium ${order.discountAmount ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {order.discountAmount ? ta(`-${fmtCurrency(order.discountAmount)}`) : ta('None')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!searched && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <Receipt className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-navy mb-2">{ta('Find a Receipt')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {ta('Enter a receipt number (e.g. RCP-20260626-XXXXXX) or order number (e.g. POS-XXX-XXXX) to look up the details.')}
          </p>
        </div>
      )}
    </div>
  )
}
