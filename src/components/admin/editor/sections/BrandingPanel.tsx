'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { ImageIcon, BrokenImageIcon } from '@/components/admin/editor/FieldIcons'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

function ImgPreview({ src }: { src: string }) {
  const [error, setError] = useState(false)
  if (error) return <div className="h-8 w-8 rounded border border-red-300 bg-red-50 flex items-center justify-center"><BrokenImageIcon /></div>
  return <img src={src} alt="" className="h-8 w-8 rounded object-cover border" onError={() => setError(true)} />
}

function isValidHex(c: string) {
  return /^#[0-9a-fA-F]{6}$/.test(c)
}

export function BrandingPanel() {
  const { settings, updateSetting } = useEditor()
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Site Name')}</label>
        <input value={g('siteName')} onChange={e => updateSetting('siteName', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Tagline')}</label>
        <input value={g('tagline')} onChange={e => updateSetting('tagline', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Logo URL')}</label>
        <div className="flex gap-2 mt-1">
          <input value={g('logoUrl')} onChange={e => updateSetting('logoUrl', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('logoUrl') && <ImgPreview src={g('logoUrl')} />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">{ta('Favicon URL')}</label>
        <div className="flex gap-2 mt-1">
          <input value={g('favicon') || ''} onChange={e => updateSetting('favicon', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('favicon') && <ImgPreview src={g('favicon')} />}
        </div>
      </div>
    </div>
  )
}
