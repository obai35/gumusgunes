'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import type { ColumnDef } from '@tanstack/react-table'

type PO = {
  id: string
  poNumber: string
  supplier: { name: string }
  status: string
  total: number
  createdAt: string
}

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  async function fetchPOs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', String(page))
      const res = await fetch(`/api/admin/purchase-orders?${params}`)
      const data = await res.json()
      if (data.ok) {
        setPurchaseOrders(data.purchaseOrders || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch { toast.error('Failed to load purchase orders') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchPOs() }, [page, statusFilter])

  const statusBadge = (status: string) => {
    const m: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', partial: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>
  }

  const columns: ColumnDef<PO>[] = [
    { accessorKey: 'poNumber', header: 'PO #', cell: ({ row }) => <span className="font-mono text-navy font-medium">{row.original.poNumber}</span> },
    { accessorKey: 'supplier.name', header: 'Supplier' },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => statusBadge(row.original.status) },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium text-navy">${row.original.total.toFixed(2)}</span> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    { id: 'actions', header: '', cell: ({ row }) => <Link href={`/admin/purchase-orders/${row.original.id}`} className="text-gold text-xs font-medium hover:text-gold/80">View →</Link> },
  ]

  return (
    <div>
      <PageHeader title="Purchase Orders" actions={<Link href="/admin/purchase-orders/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> New PO</Link>} />
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search PO number..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 rounded-lg border border-border text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="received">Received</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <DataTable columns={columns} data={purchaseOrders} keyExtractor={po => po.id} loading={loading} emptyTitle="No purchase orders yet" emptyAction={{ label: 'Create PO', onClick: () => window.location.href = '/admin/purchase-orders/new' }} />
      <Pagination page={page} totalPages={totalPages} totalItems={purchaseOrders.length} pageSize={20} onPageChange={setPage} onPageSizeChange={() => {}} />
    </div>
  )
}
