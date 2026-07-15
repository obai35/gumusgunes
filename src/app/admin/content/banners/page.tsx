'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

type Banner = {
  id: string; title: string | null; imageUrl: string; linkUrl: string | null
  textOverlay: string | null; sortOrder: number; isActive: boolean
  startDate: string | null; endDate: string | null
}

export default function BannersListPage() {
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/content/banners')
      .then(r => r.json())
      .then(data => setBanners(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load banners'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/content/banners/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setBanners(prev => prev.filter(b => b.id !== deleteId))
        toast.success('Banner deleted')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteId(null) }
  }

  async function toggleActive(banner: Banner) {
    const res = await fetch(`/api/admin/content/banners/${banner.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !banner.isActive }),
    })
    if (res.ok) {
      setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b))
    } else toast.error('Failed to toggle')
  }

  const columns: ColumnDef<Banner>[] = [
    {
      accessorKey: 'imageUrl',
      header: 'Image',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.imageUrl} alt={row.original.title || ''} className="h-14 w-24 rounded-lg object-cover shrink-0" />
          <span className="font-medium text-navy">{row.original.title || 'Untitled'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sortOrder',
      header: 'Order',
      size: 60,
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <button onClick={() => toggleActive(row.original)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {row.original.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Schedule',
      cell: ({ row }) => (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {row.original.startDate ? new Date(row.original.startDate).toLocaleDateString() : 'Always'}
          {row.original.endDate && <> – {new Date(row.original.endDate).toLocaleDateString()}</>}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => router.push(`/admin/content/banners/${row.original.id}`)} className="p-1.5 rounded-lg text-navy hover:text-gold hover:bg-gray-50 transition-colors">
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
        title="Banners / Sliders"
        subtitle={`${banners.length} banner${banners.length !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => router.push('/admin/content/banners/new')} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New Banner
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={banners}
        loading={loading}
        keyExtractor={b => b.id}
        emptyTitle="No banners yet"
        emptyDescription="Create your first banner to display on the homepage slider."
        emptyAction={{ label: 'New Banner', onClick: () => router.push('/admin/content/banners/new') }}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title="Delete banner"
        description="Are you sure you want to delete this banner?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
