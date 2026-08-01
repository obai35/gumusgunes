'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { BrokenImageIcon } from '@/components/admin/editor/FieldIcons'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

function BgPreview({ src }: { src: string }) {
  const [error, setError] = useState(false)
  if (error) return <div className="h-10 w-10 rounded border border-red-300 bg-red-50 flex items-center justify-center"><BrokenImageIcon /></div>
  return (
    <>
      <img src={src} alt="" className="hidden" onError={() => setError(true)} onLoad={() => setError(false)} />
      <div className="h-10 w-10 rounded bg-cover bg-center border" style={{ backgroundImage: `url(${src})` }} />
    </>
  )
}

export function HeroPanel() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Title')}</label>
        <input value={g('heroTitle')} onChange={e => updateSetting('heroTitle', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Subtitle')}</label>
        <textarea value={g('heroSubtitle')} onChange={e => updateSetting('heroSubtitle', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Background Image URL')}</label>
        <div className="flex gap-2 mt-1">
          <input value={g('heroBackground')} onChange={e => updateSetting('heroBackground', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('heroBackground') && <BgPreview src={g('heroBackground')} />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Overlay Opacity (%)')}</label>
        <input type="range" min="0" max="100" value={parseInt(g('heroOverlay')) || 40} onChange={e => updateSetting('heroOverlay', e.target.value)} className="w-full mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{ta('CTA Text')}</label>
          <input value={g('heroCtaText') || 'Explore the Collection'} onChange={e => updateSetting('heroCtaText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{ta('CTA Link')}</label>
          <input value={g('heroCtaLink') || '/products'} onChange={e => updateSetting('heroCtaLink', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Layout Variant')}</label>
        <select value={g('heroLayout') || 'centered'} onChange={e => updateSetting('heroLayout', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="centered">{ta('Centered')}</option>
          <option value="left">{ta('Left Aligned')}</option>
          <option value="split">{ta('Split (image + text)')}</option>
        </select>
      </div>
    </div>
  )
}
