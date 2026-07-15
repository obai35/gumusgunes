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

type StaticPage = {
  id: string; slug: string; title: string; content: string
  status: string; createdAt: string; updatedAt: string
}

export default function PagesListPage() {
  const router = useRouter()
  const [pages, setPages] = useState<StaticPage[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/content/pages')
      .then(r => r.json())
      .then(data => setPages(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load pages'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/content/pages/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setPages(prev => prev.filter(p => p.id !== deleteId))
        toast.success('Page deleted')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteId(null) }
  }

  const columns: ColumnDef<StaticPage>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.title}</span>,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
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
      header: 'Status',
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
      header: 'Updated',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.updatedAt).toLocaleDateString()}</span>,
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
        title="Static Pages"
        subtitle={`${pages.length} page${pages.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => router.push('/admin/content/pages/new')} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New Page
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={pages}
        loading={loading}
        keyExtractor={p => p.id}
        emptyTitle="No static pages yet"
        emptyDescription="Create pages like About, Privacy Policy, Terms of Service."
        emptyAction={{ label: 'New Page', onClick: () => router.push('/admin/content/pages/new') }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title="Delete page"
        description="Are you sure you want to delete this page?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
