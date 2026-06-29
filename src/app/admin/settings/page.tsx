'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

type Settings = Record<string, string>

const FIELDS: { key: string; label: string; type?: string; group: string }[] = [
  { key: 'siteName', label: 'Site Name', group: 'Branding' },
  { key: 'siteTagline', label: 'Site Tagline', group: 'Branding' },
  { key: 'logoUrl', label: 'Logo URL', group: 'Branding' },
  { key: 'primaryFont', label: 'Font Family (body)', group: 'Design' },
  { key: 'headingFont', label: 'Font Family (headings)', group: 'Design' },
  { key: 'primaryColor', label: 'Primary Color (hex)', group: 'Design' },
  { key: 'accentColor', label: 'Accent / Gold Color (hex)', group: 'Design' },
  { key: 'bgColor', label: 'Background Color (hex)', group: 'Design' },
  { key: 'textColor', label: 'Text Color (hex)', group: 'Design' },
  { key: 'announcementText', label: 'Announcement Text', group: 'Header' },
  { key: 'announcementTextMobile', label: 'Announcement Text (Mobile)', group: 'Header' },
  { key: 'navCollections', label: 'Nav: Collections', group: 'Navigation' },
  { key: 'navNewArrivals', label: 'Nav: New Arrivals', group: 'Navigation' },
  { key: 'navBestsellers', label: 'Nav: Bestsellers', group: 'Navigation' },
  { key: 'navGiftFinder', label: 'Nav: Gift Finder', group: 'Navigation' },
  { key: 'navOurStory', label: 'Nav: Our Story', group: 'Navigation' },
  { key: 'heroTitle', label: 'Hero Title', group: 'Hero' },
  { key: 'heroSubtitle', label: 'Hero Subtitle', group: 'Hero' },
  { key: 'footerEmail', label: 'Footer Email', group: 'Footer' },
  { key: 'footerPhone', label: 'Footer Phone', group: 'Footer' },
  { key: 'footerAbout', label: 'Footer About Text', group: 'Footer' },
  { key: 'footerAddress', label: 'Footer Address', group: 'Footer' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => { if (d.ok) setSettings(d.settings) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  const groups = [...new Set(FIELDS.map(f => f.group))]

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Website Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>

      {groups.map(group => (
        <div key={group} className="mb-8">
          <h2 className="text-lg font-semibold text-navy mb-3 border-b border-border pb-2">{group}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELDS.filter(f => f.group === group).map(field => (
              <div key={field.key}>
                <label className="text-sm font-medium text-navy block mb-1">{field.label}</label>
                <input
                  value={settings[field.key] || ''}
                  onChange={e => setSettings({ ...settings, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
