'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { FilterBar } from '@/components/admin/FilterBar'
import { Pagination } from '@/components/admin/Pagination'
import { BulkActionBar } from '@/components/admin/BulkActionBar'
import { ExportButton } from '@/components/admin/ExportButton'
import { PageHeader } from '@/components/admin/PageHeader'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { useDebounce } from '@/hooks/useDebounce'
import type { ColumnDef } from '@tanstack/react-table'

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Processing', value: 'processing' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
]

const paymentOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Paid', value: 'paid' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Awaiting Verification', value: 'awaiting_verification' },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    setLoading(true)
    setSelectedIds(new Set())
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    params.set('page', String(page))
    params.set('limit', String(pageSize))

    fetch(`/api/admin/orders?${params.toString()}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setOrders(Array.isArray(d.orders) ? d.orders : [])
          setTotal(d.total || 0)
        }
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [debouncedSearch, statusFilter, paymentFilter, dateFrom, dateTo, page, pageSize])

  const handleBulkStatus = async (status: string) => {
    setBulkUpdating(true)
    try {
      const res = await fetch('/api/admin/orders/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: Array.from(selectedIds), status }),
      })
      const data = await res.json()
      if (data.ok) {
        toast.success(`Updated ${data.updated} orders to ${status}`)
        setSelectedIds(new Set())
        setOrders(prev => prev.map(o => selectedIds.has(o.id) ? { ...o, status } : o))
      } else {
        toast.error(data.error || 'Failed')
      }
    } catch {
      toast.error('Failed to update orders')
    } finally {
      setBulkUpdating(false)
    }
  }

  const hasActiveFilters = !!(statusFilter || paymentFilter || dateFrom || dateTo || search)

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-navy">{row.original.orderNumber}</span>
          {row.original.receiptNumber && (
            <span className="text-xs text-muted-foreground block">{row.original.receiptNumber}</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'fullName',
      header: 'Customer',
      cell: ({ row }) => (
        <div>
          <span className="text-muted-foreground">{row.original.fullName}</span>
          <br />
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      enableSorting: true,
      cell: ({ row }) => <span className="text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
    },
    {
      accessorKey: 'totalAmount',
      header: 'Total',
      enableSorting: true,
      cell: ({ row }) => <span className="font-medium text-navy">${row.original.totalAmount.toFixed(2)}</span>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      enableSorting: true,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => <StatusBadge status={row.original.paymentStatus} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <Link
            href={`/admin/orders/${row.original.id}`}
            className="text-gold hover:text-gold/80 inline-flex items-center gap-1 text-xs font-medium"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Orders" />

      <FilterBar
        status={statusFilter}
        onStatusChange={v => { setStatusFilter(v); setPage(1) }}
        statusOptions={statusOptions}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={v => { setDateFrom(v); setPage(1) }}
        onDateToChange={v => { setDateTo(v); setPage(1) }}
        hasActiveFilters={hasActiveFilters}
        onClearAll={() => { setStatusFilter(''); setPaymentFilter(''); setDateFrom(''); setDateTo(''); setSearch(''); setPage(1) }}
      >
        <select
          value={paymentFilter}
          onChange={e => { setPaymentFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="">All Payments</option>
          {paymentOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ExportButton
          filename="orders-export"
          columns={[
            { header: 'Order', key: 'orderNumber' },
            { header: 'Customer', key: 'fullName' },
            { header: 'Email', key: 'email' },
            { header: 'Date', key: 'createdAt' },
            { header: 'Total', key: 'totalAmount' },
            { header: 'Status', key: 'status' },
            { header: 'Payment', key: 'paymentStatus' },
          ]}
          data={orders}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        loading={loading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting your search or filters"
      />

      <Pagination
        page={page}
        totalPages={Math.ceil(total / pageSize)}
        totalItems={total}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={s => { setPageSize(s); setPage(1) }}
      />

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        actions={[
          { label: 'Mark Processing', onClick: () => handleBulkStatus('processing') },
          { label: 'Mark Shipped', onClick: () => handleBulkStatus('shipped') },
          { label: 'Mark Delivered', onClick: () => handleBulkStatus('delivered') },
          { label: 'Mark Cancelled', onClick: () => handleBulkStatus('cancelled'), variant: 'destructive' },
        ]}
      />
    </div>
  )
}
