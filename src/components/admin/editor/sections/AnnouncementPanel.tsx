'use client'

import { useEditor } from '../SectionPanel'

export function AnnouncementPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('announcementEnabled') !== 'false'} onChange={e => updateSetting('announcementEnabled', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">Show Announcement Bar</label>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Text (Desktop)</label>
        <input value={g('announcementText')} onChange={e => updateSetting('announcementText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Text (Mobile)</label>
        <input value={g('announcementTextMobile')} onChange={e => updateSetting('announcementTextMobile', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Background Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('announcementBg') || '#0a1628'} onChange={e => updateSetting('announcementBg', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('announcementBg') || ''} onChange={e => updateSetting('announcementBg', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Text Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('announcementTextColor') || '#f5efe6'} onChange={e => updateSetting('announcementTextColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('announcementTextColor') || ''} onChange={e => updateSetting('announcementTextColor', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('announcementDismissible') === 'true'} onChange={e => updateSetting('announcementDismissible', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">Dismissible</label>
      </div>
    </div>
  )
}
