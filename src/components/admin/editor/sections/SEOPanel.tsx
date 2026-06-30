'use client'

import { useEditor } from '../SectionPanel'

export function SEOPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title Template</label>
        <input value={g('seoTitleTemplate') || '%s — Gümüş Güneş'} onChange={e => updateSetting('seoTitleTemplate', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        <p className="text-[10px] text-muted-foreground mt-0.5">Use %s as placeholder for page title</p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Default Description</label>
        <textarea value={g('seoDescription')} onChange={e => updateSetting('seoDescription', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">OG Image URL</label>
        <input value={g('seoOgImage') || ''} onChange={e => updateSetting('seoOgImage', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Keywords (comma separated)</label>
        <input value={g('seoKeywords') || ''} onChange={e => updateSetting('seoKeywords', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
    </div>
  )
}
