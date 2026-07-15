'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Percent, DollarSign, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

export default function CouponsPage() {
  const [discounts, setDiscounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  function fetchDiscounts() {
    setLoading(true)
    fetch('/api/admin/discounts').then(r => r.json()).then(data => setDiscounts(Array.isArray(data.discounts) ? data.discounts : [])).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }
  useEffect(() => { fetchDiscounts() }, [])
  async function handleDelete() {
    if (!deleteId) return
    try { const res = await fetch('/api/admin/discounts/' + deleteId, { method: 'DELETE' }); if (res.ok) { setDiscounts(prev => prev.filter(d => d.id !== deleteId)); toast.success('Deleted') } else toast.error('Failed') } catch { toast.error('Failed') }
    finally { setDeleteId(null) }
  }
  const columns: ColumnDef<any>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => <span className="font-mono font-bold text-navy bg-gray-100 px-2 py-0.5 rounded text-xs">{row.original.code}</span> },
    { accessorKey: 'type', header: 'Type', cell: ({ row }) => <span className="flex items-center gap-1 text-muted-foreground text-xs">{row.original.type === 'PERCENTAGE' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}{row.original.type}</span> },
    { accessorKey: 'value', header: 'Value', cell: ({ row }) => <span className="font-medium text-navy">{row.original.type === 'PERCENTAGE' ? row.original.value + '%' : '$' + row.original.value.toFixed(2)}</span> },
    { accessorKey: 'usedCount', header: 'Usage', cell: ({ row }) => <span className="text-muted-foreground">{row.original.usedCount}{row.original.maxUses ? ' / ' + row.original.maxUses : ''}</span> },
    { accessorKey: 'expiresAt', header: 'Expires', cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}</span> },
    { accessorKey: 'isActive', header: 'Active', cell: ({ row }) => <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>{row.original.isActive ? 'Active' : 'Inactive'}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={'/admin/marketing/coupons/' + row.original.id} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="h-3.5 w-3.5" /></Link>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    )},
  ]
  return (
    <div>
      <PageHeader title="Coupons" backHref="/admin/marketing" actions={<Link href="/admin/discounts/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create Coupon</Link>} />
      <DataTable columns={columns} data={discounts} loading={loading} keyExtractor={d => d.id} emptyTitle="No coupons yet" emptyDescription="Create your first discount coupon" emptyAction={{ label: 'Create Coupon', onClick: () => window.location.href = '/admin/discounts/new' }} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete" description="This cannot be undone." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
