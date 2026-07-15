'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Search, X, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import type { ColumnDef } from '@tanstack/react-table'

type ReturnReq = {
  id: string
  rmaNumber: string
  status: string
  reason: string
  quantity: number
  notes: string | null
  createdAt: string
  order: { id: string; orderNumber: string; fullName: string }
  product: { id: string; name: string; sku: string; imageUrl: string }
}

export default function ReturnsDashboard() {
  const [returns, setReturns] = useState<ReturnReq[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function fetchReturns() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/return-requests?${params}`)
      const data = await res.json()
      if (data.ok) { setReturns(data.returnRequests || []); setTotalPages(data.totalPages || 1) }
    } catch { toast.error('Failed to load return requests') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReturns() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/return-requests/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.ok) { toast.success(`Return ${status}`); fetchReturns() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Failed to update status') }
    finally { setActionLoading(null) }
  }

  const reasonLabels: Record<string, string> = {
    customer_change: 'Changed Mind', defective: 'Defective', wrong_item: 'Wrong Item',
    damaged: 'Damaged', other: 'Other',
  }

  const statusBadge = (s: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700', refunded: 'bg-blue-100 text-blue-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[s] || 'bg-gray-100 text-gray-700'}`}>{s}</span>
  }

  const columns: ColumnDef<ReturnReq>[] = [
    { accessorKey: 'rmaNumber', header: 'RMA #', cell: ({ row }) => <span className="font-mono font-medium text-navy">{row.original.rmaNumber}</span> },
    { accessorKey: 'order.orderNumber', header: 'Order', cell: ({ row }) => <span className="text-navy">{row.original.order.orderNumber}</span> },
    { accessorKey: 'order.fullName', header: 'Customer' },
    {
      accessorKey: 'product.name', header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.product.imageUrl && <img src={row.original.product.imageUrl} className="h-7 w-7 rounded object-cover" />}
          <span>{row.original.product.name} <span className="text-muted-foreground text-xs">({row.original.product.sku})</span></span>
        </div>
      ),
    },
    { accessorKey: 'quantity', header: 'Qty', cell: ({ row }) => <span className="font-medium text-navy">{row.original.quantity}</span> },
    { accessorKey: 'reason', header: 'Reason', cell: ({ row }) => <span className="text-xs text-muted-foreground">{reasonLabels[row.original.reason] || row.original.reason}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    {
      id: 'actions', header: '',
      cell: ({ row }) => {
        if (row.original.status !== 'pending') return <span className="text-xs text-muted-foreground">—</span>
        return (
          <div className="flex gap-1">
            <button onClick={() => updateStatus(row.original.id, 'approved')} disabled={actionLoading === row.original.id} className="p-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50" title="Approve"><CheckCircle className="h-4 w-4" /></button>
            <button onClick={() => updateStatus(row.original.id, 'rejected')} disabled={actionLoading === row.original.id} className="p-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50" title="Reject"><XCircle className="h-4 w-4" /></button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader title="Returns Dashboard" subtitle="Manage RMA requests" />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search RMA or order..." className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <DataTable columns={columns} data={returns} keyExtractor={r => r.id} loading={loading} emptyTitle="No return requests" />
      <Pagination page={page} totalPages={totalPages} totalItems={returns.length} pageSize={20} onPageChange={setPage} onPageSizeChange={() => {}} />
    </div>
  )
}
