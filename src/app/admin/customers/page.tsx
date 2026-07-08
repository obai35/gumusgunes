'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { toast } from 'sonner'
import { Search, X, Download, FileText } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

const statusColor: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function formatCurrency(amount: number): string {
  return 'E£' + amount.toFixed(2)
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState({ totalCustomers: 0, activeCustomers: 0, totalRevenue: 0, avgOrderValue: 0 })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<any[] | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch('/api/admin/customers?' + params)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to load customers'); return }
      setCustomers(data.customers)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setStats(data.stats)
    } catch {
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  useEffect(() => { setPage(1) }, [debouncedSearch])

  async function toggleExpand(customerId: string) {
    if (expandedRow === customerId) {
      setExpandedRow(null)
      setExpandedOrders(null)
      return
    }
    setLoadingOrders(true)
    setExpandedRow(customerId)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed'); return }
      setExpandedOrders(data.customer.orders.slice(0, 5))
    } catch {
      toast.error('Failed to load customer details')
    } finally {
      setLoadingOrders(false)
    }
  }

  function exportCSV() {
    if (customers.length === 0) { toast.error('No customers to export'); return }
    const rows = [['Name', 'Email', 'Phone', 'Orders', 'Total Spend', 'Last Order', 'Registered']]
    for (const c of customers) {
      rows.push([
        c.name || '',
        c.email || '',
        c.phone || '',
        String(c.orderCount),
        c.totalSpend.toFixed(2),
        c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '',
        new Date(c.createdAt).toLocaleDateString(),
      ])
    }
    const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Customers</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Customers</p>
          <p className="text-2xl font-semibold text-navy mt-1">{stats.totalCustomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active (30d)</p>
          <p className="text-2xl font-semibold text-navy mt-1">{stats.activeCustomers}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Revenue</p>
          <p className="text-2xl font-semibold text-navy mt-1">{formatCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg Order Value</p>
          <p className="text-2xl font-semibold text-navy mt-1">{formatCurrency(stats.avgOrderValue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{total} customer{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orders</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Total Spend</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Registered</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c: any) => (
                <Fragment key={c.id}>
                  <tr
                    className="border-b border-border/50 hover:bg-gray-50/50 cursor-pointer"
                    onClick={() => toggleExpand(c.id)}
                  >
                    <td className="px-4 py-3 font-medium text-navy">{c.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-navy font-medium">{c.orderCount}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-navy">{formatCurrency(c.totalSpend)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders?customerId=${c.id}`}
                        onClick={e => e.stopPropagation()}
                        className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium"
                      >
                        <FileText className="h-3 w-3" /> Orders
                      </Link>
                    </td>
                  </tr>
                  {expandedRow === c.id && (
                    <tr key={`${c.id}-expanded`}>
                      <td colSpan={8} className="px-4 py-3 bg-gray-50/50">
                        {loadingOrders ? (
                          <div className="text-sm text-muted-foreground py-2">Loading orders...</div>
                        ) : expandedOrders && expandedOrders.length > 0 ? (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent Orders</p>
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-border/50 text-left text-muted-foreground">
                                  <th className="pb-1.5 pr-3 font-medium">Order #</th>
                                  <th className="pb-1.5 pr-3 font-medium">Date</th>
                                  <th className="pb-1.5 pr-3 font-medium">Items</th>
                                  <th className="pb-1.5 pr-3 font-medium">Total</th>
                                  <th className="pb-1.5 pr-3 font-medium">Status</th>
                                  <th className="pb-1.5 pr-3 font-medium">Branch</th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedOrders.map((o: any) => (
                                  <tr key={o.id} className="border-b border-border/30">
                                    <td className="py-1.5 pr-3 font-medium text-navy">{o.orderNumber}</td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">
                                      {o.items?.map((i: any) => `${i.product?.name || 'Product'} x${i.quantity}`).join(', ') || '—'}
                                    </td>
                                    <td className="py-1.5 pr-3 font-medium text-navy">{formatCurrency(o.totalAmount)}</td>
                                    <td className="py-1.5 pr-3">
                                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${statusColor[o.status] || 'bg-gray-100 text-gray-700'}`}>
                                        {o.status}
                                      </span>
                                    </td>
                                    <td className="py-1.5 pr-3 text-muted-foreground">{o.shift?.branch?.name || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground py-2">No orders yet</div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
