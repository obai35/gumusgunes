'use client'

import { useState, useEffect } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Sale = { id: string; name: string; appliesTo: string; discountType: string; discountValue: number; minOrder: number | null; startDate: string; endDate: string; isActive: boolean; createdAt: string }

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const router = useRouter()

  function fetchSales() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/sales?' + p).then(r => r.json()).then(d => { setSales(d.sales || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchSales() }, [page])

  async function handleDelete() { if (!deleteId) return; const r = await fetch('/api/admin/sales/' + deleteId, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); setDeleteId(null); fetchSales() } else { toast.error('Failed') } }

  const now = new Date()
  const active = sales.filter(s => s.isActive && new Date(s.startDate) <= now && new Date(s.endDate) >= now).length
  const upcoming = sales.filter(s => s.isActive && new Date(s.startDate) > now).length
  const ended = sales.filter(s => !s.isActive || new Date(s.endDate) < now).length

  const columns: ColumnDef<Sale>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => (
      <Link href={'/admin/marketing/sales/' + row.original.id} className="text-sm font-medium text-navy hover:underline flex items-center gap-1.5">{row.original.name}</Link>
    )},
    { accessorKey: 'appliesTo', header: 'Type', cell: ({ row }) => <span className="text-xs capitalize bg-gray-100 px-2 py-0.5 rounded">{row.original.appliesTo}</span> },
    { accessorKey: 'discountValue', header: 'Discount', cell: ({ row }) => <span className="text-sm font-medium">{row.original.discountType === 'PERCENTAGE' ? row.original.discountValue + '%' : '$' + row.original.discountValue.toFixed(2)}</span> },
    { accessorKey: 'startDate', header: 'Starts', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.startDate).toLocaleDateString()}</span> },
    { accessorKey: 'endDate', header: 'Ends', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.endDate).toLocaleDateString()}</span> },
    { accessorKey: 'isActive', header: 'Status', cell: ({ row }) => {
      const s = row.original; const n = new Date()
      let label = 'Inactive', cls = 'bg-gray-100 text-gray-600'
      if (s.isActive && new Date(s.startDate) <= n && new Date(s.endDate) >= n) { label = 'Active'; cls = 'bg-green-100 text-green-700' }
      else if (s.isActive && new Date(s.startDate) > n) { label = 'Upcoming'; cls = 'bg-blue-100 text-blue-700' }
      else if (s.isActive && new Date(s.endDate) < n) { label = 'Ended'; cls = 'bg-red-100 text-red-700' }
      return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + cls}>{label}</span>
    }},
    { id: 'actions', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/admin/marketing/sales/' + row.original.id)} className="p-1.5 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Flash Sales" backHref="/admin/marketing" actions={<Link href="/admin/marketing/sales/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create</Link>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Active Now</p><p className="text-xl font-bold text-green-600">{active}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Upcoming</p><p className="text-xl font-bold text-blue-600">{upcoming}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Ended</p><p className="text-xl font-bold text-muted-foreground">{ended}</p></div>
      </div>

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={sales} loading={loading} keyExtractor={s => s.id} emptyTitle="No flash sales" emptyDescription="Create your first flash sale campaign." />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
      <ConfirmDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete Sale" description="Are you sure? This cannot be undone." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
