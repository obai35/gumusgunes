'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function EditPagePage() {
  const router = useRouter()
  const params = useParams()
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
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
      .catch(() => toast.error(ta('Failed to load page')))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (!title || !slug || !content) { toast.error(ta('Title, slug, and content are required')); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/content/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, status }),
      })
      if (res.ok) {
        toast.success(ta('Page updated'))
        router.push('/admin/content/pages')
      } else {
        const e = await res.json()
        toast.error(e.error || ta('Failed to update'))
      }
    } catch { toast.error(ta('Failed to update page')) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>

  return (
    <div>
      <PageHeader title={ta('Edit Static Page')} backHref="/admin/content/pages" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Title')}</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={ta('Page title')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Slug')}</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Content (HTML)')}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h1>About Us</h1>" rows={20} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Status')}</label>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="published">{ta('Published')}</option>
              <option value="draft">{ta('Draft')}</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? ta('Saving...') : ta('Update Page')}</button>
        </div>
      </div>
    </div>
  )
}
