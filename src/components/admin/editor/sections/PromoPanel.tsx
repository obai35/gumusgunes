'use client'

import { useEditor } from '../SectionPanel'

export function PromoPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('promoEnabled') !== 'false'} onChange={e => updateSetting('promoEnabled', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">Show Promo Banner</label>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <input value={g('promoTitle')} onChange={e => updateSetting('promoTitle', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Description</label>
        <textarea value={g('promoDescription')} onChange={e => updateSetting('promoDescription', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Text</label>
          <input value={g('promoCtaText') || 'Shop Now'} onChange={e => updateSetting('promoCtaText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Link</label>
          <input value={g('promoCtaLink') || '/products'} onChange={e => updateSetting('promoCtaLink', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Background Image URL</label>
        <input value={g('promoBackground')} onChange={e => updateSetting('promoBackground', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Background Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('promoBgColor') || '#0a1628'} onChange={e => updateSetting('promoBgColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('promoBgColor') || ''} onChange={e => updateSetting('promoBgColor', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Text Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('promoTextColor') || '#f5efe6'} onChange={e => updateSetting('promoTextColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('promoTextColor') || ''} onChange={e => updateSetting('promoTextColor', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
      </div>
    </div>
  )
}
