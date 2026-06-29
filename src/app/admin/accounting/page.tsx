'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, CheckCircle, DollarSign, Filter, X, Building2, CalendarDays, Download } from 'lucide-react'

type Tab = 'overview' | 'orders' | 'branches' | 'reports'

export default function AccountingPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Accounting</h1>
      </div>
      <div className="flex gap-1 mb-6 border-b border-border">
        {([
          { id: 'overview' as Tab, label: 'Overview' },
          { id: 'orders' as Tab, label: 'Orders' },
          { id: 'branches' as Tab, label: 'Branches' },
          { id: 'reports' as Tab, label: 'Reports' },
        ]).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'branches' && <BranchesTab />}
      {tab === 'reports' && <ReportsTab />}
    </div>
  )
}

function OverviewTab() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/accounting/overview')
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load overview'))
  }, [])

  if (!data) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `$${data.todayRevenue.toFixed(2)}`, color: 'text-green-600' },
          { label: "Today's Orders", value: data.todayOrders, color: 'text-navy' },
          { label: 'Pending Orders', value: data.pendingOrders, color: 'text-yellow-600' },
          { label: 'Unreconciled Payments', value: data.unreconciledOrders, color: 'text-red-600' },
          { label: "Today's Refunds", value: data.pendingRefunds ?? 0, color: 'text-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {data.openShifts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">
            {data.openShifts} open shift{data.openShifts !== 1 ? 's' : ''}: {data.openShiftBranches.join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [page, setPage] = useState(1)

  function fetchOrders() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/orders?${params}`)
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders); setTotal(data.total) })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [page])

  async function handleFulfill(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/orders/${id}/fulfill`, { method: 'POST' })
      if (res.ok) { toast.success('Order fulfilled'); fetchOrders() }
      else toast.error('Failed to fulfill')
    } catch { toast.error('Failed to fulfill') }
  }

  async function handleReconcile(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/orders/${id}/reconcile`, { method: 'POST' })
      if (res.ok) { toast.success('Payment reconciled'); fetchOrders() }
      else toast.error('Failed to reconcile')
    } catch { toast.error('Failed to reconcile') }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const paymentLabels: Record<string, string> = {
    cash: 'Cash', card: 'Card', split: 'Split',
    bank_transfer: 'Bank Transfer', instapay: 'InstaPay', wallet: 'Wallet',
  }

  if (selectedOrder) {
    return (
      <div>
        <button onClick={() => setSelectedOrder(null)} className="text-sm text-navy hover:text-gold mb-4 flex items-center gap-1">
          <X className="h-4 w-4" /> Back to orders
        </button>
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Order #</p><p className="font-medium text-navy">{selectedOrder.receiptNumber || selectedOrder.orderNumber}</p></div>
            <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-navy">{selectedOrder.fullName}</p></div>
            <div><p className="text-muted-foreground">Branch</p><p className="font-medium text-navy">{selectedOrder.shift?.branch?.name || '-'}</p></div>
            <div><p className="text-muted-foreground">Total</p><p className="font-bold text-navy">${selectedOrder.totalAmount.toFixed(2)}</p></div>
            <div><p className="text-muted-foreground">Status</p><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedOrder.status] || ''}`}>{selectedOrder.status}</span></div>
            <div><p className="text-muted-foreground">Payment</p><p className="font-medium text-navy">{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p></div>
            <div><p className="text-muted-foreground">Payment Status</p><p className="font-medium text-navy">{selectedOrder.paymentStatus}</p></div>
            <div><p className="text-muted-foreground">Date</p><p className="font-medium text-navy">{new Date(selectedOrder.createdAt).toLocaleString()}</p></div>
            {selectedOrder.fulfilledAt && <div><p className="text-muted-foreground">Fulfilled</p><p className="font-medium text-green-600">{new Date(selectedOrder.fulfilledAt).toLocaleString()}</p></div>}
            {selectedOrder.reconciledAt && <div><p className="text-muted-foreground">Reconciled</p><p className="font-medium text-green-600">{new Date(selectedOrder.reconciledAt).toLocaleString()}</p></div>}
          </div>
          {selectedOrder.items?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 font-medium">Product</th><th className="pb-2 font-medium text-right">Qty</th><th className="pb-2 font-medium text-right">Price</th><th className="pb-2 font-medium text-right">Total</th></tr></thead>
                <tbody>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <tr key={item.id || i} className="border-b border-border/50">
                      <td className="py-2 text-navy font-medium">{item.product?.name || item.product?.productName || '-'}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-2 text-right text-muted-foreground">${item.price.toFixed(2)}</td>
                      <td className="py-2 text-right text-navy font-medium">${(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {selectedOrder.status !== 'delivered' && (
              <button onClick={() => { handleFulfill(selectedOrder.id); setSelectedOrder(null) }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Mark Delivered
              </button>
            )}
            {!selectedOrder.reconciledAt && selectedOrder.paymentStatus === 'paid' && (
              <button onClick={() => { handleReconcile(selectedOrder.id); setSelectedOrder(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Reconcile Payment
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Search by order#, receipt, name..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <button
          onClick={() => {
            const params = new URLSearchParams()
            if (search) params.set('search', search)
            if (statusFilter) params.set('status', statusFilter)
            if (paymentFilter) params.set('paymentStatus', paymentFilter)
            window.open(`/api/admin/accounting/export/orders?${params}`, '_blank')
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
        <button onClick={fetchOrders} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Filter className="h-4 w-4 inline mr-1" /> Filter
        </button>
      </div>

      {loading ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Receipt #</th>
                <th className="p-3 font-medium">Branch</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium">Reconciled</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No orders found</td></tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-3 font-medium text-navy">#{order.receiptNumber || order.orderNumber?.slice(0, 10)}</td>
                  <td className="p-3 text-muted-foreground">{order.shift?.branch?.name || '-'}</td>
                  <td className="p-3 text-navy">{order.fullName}</td>
                  <td className="p-3 text-right font-medium text-navy">${order.totalAmount.toFixed(2)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status}</span></td>
                  <td className="p-3 text-muted-foreground">{paymentLabels[order.paymentMethod] || order.paymentMethod}</td>
                  <td className="p-3">
                    {order.reconciledAt ? (
                      <span className="text-green-600 text-xs font-medium">Yes</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">No</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {order.status !== 'delivered' && (
                        <button onClick={() => handleFulfill(order.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">Fulfill</button>
                      )}
                      {!order.reconciledAt && order.paymentStatus === 'paid' && (
                        <button onClick={() => handleReconcile(order.id)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">Reconcile</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border">
            <span>{total} total orders</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(total / 30) }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded text-xs ${page === i + 1 ? 'bg-navy text-silver' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BranchesTab() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState('day')

  useEffect(() => {
    fetch(`/api/admin/accounting/branches?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load branch data'))
  }, [period])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['day', 'week', 'month'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button
          onClick={() => window.open(`/api/admin/accounting/export/branches?period=${period}`, '_blank')}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>
      {!data ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.branches.map((branch: any) => (
            <div key={branch.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-navy" />
                <h3 className="font-semibold text-navy">{branch.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold text-navy">${branch.totalRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span className="font-medium text-navy">{branch.orderCount}</span></div>
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-green-600">Cash</span><span className="font-medium text-navy">${branch.cashTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-blue-600">Card</span><span className="font-medium text-navy">${branch.cardTotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-purple-600">Other</span><span className="font-medium text-navy">${branch.otherTotal.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          ))}
          {data.branches.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground text-sm py-8">No data for this period</div>
          )}
        </div>
      )}
    </div>
  )
}

function ReportsTab() {
  const [data, setData] = useState<any>(null)
  const [type, setType] = useState('daily')

  useEffect(() => {
    fetch(`/api/admin/accounting/reports?type=${type}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => toast.error('Failed to load reports'))
  }, [type])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['daily', 'weekly', 'monthly'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              type === t ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <button
          onClick={() => window.open(`/api/admin/accounting/export/reports?type=${type}`, '_blank')}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>
      {!data ? (
        <div className="text-muted-foreground text-sm">Loading...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-navy">${data.summary.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-navy">{data.summary.totalOrders}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-navy">${data.summary.avgOrderValue.toFixed(2)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                  <th className="p-3 font-medium">Period</th>
                  <th className="p-3 font-medium text-right">Revenue</th>
                  <th className="p-3 font-medium text-right">Orders</th>
                  <th className="p-3 font-medium text-right">Avg Order</th>
                </tr>
              </thead>
              <tbody>
                {data.periods.map((p: any) => (
                  <tr key={p.period} className="border-b border-border/50">
                    <td className="p-3 font-medium text-navy">{p.period}</td>
                    <td className="p-3 text-right text-navy">${p.revenue.toFixed(2)}</td>
                    <td className="p-3 text-right text-muted-foreground">{p.orderCount}</td>
                    <td className="p-3 text-right text-navy">${p.avgOrderValue.toFixed(2)}</td>
                  </tr>
                ))}
                {data.periods.length === 0 && (
                  <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
