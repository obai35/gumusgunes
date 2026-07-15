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
