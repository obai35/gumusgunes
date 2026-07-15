'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { SearchInput } from '@/components/admin/SearchInput'
import { Pagination } from '@/components/admin/Pagination'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

type BlogPost = {
  id: string; title: string; slug: string; content: string
  excerpt: string | null; featuredImage: string | null
  category: string | null; status: string
  publishedAt: string | null; createdAt: string; updatedAt: string
}

export default function BlogListPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  function fetchPosts() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (search) params.set('search', search)

    fetch(`/api/admin/content/blog?${params}`)
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || [])
        setTotal(d.total || 0)
        setTotalPages(d.totalPages || 0)
      })
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { fetchPosts() }, [page])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/content/blog/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setPosts(prev => prev.filter(p => p.id !== deleteId))
        setTotal(prev => prev - 1)
        toast.success('Post deleted')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteId(null); setDeleting(false) }
  }

  async function toggleStatus(post: BlogPost) {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const res = await fetch(`/api/admin/content/blog/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: newStatus, publishedAt: newStatus === 'published' ? new Date().toISOString() : p.publishedAt } : p))
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'}`)
    } else toast.error('Failed to update status')
  }

  const columns: ColumnDef<BlogPost>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.featuredImage && (
            <img src={row.original.featuredImage} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
          )}
          <div>
            <span className="font-medium text-navy">{row.original.title}</span>
            {row.original.category && (
              <span className="block text-xs text-muted-foreground">{row.original.category}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <button
          onClick={() => toggleStatus(row.original)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${
            row.original.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {row.original.status === 'published' ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.status}
        </button>
      ),
    },
    {
      accessorKey: 'publishedAt',
      header: 'Published',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {row.original.publishedAt ? new Date(row.original.publishedAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => router.push(`/admin/content/blog/${row.original.id}`)} className="p-1.5 rounded-lg text-navy hover:text-gold hover:bg-gray-50 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ], [router])

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        subtitle={`${total} post${total !== 1 ? 's' : ''}`}
        actions={
          <button onClick={() => router.push('/admin/content/blog/new')} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New Post
          </button>
        }
      />

      <div className="mb-5">
        <SearchInput value={search} onChange={setSearch} placeholder="Search posts..." className="max-w-sm" />
      </div>

      <DataTable
        columns={columns}
        data={posts}
        loading={loading}
        keyExtractor={p => p.id}
        emptyTitle="No blog posts yet"
        emptyDescription="Create your first blog post to get started."
        emptyAction={{ label: 'New Post', onClick: () => router.push('/admin/content/blog/new') }}
        onRowClick={p => router.push(`/admin/content/blog/${p.id}`)}
      />

      <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title="Delete post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
