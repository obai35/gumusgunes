'use client'

import { useEditor } from '../SectionPanel'

export default function HeroPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <input value={g('heroTitle')} onChange={e => updateSetting('heroTitle', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
        <textarea value={g('heroSubtitle')} onChange={e => updateSetting('heroSubtitle', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Background Image URL</label>
        <div className="flex gap-2 mt-1">
          <input value={g('heroBackground')} onChange={e => updateSetting('heroBackground', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('heroBackground') && <div className="h-10 w-10 rounded bg-cover bg-center border" style={{ backgroundImage: `url(${g('heroBackground')})` }} />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Overlay Opacity (%)</label>
        <input type="range" min="0" max="100" value={parseInt(g('heroOverlay')) || 40} onChange={e => updateSetting('heroOverlay', e.target.value)} className="w-full mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Text</label>
          <input value={g('heroCtaText') || 'Explore the Collection'} onChange={e => updateSetting('heroCtaText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Link</label>
          <input value={g('heroCtaLink') || '/products'} onChange={e => updateSetting('heroCtaLink', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Layout Variant</label>
        <select value={g('heroLayout') || 'centered'} onChange={e => updateSetting('heroLayout', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="centered">Centered</option>
          <option value="left">Left Aligned</option>
          <option value="split">Split (image + text)</option>
        </select>
      </div>
    </div>
  )
}
