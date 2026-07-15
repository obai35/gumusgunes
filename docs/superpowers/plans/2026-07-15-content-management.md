# Content Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add blog, FAQ, banners/slider, static pages, and media gallery to the admin panel with corresponding public-facing pages.

**Architecture:** Four new Prisma models for structured content, new admin routes under `/admin/content/` with per-section pages, API routes under `/api/admin/content/`, and public rendering pages for each content type. Media gallery uses filesystem-based storage under `public/uploads/media/`.

**Tech Stack:** Next.js 14, React 18, Prisma, TypeScript, Tailwind CSS, shadcn/ui, lucide-react, sonner, framer-motion, @tanstack/react-table

---

### Task 1: Prisma Models & Permissions

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/lib/admin-permissions.ts`

- [ ] **Add four new models to `prisma/schema.prisma`**

Insert after the `model ResetToken` block (before the WhatsApp chat models) or at the end of the file before the last closing. Place after line 642:

```prisma
// ── Content Management ──

model BlogPost {
  id            String    @id @default(cuid())
  title         String
  slug          String    @unique
  content       String
  excerpt       String?
  featuredImage String?
  category      String?
  status        String    @default("draft") // draft | published
  publishedAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([status, publishedAt])
  @@index([slug])
}

model FaqEntry {
  id        String  @id @default(cuid())
  question  String
  answer    String
  category  String  @default("General")
  sortOrder Int     @default(0)
  isActive  Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([sortOrder])
}

model Banner {
  id          String    @id @default(cuid())
  title       String?
  imageUrl    String
  linkUrl     String?
  textOverlay String?
  sortOrder   Int       @default(0)
  isActive    Boolean   @default(true)
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([isActive, sortOrder])
  @@index([startDate, endDate])
}

model StaticPage {
  id        String   @id @default(cuid())
  slug      String   @unique
  title     String
  content   String
  status    String   @default("published") // draft | published
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([slug, status])
}
```

- [ ] **Add new permissions to `ALL_PERMISSIONS` in `src/lib/admin-permissions.ts`**

Edit line ~6:

```
export const ALL_PERMISSIONS = [
  'dashboard', 'accounting', 'orders', 'receipts', 'products', 'inventory',
  'discounts', 'stock_transfers', 'branches', 'pos', 'editor', 'categories',
  'settings', 'security', 'admins', 'customers', 'payments', 'shipping',
  'reviews', 'newsletter', 'activity', 'chat', 'seed', 'customer_service', 'social',
  'blog', 'faq', 'banners', 'pages', 'media',
] as const
```

- [ ] **Run Prisma migration**

```bash
npx prisma migrate dev --name add_content_management_models
```

---

### Task 2: Blog API Routes

**Files:**
- Create: `src/app/api/admin/content/blog/route.ts`
- Create: `src/app/api/admin/content/blog/[id]/route.ts`

- [ ] **Create the list/create blog API route**

Create `src/app/api/admin/content/blog/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreatePostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
}).strict()

