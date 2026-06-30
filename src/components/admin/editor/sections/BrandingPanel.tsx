'use client'

import { useEditor } from '../SectionPanel'

export default function BrandingPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Site Name</label>
        <input value={g('siteName')} onChange={e => updateSetting('siteName', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tagline</label>
        <input value={g('tagline')} onChange={e => updateSetting('tagline', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Logo URL</label>
        <div className="flex gap-2 mt-1">
          <input value={g('logoUrl')} onChange={e => updateSetting('logoUrl', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('logoUrl') && <img src={g('logoUrl')} alt="" className="h-8 w-8 rounded object-cover border" />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Favicon URL</label>
        <input value={g('favicon') || ''} onChange={e => updateSetting('favicon', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
    </div>
  )
}
