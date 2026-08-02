'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type S = Record<string, string>
const FIELDS: { key: string; label: string; type?: string; group: string }[] = [
  { key: 'seoTitleTemplate', label: 'Title Template (%s = page title)', group: 'Global' },
  { key: 'seoDescription', label: 'Default Meta Description', group: 'Global' },
  { key: 'seoOgImage', label: 'Default OG Image URL', group: 'Global' },
  { key: 'seoKeywords', label: 'Default Keywords', group: 'Global' },
  { key: 'seoHomeTitle', label: 'Home Page Title', group: 'Per-Page' },
  { key: 'seoHomeDescription', label: 'Home Page Description', group: 'Per-Page' },
  { key: 'seoProductsTitle', label: 'Products Page Title', group: 'Per-Page' },
  { key: 'seoProductsDescription', label: 'Products Page Description', group: 'Per-Page' },
  { key: 'seoCategoriesTitle', label: 'Categories Page Title', group: 'Per-Page' },
  { key: 'seoCategoriesDescription', label: 'Categories Page Description', group: 'Per-Page' },
  { key: 'sitemapEnabled', label: 'Enable Sitemap', type: 'select', group: 'Sitemap & Robots' },
  { key: 'sitemapPriority', label: 'Sitemap Priority (0.0–1.0)', group: 'Sitemap & Robots' },
  { key: 'sitemapChangefreq', label: 'Change Frequency', group: 'Sitemap & Robots' },
  { key: 'robotsTxt', label: 'robots.txt', type: 'textarea', group: 'Sitemap & Robots' },
]

export default function SeoPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [settings, setSettings] = useState<S>({}); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false)
  useEffect(() => { fetch('/api/admin/seo').then(r => r.json()).then(d => { if (d.ok) setSettings(d.settings) }).finally(() => setLoading(false)) }, [])

  async function handleSave() {
    setSaving(true); try { const r = await fetch('/api/admin/seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) }); if (r.ok) toast.success(ta('Saved')); else toast.error(ta('Failed')) } catch { toast.error(ta('Network error')) }; setSaving(false)
  }

  const groups = [...new Set(FIELDS.map(f => f.group))]
  if (loading) return <div className="p-6 space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-6 w-32" /><div className="grid gap-4"><Skeleton className="h-16" /></div></div>

  return (
    <div>
      <PageHeader title={ta('SEO Management')} backHref="/admin/marketing" actions={<button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? ta('...') : ta('Save All')}</button>} />
      {groups.map(group => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold text-navy mb-3 border-b border-border pb-2">{ta(group)}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.filter(f => f.group === group).map(field => (
              <div key={field.key} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                <label className="text-sm font-medium text-navy block mb-1">{ta(field.label)}</label>
                {field.type === 'select' ? (
                  <select value={settings[field.key] || 'true'} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm">
                    <option value="true">{ta('Enabled')}</option><option value="false">{ta('Disabled')}</option>
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} rows={6} className="w-full px-3 py-2 rounded-lg border border-border text-sm font-mono" />
                ) : (
                  <input type="text" value={settings[field.key] || ''} onChange={e => setSettings({ ...settings, [field.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
