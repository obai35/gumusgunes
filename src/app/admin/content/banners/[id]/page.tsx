'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function EditBannerPage() {
  const { ta } = useAdminTranslate()
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
        if (!banner) { toast.error(ta('Banner not found')); return }
        setTitle(banner.title || '')
        setImageUrl(banner.imageUrl)
        setLinkUrl(banner.linkUrl || '')
        setTextOverlay(banner.textOverlay || '')
        setSortOrder(banner.sortOrder)
        setIsActive(banner.isActive)
        setStartDate(banner.startDate ? banner.startDate.split('T')[0] : '')
        setEndDate(banner.endDate ? banner.endDate.split('T')[0] : '')
      })
      .catch(() => toast.error(ta('Failed to load banner')))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit() {
    if (!imageUrl) { toast.error(ta('Image URL is required')); return }
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
        toast.success(ta('Banner updated'))
        router.push('/admin/content/banners')
      } else {
        const e = await res.json()
        toast.error(e.error || ta('Failed to update'))
      }
    } catch { toast.error(ta('Failed to update banner')) }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-6"><div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" /><div className="h-96 bg-gray-100 rounded-xl animate-pulse" /></div>

  return (
    <div>
      <PageHeader title={ta('Edit Banner')} backHref="/admin/content/banners" />
      <div className="bg-white rounded-xl border border-gray-100 p-6 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Image URL')} *</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            {imageUrl && <img src={imageUrl} alt={ta('Preview')} className="mt-2 h-32 w-full object-cover rounded-lg" />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Title')}</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder={ta('Banner title')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Sort Order')}</label>
              <input type="number" value={sortOrder} onChange={e => setSortOrder(Number(e.target.value))} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Link URL')}</label>
            <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Text Overlay')}</label>
            <textarea value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder={ta('Text displayed on the banner')} rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{ta('Start Date')}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{ta('End Date')}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
            {ta('Active')}
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => router.back()} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? ta('Saving...') : ta('Update Banner')}</button>
        </div>
      </div>
    </div>
  )
}
