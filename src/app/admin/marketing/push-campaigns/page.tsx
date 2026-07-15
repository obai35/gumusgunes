'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'

type PC = { id: string; name: string; title: string; segment: string; status: string; sentCount: number; createdAt: string }

export default function PushCampaignsPage() {
  const [campaigns, setCampaigns] = useState<PC[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [deleteId, setDeleteId] = useState<string | null>(null)

  function loadCampaigns() { setLoading(true); globalThis.fetch('/api/admin/push-campaigns?page=' + page).then(r => r.json()).then(d => { setCampaigns(d.campaigns || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false)) }
  useEffect(() => { loadCampaigns() }, [page])
  async function handleDelete() { if (!deleteId) return; try { await fetch('/api/admin/push-campaigns/' + deleteId, { method: 'DELETE' }); setCampaigns(p => p.filter(c => c.id !== deleteId)); toast.success('Deleted') } catch { toast.error('Failed') }; setDeleteId(null) }

  const columns: ColumnDef<PC>[] = [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className="font-medium text-navy">{row.original.name}</span> },
    { accessorKey: 'title', header: 'Title', cell: ({ row }) => <span className="text-muted-foreground">{row.original.title}</span> },
    { accessorKey: 'segment', header: 'Segment', cell: ({ row }) => <span className="text-xs text-muted-foreground capitalize">{row.original.segment}</span> },
    { accessorKey: 'status', header: 'Status', cell: ({ row }) => { const s: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', sent: 'bg-green-100 text-green-700' }; return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s[row.original.status] || 'bg-yellow-100 text-yellow-700')}>{row.original.status}</span> } },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="flex items-center justify-end gap-1">
        <Link href={'/admin/marketing/push-campaigns/' + row.original.id} className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50"><Eye className="h-3.5 w-3.5" /></Link>
        {row.original.status === 'draft' && <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button>}
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Push Campaigns" backHref="/admin/marketing" actions={<Link href="/admin/marketing/push-campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> New</Link>} />
      <DataTable columns={columns} data={campaigns} loading={loading} keyExtractor={c => c.id} emptyTitle="No push campaigns" emptyDescription="Create your first push campaign" emptyAction={{ label: 'New', onClick: () => window.location.href = '/admin/marketing/push-campaigns/new' }} />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />
      <ConfirmDialog open={deleteId !== null} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete" description="Sure?" confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
