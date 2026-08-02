'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type StaticPage = {
  id: string; slug: string; title: string; content: string
  status: string; createdAt: string; updatedAt: string
}

export default function PagesListPage() {
  const router = useRouter()
  const [pages, setPages] = useState<StaticPage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => {
    fetch('/api/admin/content/pages')
      .then(r => r.json())
      .then(data => setPages(Array.isArray(data) ? data : []))
      .catch(() => toast.error(ta('Failed to load pages')))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/content/pages/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== deleteId))
        toast.success(ta('Page deleted'))
      } else {
        const e = await res.json()
        toast.error(e.error || ta('Failed to delete'))
      }
    } catch { toast.error(ta('Failed to delete')) }
    finally { setDeleteId(null) }
  }

  const columns: ColumnDef<StaticPage>[] = [
    {
      accessorKey: 'title',
      header: ta('Title'),
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.title}</span>,
    },
    {
      accessorKey: 'slug',
      header: ta('Slug'),
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span>
          <Link href={`/page/${row.original.slug}`} target="_blank" className="text-gold hover:text-gold-soft">
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: ta('Status'),
      cell: ({ row }) => (
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium w-fit ${
          row.original.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {row.original.status === 'published' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: ta('Updated'),
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{fmtDate(row.original.updatedAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => router.push(`/admin/content/pages/${row.original.id}`)} className="p-1.5 rounded-lg text-navy hover:text-gold hover:bg-gray-50 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title={ta('Static Pages')}
        subtitle={ta(`${pages.length} page${pages.length !== 1 ? 's' : ''}`)}
        actions={
          <button onClick={() => router.push('/admin/content/pages/new')} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> {ta('New Page')}
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={pages}
        loading={loading}
        keyExtractor={p => p.id}
        emptyTitle={ta('No static pages yet')}
        emptyDescription={ta('Create pages like About, Privacy Policy, Terms of Service.')}
        emptyAction={{ label: ta('New Page'), onClick: () => router.push('/admin/content/pages/new') }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title={ta('Delete page')}
        description={ta('Are you sure you want to delete this page?')}
        confirmLabel={ta('Delete')}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
