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
