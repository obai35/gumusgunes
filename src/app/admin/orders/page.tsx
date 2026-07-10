'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X } from 'lucide-react'
import type { Order } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(d => { if (d.ok) setOrders(Array.isArray(d.orders) ? d.orders : []) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!o.orderNumber?.toLowerCase().includes(q) &&
          !o.receiptNumber?.toLowerCase().includes(q) &&
          !o.fullName?.toLowerCase().includes(q) &&
          !o.email?.toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && o.status !== statusFilter) return false
    if (paymentFilter !== 'all' && o.paymentStatus !== paymentFilter) return false
    return true
  })

  if (loading) return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border border-border rounded-lg">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Orders</h1>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by order #, receipt, name, or email..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="all">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="awaiting_verification">Awaiting Verification</option>
        </select>
        <span className="text-xs text-muted-foreground">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order: any) => (
              <tr key={order.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">{order.orderNumber}
                  {order.receiptNumber && <span className="text-xs text-muted-foreground block">{order.receiptNumber}</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.fullName}<br /><span className="text-xs">{order.email}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 font-medium text-navy">${order.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span></td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-700">{order.paymentStatus}</span></td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium">
                    View <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
