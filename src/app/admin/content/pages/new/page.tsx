'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function NewPagePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [saving, setSaving] = useState(false)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function autoSlug(val: string) {
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  async function handleSubmit() {
    if (!title || !slug || !content) { toast.error(ta('Title, slug, and content are required')); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/content/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, content, status }),
      })
      if (res.ok) {
        toast.success(ta('Page created'))
        router.push('/admin/content/pages')
      } else {
        const e = await res.json()
        toast.error(e.error || ta('Failed to create'))
      }
    } catch { toast.error(ta('Failed to create page')) }
    finally { setSaving(false) }
  }

  return (
    <div>
      <PageHeader title={ta('New Static Page')} backHref="/admin/content/pages" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-3xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Title')}</label>
            <input value={title} onChange={e => { setTitle(e.target.value); autoSlug(e.target.value) }} placeholder={ta('Page title')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Slug')}</label>
            <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="about-us" className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
            <p className="text-xs text-muted-foreground mt-1">{ta(`Public URL: /page/${slug || 'slug'}`)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Content (HTML)')}</label>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="<h1>About Us</h1><p>Our story...</p>" rows={20} className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" />
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
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? ta('Creating...') : ta('Create Page')}</button>
        </div>
      </div>
    </div>
  )
}
