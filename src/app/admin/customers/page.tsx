'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { toast } from 'sonner'
import { Search, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ExportButton } from '@/components/admin/ExportButton'
import { useDebounce } from '@/hooks/useDebounce'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import type { ColumnDef } from '@tanstack/react-table'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [stats, setStats] = useState({ totalCustomers: 0, activeCustomers: 0, totalRevenue: 0, avgOrderValue: 0 })
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<any[] | null>(null)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const debouncedSearch = useDebounce(searchQuery, 300)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch('/api/admin/customers?' + params)
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || ta('Failed to load customers')); return }
      setCustomers(Array.isArray(data.customers) ? data.customers : [])
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setStats(data.stats)
    } catch {
      toast.error(ta('Failed to load customers'))
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedSearch])

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
      if (!res.ok) { toast.error(data.error || ta('Failed')); return }
      setExpandedOrders(Array.isArray(data.customer.orders) ? data.customer.orders.slice(0, 5) : [])
    } catch {
      toast.error(ta('Failed to load customer details'))
    } finally {
      setLoadingOrders(false)
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'name',
      header: ta('Name'),
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.name || '—'}</span>,
    },
    {
      accessorKey: 'email',
      header: ta('Email'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: 'phone',
      header: ta('Phone'),
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || '—'}</span>,
    },
    {
      accessorKey: 'orderCount',
      header: ta('Orders'),
    },
    {
      accessorKey: 'totalSpend',
      header: ta('Total Spend'),
      cell: ({ row }) => <span className="font-medium text-navy">{fmtCurrency(row.original.totalSpend)}</span>,
    },
    {
      accessorKey: 'lastOrderDate',
      header: ta('Last Order'),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.lastOrderDate ? fmtDate(row.original.lastOrderDate) : '—'}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: ta('Registered'),
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{fmtDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'loyaltyPoints',
      header: ta('Loyalty'),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {fmtNum(row.original.loyaltyPoints ?? 0)} {ta('pts')}
          {row.original.loyaltyTier ? ta(` (${row.original.loyaltyTier.name})`) : ''}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/admin/orders?customerId=${row.original.id}`}
            className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium"
            onClick={e => e.stopPropagation()}
          >
            <FileText className="h-3 w-3" /> {ta('Orders')}
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Customers')}
        actions={
          <ExportButton
            filename="customers-export"
            columns={[
              { header: ta('Name'), key: 'name' },
              { header: ta('Email'), key: 'email' },
              { header: ta('Phone'), key: 'phone' },
              { header: ta('Orders'), key: 'orderCount' },
              { header: ta('Total Spend'), key: 'totalSpend' },
            ]}
            data={customers}
          />
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Total Customers')}</p>
          <p className="text-2xl font-semibold text-navy mt-1">{fmtNum(stats.totalCustomers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Active (30d)')}</p>
          <p className="text-2xl font-semibold text-navy mt-1">{fmtNum(stats.activeCustomers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Total Revenue')}</p>
          <p className="text-2xl font-semibold text-navy mt-1">{fmtCurrency(stats.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{ta('Avg Order Value')}</p>
          <p className="text-2xl font-semibold text-navy mt-1">{fmtCurrency(stats.avgOrderValue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={ta('Search by name, email, or phone...')}
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{fmtNum(total)} {ta(`customer${total !== 1 ? 's' : ''}`)}</span>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(c) => c.id}
        loading={loading}
        responsiveCards
        onRowClick={(c) => toggleExpand(c.id)}
        emptyTitle={ta('No customers found')}
        emptyDescription={searchQuery ? ta('Try adjusting your search terms') : undefined}
      />

      {/* Expanded orders section */}
      {expandedRow && (
        <div className="bg-gray-50/50 border border-border rounded-xl p-4 mt-2 mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{ta('Recent Orders')}</p>
          {loadingOrders ? (
            <div className="text-sm text-muted-foreground py-2">{ta('Loading orders...')}</div>
          ) : expandedOrders && expandedOrders.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-1.5 pr-3 font-medium">{ta('Order #')}</th>
                  <th className="pb-1.5 pr-3 font-medium">{ta('Date')}</th>
                  <th className="pb-1.5 pr-3 font-medium">{ta('Items')}</th>
                  <th className="pb-1.5 pr-3 font-medium">{ta('Total')}</th>
                  <th className="pb-1.5 pr-3 font-medium">{ta('Status')}</th>
                  <th className="pb-1.5 pr-3 font-medium">{ta('Branch')}</th>
                </tr>
              </thead>
              <tbody>
                {expandedOrders.map((o: any) => (
                  <tr key={o.id} className="border-b border-border/30">
                    <td className="py-1.5 pr-3 font-medium text-navy">{o.orderNumber}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{fmtDate(o.createdAt)}</td>
                    <td className="py-1.5 pr-3 text-muted-foreground">
                      {o.items?.map((i: any) => ta(`${i.product?.name || 'Product'} x${i.quantity}`)).join(', ') || '—'}
                    </td>
                    <td className="py-1.5 pr-3 font-medium text-navy">{fmtCurrency(o.totalAmount)}</td>
                    <td className="py-1.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        o.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{o.status}</span>
                    </td>
                    <td className="py-1.5 pr-3 text-muted-foreground">{o.shift?.branch?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-sm text-muted-foreground py-2">{ta('No orders yet')}</div>
          )}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
      />
    </div>
  )
}