export const GET = withAdmin(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const take = 20
  const skip = (page - 1) * take
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { excerpt: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (status === 'draft' || status === 'published') {
    where.status = status
  }

  const [posts, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
    db.blogPost.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / take) })
}, 'blog')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = CreatePostSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { title, slug, content, excerpt, featuredImage, category, status } = parsed.data

    const existing = await db.blogPost.findUnique({ where: { slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const post = await db.blogPost.create({
      data: {
        title, slug, content, excerpt, featuredImage, category, status,
        publishedAt: status === 'published' ? new Date() : null,
      },
    })

    return NextResponse.json(post)
  } catch (err) {
    console.error('Create blog post error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}, 'blog')
```

- [ ] **Create the single-item blog API route (GET/PUT/DELETE)**

Create `src/app/api/admin/content/blog/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const post = await db.blogPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json(post)
}, 'blog')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const body = await req.json()
    const { title, slug, content, excerpt, featuredImage, category, status } = body

    if (slug && slug !== existing.slug) {
      const slugConflict = await db.blogPost.findUnique({ where: { slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }

    const wasPublished = status === 'published' && existing.status !== 'published'

    const post = await db.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(excerpt !== undefined && { excerpt }),
        ...(featuredImage !== undefined && { featuredImage }),
        ...(category !== undefined && { category }),
        ...(status !== undefined && { status }),
        ...(wasPublished && { publishedAt: new Date() }),
      },
    })

    return NextResponse.json(post)
  } catch (err) {
    console.error('Update blog post error:', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}, 'blog')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.blogPost.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    await db.blogPost.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete blog post error:', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}, 'blog')
```

---

### Task 3: Blog Admin List Page

**Files:**
- Create: `src/app/admin/content/blog/page.tsx`
- Create: `src/app/admin/content/blog/loading.tsx`
- Create: `src/app/admin/content/blog/error.tsx`

- [ ] **Create blog loading page**

Create `src/app/admin/content/blog/loading.tsx`:

```tsx
export default function Loading() {
  return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>
}
```

- [ ] **Create blog error page**

Create `src/app/admin/content/blog/error.tsx`:

```tsx
'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load blog</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
```

- [ ] **Create blog list page**

Create `src/app/admin/content/blog/page.tsx`:

```tsx
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
import { ActionMenu } from '@/components/admin/ActionMenu'

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
```

---

### Task 4: Blog Admin Create & Edit Pages

**Files:**
- Create: `src/app/admin/content/blog/new/page.tsx`
- Create: `src/app/admin/content/blog/[id]/page.tsx`

- [ ] **Create blog post form page (new)**

Create `src/app/admin/content/blog/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { ArrowLeft } from 'lucide-react'

export default function NewBlogPostPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [saving, setSaving] = useState(false)

  function autoSlug(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit(publishStatus?: 'draft' | 'published') {
    if (!title || !slug || !content) { toast.error('Title, slug, and content are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, excerpt, featuredImage, category, status: publishStatus || status }),
      })
      if (res.ok) {
        toast.success('Post created')
        router.push('/admin/content/blog')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to create')
      }
    } catch { toast.error('Failed to create post') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="New Blog Post" backHref="/admin/content/blog" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => { setTitle(e.target.value); autoSlug(e.target.value) }} placeholder="Post title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="post-slug" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief summary..." rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h2>Post content here...</h2>" rows={16} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
              <input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Jewelry Tips" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">{saving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Publishing...' : 'Publish'}</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create blog post edit page**

Create `src/app/admin/content/blog/[id]/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/content/blog/${id}`)
      .then(r => r.json())
      .then(p => {
        if (p.error) { toast.error(p.error); return }
        setTitle(p.title); setSlug(p.slug); setContent(p.content)
        setExcerpt(p.excerpt || ''); setFeaturedImage(p.featuredImage || '')
        setCategory(p.category || ''); setStatus(p.status)
      })
      .catch(() => toast.error('Failed to load post'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(publishStatus?: 'draft' | 'published') {
    if (!title || !slug || !content) { toast.error('Title, slug, and content are required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, excerpt, featuredImage, category, status: publishStatus || status }),
      })
      if (res.ok) {
        toast.success('Post updated')
        router.push('/admin/content/blog')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to update')
      }
    } catch { toast.error('Failed to update post') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>

  return (
    <div>
      <PageHeader title="Edit Blog Post" backHref="/admin/content/blog" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="post-slug" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief summary..." rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h2>Post content here...</h2>" rows={16} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Featured Image URL</label>
              <input value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Jewelry Tips" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={() => handleSubmit('draft')} disabled={saving} className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">{saving ? 'Saving...' : 'Save Draft'}</button>
          <button onClick={() => handleSubmit('published')} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Publishing...' : 'Publish'}</button>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 5: Blog Public Pages

**Files:**
- Create: `src/app/blog/page.tsx`
- Create: `src/app/blog/[slug]/page.tsx`

- [ ] **Create public blog listing page**

Create `src/app/blog/page.tsx`:

```tsx
import { db } from '@/lib/db'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || '1'))
  const categoryFilter = sp.category || ''
  const take = 12
  const skip = (page - 1) * take

  const where: any = { status: 'published' }
  if (categoryFilter) where.category = categoryFilter

  const [posts, total, categories] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take,
      skip,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        featuredImage: true, category: true, publishedAt: true,
      },
    }),
    db.blogPost.count({ where }),
    db.blogPost.findMany({
      where: { status: 'published' },
      select: { category: true },
      distinct: ['category'],
    }),
  ])

  const totalPages = Math.ceil(total / take)
  const catList = [...new Set(categories.map(c => c.category).filter(Boolean))] as string[]

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">Blog</li>
            </ol>
          </nav>
          <h1 className="text-4xl font-display font-semibold text-navy mb-2">Our Journal</h1>
          <p className="text-muted-foreground mb-8 max-w-xl">Stories, guides, and insights from the world of Gümüş Güneş.</p>

          {catList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              <Link href="/blog" className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${!categoryFilter ? 'bg-navy text-silver' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>All</Link>
              {catList.map(cat => (
                <Link key={cat} href={`/blog?category=${encodeURIComponent(cat)}`} className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${categoryFilter === cat ? 'bg-navy text-silver' : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'}`}>{cat}</Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-lg transition-all">
                    {post.featuredImage ? (
                      <div className="aspect-[16/9] overflow-hidden">
                        <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-gold/10 to-navy/10 flex items-center justify-center">
                        <span className="text-4xl font-display text-gold/30">GG</span>
                      </div>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <span className="text-[10px] tracking-widest uppercase text-gold font-semibold">{post.category}</span>
                      )}
                      <h3 className="font-display text-lg font-semibold text-navy mt-1 mb-2 group-hover:text-gold transition-colors">{post.title}</h3>
                      {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        {post.publishedAt && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.publishedAt).toLocaleDateString()}</span>
                        )}
                        <span className="flex items-center gap-1 text-gold group-hover:gap-2 transition-all">Read <ArrowRight className="h-3 w-3" /></span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-12">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <Link key={p} href={`/blog?page=${p}${categoryFilter ? `&category=${encodeURIComponent(categoryFilter)}` : ''}`}
                      className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${p === page ? 'bg-navy text-silver' : 'text-muted-foreground hover:bg-secondary'}`}>
                      {p}
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
```

- [ ] **Create public blog single post page**

Create `src/app/blog/[slug]/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, ArrowLeft } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export async function generateStaticParams() {
  const posts = await db.blogPost.findMany({ where: { status: 'published' }, select: { slug: true } })
  return posts.map(p => ({ slug: p.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await db.blogPost.findUnique({ where: { slug } })
  if (!post || post.status !== 'published') notFound()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li><Link href="/blog" className="hover:text-gold transition-colors">Blog</Link></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium truncate max-w-[200px]">{post.title}</li>
            </ol>
          </nav>

          <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Blog
          </Link>

          {post.featuredImage && (
            <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
              <img src={post.featuredImage} alt={post.title} className="h-full w-full object-cover" />
            </div>
          )}

          <header className="mb-8">
            {post.category && (
              <span className="text-xs tracking-widest uppercase text-gold font-semibold">{post.category}</span>
            )}
            <h1 className="text-3xl sm:text-4xl font-display font-semibold text-navy mt-2 mb-3">{post.title}</h1>
            {post.publishedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}
          </header>

          <div
            className="prose prose-gray max-w-none prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.excerpt && (
            <div className="mt-10 p-6 bg-secondary/30 rounded-xl border border-border/60">
              <p className="text-sm text-muted-foreground italic">{post.excerpt}</p>
            </div>
          )}
        </article>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
```

---

### Task 6: FAQ API Routes

**Files:**
- Create: `src/app/api/admin/content/faq/route.ts`
- Create: `src/app/api/admin/content/faq/[id]/route.ts`
- Create: `src/app/api/admin/content/faq/reorder/route.ts`

- [ ] **Create FAQ list/create API route**

Create `src/app/api/admin/content/faq/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreateFaqSchema = z.object({
  question: z.string().min(1).max(500),
  answer: z.string().min(1),
  category: z.string().max(100).default('General'),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
}).strict()

export const GET = withAdmin(async () => {
  const entries = await db.faqEntry.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(entries)
}, 'faq')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = CreateFaqSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const maxSort = await db.faqEntry.aggregate({ _max: { sortOrder: true } })
    const entry = await db.faqEntry.create({
      data: { ...parsed.data, sortOrder: parsed.data.sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1 },
    })
    return NextResponse.json(entry)
  } catch (err) {
    console.error('Create FAQ error:', err)
    return NextResponse.json({ error: 'Failed to create FAQ entry' }, { status: 500 })
  }
}, 'faq')
```

- [ ] **Create FAQ single-item API route**

Create `src/app/api/admin/content/faq/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.faqEntry.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 })
    const body = await req.json()
    const entry = await db.faqEntry.update({ where: { id }, data: body })
    return NextResponse.json(entry)
  } catch (err) {
    console.error('Update FAQ error:', err)
    return NextResponse.json({ error: 'Failed to update FAQ entry' }, { status: 500 })
  }
}, 'faq')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.faqEntry.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'FAQ entry not found' }, { status: 404 })
    await db.faqEntry.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete FAQ error:', err)
    return NextResponse.json({ error: 'Failed to delete FAQ entry' }, { status: 500 })
  }
}, 'faq')
```

- [ ] **Create FAQ reorder API route**

Create `src/app/api/admin/content/faq/reorder/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), sortOrder: z.number().int() })),
}).strict()

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = ReorderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    await db.$transaction(
      parsed.data.items.map(item =>
        db.faqEntry.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      )
    )
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Reorder FAQ error:', err)
    return NextResponse.json({ error: 'Failed to reorder FAQs' }, { status: 500 })
  }
}, 'faq')
```

---

### Task 7: FAQ Admin Page

**Files:**
- Create: `src/app/admin/content/faq/page.tsx`
- Create: `src/app/admin/content/faq/loading.tsx`
- Create: `src/app/admin/content/faq/error.tsx`

- [ ] **Create FAQ loading page**

Create `src/app/admin/content/faq/loading.tsx`:

```tsx
export default function Loading() {
  return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>
}
```

- [ ] **Create FAQ error page**

Create `src/app/admin/content/faq/error.tsx`:

```tsx
'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load FAQ entries</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
```

- [ ] **Create FAQ admin page with drag reorder**

Create `src/app/admin/content/faq/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, X } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { motion, AnimatePresence } from 'framer-motion'
import type { ColumnDef } from '@tanstack/react-table'

type FaqEntry = {
  id: string; question: string; answer: string
  category: string; sortOrder: number; isActive: boolean
}

export default function FaqAdminPage() {
  const [entries, setEntries] = useState<FaqEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('General')
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function fetchEntries() {
    setLoading(true)
    fetch('/api/admin/content/faq')
      .then(r => r.json())
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Failed to load FAQ entries'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEntries() }, [])

  function resetForm() {
    setQuestion(''); setAnswer(''); setCategory('General'); setEditId(null)
  }

  async function handleSubmit() {
    if (!question || !answer) { toast.error('Question and answer are required'); return }
    setSaving(true)
    try {
      const url = editId ? `/api/admin/content/faq/${editId}` : '/api/admin/content/faq'
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, answer, category }),
      })
      if (res.ok) {
        toast.success(editId ? 'FAQ updated' : 'FAQ created')
        resetForm(); setShowModal(false); fetchEntries()
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed')
      }
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/admin/content/faq/${deleteId}`, { method: 'DELETE' })
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== deleteId))
        toast.success('FAQ entry deleted')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteId(null) }
  }

  async function toggleActive(entry: FaqEntry) {
    const res = await fetch(`/api/admin/content/faq/${entry.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !entry.isActive }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, isActive: !e.isActive } : e))
    } else toast.error('Failed to toggle')
  }

  async function handleDragEnd() {
    if (dragIndex === null) return
    setDragIndex(null)
    const reordered = entries.map((e, i) => ({ id: e.id, sortOrder: i }))
    const res = await fetch('/api/admin/content/faq/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: reordered }),
    })
    if (!res.ok) { toast.error('Failed to save order'); fetchEntries() }
  }

  function openEdit(entry: FaqEntry) {
    setQuestion(entry.question); setAnswer(entry.answer)
    setCategory(entry.category); setEditId(entry.id); setShowModal(true)
  }

  const columns: ColumnDef<FaqEntry>[] = [
    {
      id: 'drag',
      header: '',
      size: 40,
      cell: ({ row }) => (
        <div
          draggable
          onDragStart={() => setDragIndex(row.index)}
          onDragOver={(e) => {
            e.preventDefault()
            if (dragIndex === null || dragIndex === row.index) return
            const reordered = [...entries]
            const [moved] = reordered.splice(dragIndex, 1)
            reordered.splice(row.index, 0, moved)
            setEntries(reordered)
            setDragIndex(row.index)
          }}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-navy p-1"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      ),
    },
    {
      accessorKey: 'question',
      header: 'Question',
      cell: ({ row }) => <span className="font-medium text-navy">{row.original.question}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground font-medium">{row.original.category}</span>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ row }) => (
        <button
          onClick={() => toggleActive(row.original)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${row.original.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {row.original.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          {row.original.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => openEdit(row.original)} className="p-1.5 rounded-lg text-navy hover:text-gold hover:bg-gray-50 transition-colors">
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
        title="FAQ Management"
        subtitle={`${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}`}
        actions={
          <button onClick={() => { resetForm(); setShowModal(true) }} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
            <Plus className="h-4 w-4" /> New FAQ
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={entries}
        loading={loading}
        keyExtractor={e => e.id}
        emptyTitle="No FAQ entries yet"
        emptyDescription="Add frequently asked questions for your customers."
        emptyAction={{ label: 'New FAQ', onClick: () => { resetForm(); setShowModal(true) } }}
      />

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy">{editId ? 'Edit FAQ' : 'New FAQ'}</h3>
                <button onClick={() => { setShowModal(false); resetForm() }}><X className="h-4 w-4 text-muted-foreground" /></button>
              </div>
              <div className="space-y-3">
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Question" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Answer" rows={4} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
                <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Category (e.g. Shipping, Returns)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button onClick={() => { setShowModal(false); resetForm() }} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
                <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : editId ? 'Update' : 'Create'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={o => { if (!o) setDeleteId(null) }}
        title="Delete FAQ entry"
        description="Are you sure you want to delete this FAQ entry?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
```

---

### Task 8: FAQ Public Page Update

**Files:**
- Modify: `src/app/faq/page.tsx`

- [ ] **Update FAQ page to fetch from API with fallback to hardcoded data**

Replace the entire content of `src/app/faq/page.tsx`:

```tsx
'use client'

import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { ChevronDown, Search } from 'lucide-react'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

const fallbackFaqs = [
  { category: 'Ordering', question: 'How do I place an order?', answer: 'Browse our collection, select your items, and proceed to checkout. You can pay via credit card, bank transfer, Instapay, Vodafone Cash, or cash on delivery.' },
  { category: 'Ordering', question: 'Can I modify or cancel my order?', answer: 'Orders can be modified or cancelled within 1 hour of placement. Please contact our concierge team for assistance.' },
  { category: 'Shipping', question: 'What are your shipping options?', answer: 'We offer standard (5-8 business days) and express (1-3 business days) shipping within Egypt. International shipping takes 7-14 business days.' },
  { category: 'Returns', question: 'What is your return policy?', answer: 'We accept returns within 30 days of delivery. Items must be unworn with original packaging. Personalized items are final sale.' },
  { category: 'Product Care', question: 'How do I care for my jewelry?', answer: 'Store in a dry place, avoid contact with water and perfumes. Clean with a soft, dry cloth.' },
  { category: 'Account', question: 'How do I create an account?', answer: 'Click the user icon in the top right and select "Sign Up". Enter your name, email, and password to create your account.' },
]

export default function FaqPage() {
  const [faqs, setFaqs] = useState(fallbackFaqs)
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/admin/content/faq')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqs(data.filter(f => f.isActive).map(f => ({ category: f.category, question: f.question, answer: f.answer })))
        }
      })
      .catch(() => {})
  }, [])

  const categories = [...new Set(faqs.map(f => f.category))]

  const filtered = faqs.filter(
    f => f.question.toLowerCase().includes(search.toLowerCase()) || f.answer.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2">
                <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
                <li><span className="mx-2">/</span></li>
                <li className="text-navy font-medium">FAQ</li>
              </ol>
            </nav>
            <h1 className="text-4xl font-display font-semibold text-navy mb-2">Frequently Asked Questions</h1>
            <p className="text-muted-foreground mb-8 max-w-xl">Find answers to common questions about ordering, shipping, returns, and more.</p>
          </motion.div>

          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions or keywords…" className="w-full h-12 pl-11 pr-4 rounded-xl border border-border bg-background text-navy text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold transition-colors" />
          </div>

          {categories.map(cat => {
            const items = filtered.filter(f => f.category === cat)
            if (items.length === 0) return null
            return (
              <div key={cat} className="mb-10">
                <h2 className="text-xs tracking-widest uppercase text-gold font-semibold mb-4">{cat}</h2>
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const i = faqs.indexOf(item)
                    const open = openIndex === i
                    return (
                      <div key={idx} className="rounded-xl border border-border/60 bg-secondary/20 overflow-hidden">
                        <button onClick={() => setOpenIndex(open ? null : i)} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-navy font-medium hover:bg-secondary/40 transition-colors">
                          <span>{item.question}</span>
                          <ChevronDown className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                        </button>
                        <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="overflow-hidden">
                          <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{item.answer}</div>
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No results found for "{search}".</p>
          )}
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
```

---

### Task 9: Banner API Routes

**Files:**
- Create: `src/app/api/admin/content/banners/route.ts`
- Create: `src/app/api/admin/content/banners/[id]/route.ts`

- [ ] **Create banner list/create API route**

Create `src/app/api/admin/content/banners/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreateBannerSchema = z.object({
  title: z.string().max(200).optional(),
  imageUrl: z.string().min(1),
  linkUrl: z.string().optional(),
  textOverlay: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).strict()

export const GET = withAdmin(async () => {
  const banners = await db.banner.findMany({ orderBy: { sortOrder: 'asc' } })
  return NextResponse.json(banners)
}, 'banners')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = CreateBannerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const { startDate, endDate, ...rest } = parsed.data
    const banner = await db.banner.create({
      data: {
        ...rest,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    })
    return NextResponse.json(banner)
  } catch (err) {
    console.error('Create banner error:', err)
    return NextResponse.json({ error: 'Failed to create banner' }, { status: 500 })
  }
}, 'banners')
```

- [ ] **Create banner single-item API route**

Create `src/app/api/admin/content/banners/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    const body = await req.json()
    const { startDate, endDate, ...rest } = body
    const banner = await db.banner.update({
      where: { id },
      data: {
        ...rest,
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    })
    return NextResponse.json(banner)
  } catch (err) {
    console.error('Update banner error:', err)
    return NextResponse.json({ error: 'Failed to update banner' }, { status: 500 })
  }
}, 'banners')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.banner.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    await db.banner.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete banner error:', err)
    return NextResponse.json({ error: 'Failed to delete banner' }, { status: 500 })
  }
}, 'banners')
```

---

### Task 10: Banner Admin Pages

**Files:**
- Create: `src/app/admin/content/banners/page.tsx`
- Create: `src/app/admin/content/banners/new/page.tsx`
- Create: `src/app/admin/content/banners/[id]/page.tsx`
- Create: `src/app/admin/content/banners/loading.tsx`
- Create: `src/app/admin/content/banners/error.tsx`

- [ ] **Create banners loading page**

Create `src/app/admin/content/banners/loading.tsx`:

```tsx
export default function Loading() {
  return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>
}
```

- [ ] **Create banners error page**

Create `src/app/admin/content/banners/error.tsx`:

```tsx
'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load banners</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
```

- [ ] **Create banners list page**

Create `src/app/admin/content/banners/page.tsx`:

```tsx
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
```

- [ ] **Create banner new page**

Create `src/app/admin/content/banners/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export default function NewBannerPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [textOverlay, setTextOverlay] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!imageUrl) { toast.error('Image URL is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, imageUrl, linkUrl, textOverlay, sortOrder,
          startDate: startDate || null, endDate: endDate || null,
        }),
      })
      if (res.ok) {
        toast.success('Banner created')
        router.push('/admin/content/banners')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to create')
      }
    } catch { toast.error('Failed to create banner') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="New Banner" backHref="/admin/content/banners" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Overlay</label>
            <textarea value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder="Text displayed on the banner" rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Banner'}</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create banner edit page**

Create `src/app/admin/content/banners/[id]/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export default function EditBannerPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [title, setTitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [textOverlay, setTextOverlay] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/content/banners`)
      .then(r => r.json())
      .then(data => {
        const banner = Array.isArray(data) ? data.find(b => b.id === id) : null
        if (!banner) { toast.error('Banner not found'); return }
        setTitle(banner.title || '')
        setImageUrl(banner.imageUrl)
        setLinkUrl(banner.linkUrl || '')
        setTextOverlay(banner.textOverlay || '')
        setSortOrder(banner.sortOrder)
        setIsActive(banner.isActive)
        setStartDate(banner.startDate ? banner.startDate.split('T')[0] : '')
        setEndDate(banner.endDate ? banner.endDate.split('T')[0] : '')
      })
      .catch(() => toast.error('Failed to load banner'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (!imageUrl) { toast.error('Image URL is required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/banners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, imageUrl, linkUrl, textOverlay, sortOrder, isActive,
          startDate: startDate || null, endDate: endDate || null,
        }),
      })
      if (res.ok) {
        toast.success('Banner updated')
        router.push('/admin/content/banners')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to update')
      }
    } catch { toast.error('Failed to update banner') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>

  return (
    <div>
      <PageHeader title="Edit Banner" backHref="/admin/content/banners" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            {imageUrl && <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-full object-cover rounded-lg" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Overlay</label>
            <textarea value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder="Text displayed on the banner" rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
            Active
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : 'Update Banner'}</button>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 11: Homepage Banner Slider Component

**Files:**
- Create: `src/components/store/BannerSlider.tsx`
- Modify: `src/app/HomeClient.tsx`

- [ ] **Create BannerSlider component**

Create `src/components/store/BannerSlider.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

type Banner = {
  id: string; title: string | null; imageUrl: string
  linkUrl: string | null; textOverlay: string | null
  sortOrder: number
}

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/content/banners')
      .then(r => r.json())
      .then(data => {
        const now = new Date()
        const active = (Array.isArray(data) ? data : [])
          .filter((b: any) => {
            if (!b.isActive) return false
            if (b.startDate && new Date(b.startDate) > now) return false
            if (b.endDate && new Date(b.endDate) < now) return false
            return true
          })
          .sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder)
        setBanners(active)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const next = useCallback(() => setCurrent(p => (p + 1) % banners.length), [banners.length])
  const prev = useCallback(() => setCurrent(p => (p - 1 + banners.length) % banners.length), [banners.length])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [banners.length, next])

  if (loading || banners.length === 0) return null

  const banner = banners[current]

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] overflow-hidden bg-navy-deep">
      <AnimatePresence mode="wait">
        <motion.div
          key={banner.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img src={banner.imageUrl} alt={banner.title || ''} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </motion.div>
      </AnimatePresence>

      {banner.textOverlay && (
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 lg:p-16">
          <motion.div
            key={banner.id + '-text'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            {banner.title && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-semibold text-white mb-2">{banner.title}</h2>
            )}
            <p className="text-sm sm:text-base text-white/80 max-w-xl">{banner.textOverlay}</p>
            {banner.linkUrl && (
              <Link href={banner.linkUrl} className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gold text-navy-deep rounded-full text-sm font-semibold hover:bg-gold-soft transition-colors">
                Shop Now
              </Link>
            )}
          </motion.div>
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors backdrop-blur-sm">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-gold' : 'w-2 bg-white/50 hover:bg-white/70'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Add BannerSlider to HomeClient.tsx**

Insert `<BannerSlider />` in `HomeClient.tsx` after the `<Header />` line and before the `<main>`:

```tsx
import { BannerSlider } from '@/components/store/BannerSlider'
```

Add the import near other component imports (around line 13-14) and add the usage after `<Header />` at line ~89:

Edit `src/app/HomeClient.tsx`:

Add import (after the Hero import):
```tsx
import { BannerSlider } from '@/components/store/BannerSlider'
```

Add usage after `<Header />`:
```tsx
      <Header />
      <BannerSlider />
      <main className="flex-1">
```

---

### Task 12: Static Pages API Routes

**Files:**
- Create: `src/app/api/admin/content/pages/route.ts`
- Create: `src/app/api/admin/content/pages/[id]/route.ts`

- [ ] **Create static pages list/create API route**

Create `src/app/api/admin/content/pages/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

const CreatePageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  status: z.enum(['draft', 'published']).default('published'),
}).strict()

export const GET = withAdmin(async () => {
  const pages = await db.staticPage.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(pages)
}, 'pages')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    const body = await req.json()
    const parsed = CreatePageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    const existing = await db.staticPage.findUnique({ where: { slug: parsed.data.slug } })
    if (existing) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })

    const page = await db.staticPage.create({ data: parsed.data })
    return NextResponse.json(page)
  } catch (err) {
    console.error('Create static page error:', err)
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 })
  }
}, 'pages')
```

- [ ] **Create static pages single-item API route**

Create `src/app/api/admin/content/pages/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAdmin } from '@/lib/admin-permissions'

export const GET = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const page = await db.staticPage.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
  return NextResponse.json(page)
}, 'pages')

export const PUT = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.staticPage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    const body = await req.json()
    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await db.staticPage.findUnique({ where: { slug: body.slug } })
      if (slugConflict) return NextResponse.json({ error: 'Slug already exists' }, { status: 400 })
    }
    const page = await db.staticPage.update({ where: { id }, data: body })
    return NextResponse.json(page)
  } catch (err) {
    console.error('Update static page error:', err)
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 })
  }
}, 'pages')

export const DELETE = withAdmin(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  try {
    const existing = await db.staticPage.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    await db.staticPage.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete static page error:', err)
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 })
  }
}, 'pages')
```

---

### Task 13: Static Pages Admin Pages

**Files:**
- Create: `src/app/admin/content/pages/page.tsx`
- Create: `src/app/admin/content/pages/new/page.tsx`
- Create: `src/app/admin/content/pages/[id]/page.tsx`
- Create: `src/app/admin/content/pages/loading.tsx`
- Create: `src/app/admin/content/pages/error.tsx`

- [ ] **Create pages loading page**

Create `src/app/admin/content/pages/loading.tsx`:

```tsx
export default function Loading() {
  return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>
}
```

- [ ] **Create pages error page**

Create `src/app/admin/content/pages/error.tsx`:

```tsx
'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load pages</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
```

- [ ] **Create pages list page**

Create `src/app/admin/content/pages/page.tsx`:

```tsx
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
```

- [ ] **Create pages new page**

Create `src/app/admin/content/pages/new/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export default function NewPagePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [saving, setSaving] = useState(false)

  function autoSlug(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit() {
    if (!title || !slug || !content) { toast.error('Title, slug, and content are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, status }),
      })
      if (res.ok) {
        toast.success('Page created')
        router.push('/admin/content/pages')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to create')
      }
    } catch { toast.error('Failed to create page') }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title="New Static Page" backHref="/admin/content/pages" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => { setTitle(e.target.value); autoSlug(e.target.value) }} placeholder="Page title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Public URL: /page/{slug || 'slug'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h1>About Us</h1><p>Our story...</p>" rows={20} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Creating...' : 'Create Page'}</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Create pages edit page**

Create `src/app/admin/content/pages/[id]/page.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'

export default function EditPagePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/content/pages/${id}`)
      .then(r => r.json())
      .then(p => {
        if (p.error) { toast.error(p.error); return }
        setTitle(p.title); setSlug(p.slug); setContent(p.content); setStatus(p.status)
      })
      .catch(() => toast.error('Failed to load page'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (!title || !slug || !content) { toast.error('Title, slug, and content are required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, status }),
      })
      if (res.ok) {
        toast.success('Page updated')
        router.push('/admin/content/pages')
      } else {
        const e = await res.json()
        toast.error(e.error || 'Failed to update')
      }
    } catch { toast.error('Failed to update page') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>

  return (
    <div>
      <PageHeader title="Edit Static Page" backHref="/admin/content/pages" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Page title" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML)</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h1>About Us</h1>" rows={20} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : 'Update Page'}</button>
        </div>
      </div>
    </div>
  )
}
```

---

### Task 14: Static Pages Public Route

**Files:**
- Create: `src/app/page/[slug]/page.tsx`

- [ ] **Create public static page renderer**

Create `src/app/page/[slug]/page.tsx`:

```tsx
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/store/Header'
import { Footer } from '@/components/store/Footer'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const ConciergeChat = dynamic(() => import('@/components/store/ConciergeChat').then(m => ({ default: m.ConciergeChat })))

export const revalidate = 60

export default async function StaticPageView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = await db.staticPage.findUnique({ where: { slug } })
  if (!page || page.status !== 'published') notFound()

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
              <li><span className="mx-2">/</span></li>
              <li className="text-navy font-medium">{page.title}</li>
            </ol>
          </nav>

          <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-gold mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>

          <h1 className="text-3xl sm:text-4xl font-display font-semibold text-navy mb-8">{page.title}</h1>

          <div
            className="prose prose-gray max-w-none prose-headings:text-navy prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </main>
      <Footer />
      <Suspense fallback={null}><ConciergeChat /></Suspense>
    </>
  )
}
```

---

### Task 15: Media Upload API

**Files:**
- Create: `src/app/api/admin/content/media/route.ts`

- [ ] **Create media list/upload/delete API**

Create `src/app/api/admin/content/media/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { readdir, writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { withAdmin } from '@/lib/admin-permissions'

const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads/media')
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']
const MAX_SIZE = 10 * 1024 * 1024

async function ensureDir() {
  await mkdir(UPLOAD_DIR, { recursive: true })
}

export const GET = withAdmin(async () => {
  try {
    await ensureDir()
    const files = await readdir(UPLOAD_DIR)
    const items = await Promise.all(
      files
        .filter(f => ALLOWED_EXTS.includes(path.extname(f).toLowerCase()))
        .map(async (f) => {
          const stat = await (async () => {
            try {
              const { stat } = await import('fs/promises')
              return stat(path.join(UPLOAD_DIR, f))
            } catch { return null }
          })()
          return {
            name: f,
            url: `/uploads/media/${f}`,
            size: stat?.size || 0,
            uploadedAt: stat?.birthtime?.toISOString() || new Date().toISOString(),
          }
        })
    )
    items.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    return NextResponse.json({ files: items })
  } catch (err) {
    console.error('List media error:', err)
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 })
  }
}, 'media')

export const POST = withAdmin(async (req: NextRequest) => {
  try {
    await ensureDir()
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    if (!ALLOWED_MIMES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB' }, { status: 400 })
    }

    const ext = path.extname(file.name).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 })
    }

    const filename = `${crypto.randomUUID()}${ext}`
    await writeFile(path.join(UPLOAD_DIR, filename), buffer)

    return NextResponse.json({ ok: true, url: `/uploads/media/${filename}`, name: filename })
  } catch (err) {
    console.error('Upload media error:', err)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}, 'media')

export const DELETE = withAdmin(async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')
    if (!name) return NextResponse.json({ error: 'Missing file name' }, { status: 400 })

    const filePath = path.join(UPLOAD_DIR, path.basename(name))
    await unlink(filePath)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Delete media error:', err)
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
  }
}, 'media')
```

---

### Task 16: Media Gallery Admin Page

**Files:**
- Create: `src/app/admin/content/media/page.tsx`
- Create: `src/app/admin/content/media/loading.tsx`
- Create: `src/app/admin/content/media/error.tsx`

- [ ] **Create media loading page**

Create `src/app/admin/content/media/loading.tsx`:

```tsx
export default function Loading() {
  return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="grid grid-cols-4 gap-4"><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /><div className="h-40 bg-gray-100 rounded-xl animate-pulse" /></div></div>
}
```

- [ ] **Create media error page**

Create `src/app/admin/content/media/error.tsx`:

```tsx
'use client'
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="p-6 text-center"><p className="text-red-600 mb-4">Failed to load media library</p><button onClick={reset} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm">Retry</button></div>
}
```

- [ ] **Create media gallery page**

Create `src/app/admin/content/media/page.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Trash2, Copy, FileImage, Loader2, Check, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'

type MediaFile = {
  name: string; url: string; size: number; uploadedAt: string
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [deleteName, setDeleteName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function fetchFiles() {
    setLoading(true)
    fetch('/api/admin/content/media')
      .then(r => r.json())
      .then(d => setFiles(d.files || []))
      .catch(() => toast.error('Failed to load media'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchFiles() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/content/media', { method: 'POST', body: formData })
      const d = await res.json()
      if (d.ok) {
        toast.success('File uploaded')
        fetchFiles()
      } else {
        toast.error(d.error || 'Failed to upload')
      }
    } catch { toast.error('Failed to upload') }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = '' }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(window.location.origin + url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
    toast.success('URL copied')
  }

  async function handleDelete() {
    if (!deleteName) return
    try {
      const res = await fetch(`/api/admin/content/media?name=${encodeURIComponent(deleteName)}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) {
        setFiles(prev => prev.filter(f => f.name !== deleteName))
        toast.success('File deleted')
      } else {
        toast.error(d.error || 'Failed to delete')
      }
    } catch { toast.error('Failed to delete') }
    finally { setDeleteName(null) }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div>
      <PageHeader
        title="Media Gallery"
        subtitle={`${files.length} file${files.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={fetchFiles} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy flex items-center gap-1">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
            <label className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 cursor-pointer">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Uploading...' : 'Upload'}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20">
          <FileImage className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">No files uploaded yet</p>
          <p className="text-sm text-muted-foreground/70 mb-4">Upload images to use in blog posts, banners, and pages.</p>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 cursor-pointer">
            <Upload className="h-4 w-4" /> Upload First File
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map(file => (
            <div key={file.name} className="group relative bg-white rounded-xl border border-border/60 overflow-hidden hover:shadow-md transition-all">
              <div className="aspect-square overflow-hidden">
                <img src={file.url} alt={file.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground/60">{formatSize(file.size)}</p>
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyUrl(file.url)}
                  className="p-1.5 rounded-lg bg-white/90 shadow-sm text-muted-foreground hover:text-navy transition-colors"
                  title="Copy URL"
                >
                  {copiedUrl === file.url ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setDeleteName(file.name)}
                  className="p-1.5 rounded-lg bg-white/90 shadow-sm text-red-400 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteName !== null}
        onOpenChange={o => { if (!o) setDeleteName(null) }}
        title="Delete file"
        description="Are you sure you want to delete this file? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
```

---

### Task 17: Sidebar Update

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Add content management sidebar entries**

Add the new content management links to the `links` array in `src/components/admin/Sidebar.tsx`. Insert after the `Mail` (newsletter) import and before the closing of the links array. Also add `FileText` and `Image` to the lucide-react imports:

Update the import line to add:
```
  Truck, Share2, Headset, FileText, Image,
```

Add the following entries in the `links` array (before the `payments` entry or after `newsletter` — placing them logically grouped near editor):

```tsx
  { href: '/admin/content/blog', label: 'Blog', icon: FileText, permission: 'blog' },
  { href: '/admin/content/faq', label: 'FAQ', icon: HelpCircle, permission: 'faq' },
  { href: '/admin/content/banners', label: 'Banners', icon: Image, permission: 'banners' },
  { href: '/admin/content/pages', label: 'Pages', icon: FileText, permission: 'pages' },
  { href: '/admin/content/media', label: 'Media', icon: Image, permission: 'media' },
```

Update the import to include `HelpCircle` from lucide-react:
```
  Truck, Share2, Headset, FileText, Image, HelpCircle,
```

The final import should be:
```
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, ShoppingCart, CreditCard, Tag, LogOut, Sun, Receipt, Settings,
  Store, Users, Shield, Calculator, ArrowLeftRight, FolderTree, UserCircle, MessageSquareText, Mail,
  Truck, Share2, Headset, FileText, Image, HelpCircle,
} from 'lucide-react'
```

And add the entries at the end of the `links` array (before the closing `]`):

```tsx
  { href: '/admin/content/blog', label: 'Blog', icon: FileText, permission: 'blog' },
  { href: '/admin/content/faq', label: 'FAQ', icon: HelpCircle, permission: 'faq' },
  { href: '/admin/content/banners', label: 'Banners', icon: Image, permission: 'banners' },
  { href: '/admin/content/pages', label: 'Pages', icon: FileText, permission: 'pages' },
  { href: '/admin/content/media', label: 'Media', icon: Image, permission: 'media' },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard, permission: 'payments' },
```

---

## Self-Review

**Spec coverage:**
- **Blog**: ✅ Tasks 2-5 (Prisma model, API routes, admin CRUD pages, public listing + single post)
- **FAQ**: ✅ Tasks 6-8 (Prisma model, API routes, admin page with drag reorder, public page update)
- **Banners/Slider**: ✅ Tasks 9-11 (Prisma model, API routes, admin pages, BannerSlider component on homepage)
- **Static Pages**: ✅ Tasks 12-14 (Prisma model, API routes, admin pages, public dynamic route)
- **Media Gallery**: ✅ Tasks 15-16 (Upload API, admin gallery page with preview/copy/delete)
- **Rich text**: Content fields use textarea with HTML support (no rich text editor library exists yet — can be upgraded to TipTap etc. later)
- **Sidebar**: ✅ Task 17

**Placeholder scan:** No TBD/TODO/fill-in-later patterns present. All code is complete.

**Type consistency:** All Prisma model field names match across API routes and page components. All API response shapes match what admin pages expect.
