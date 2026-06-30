'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useEditor } from '../SectionPanel'

type FooterLink = { label: string; href: string }
type FooterCol = { title: string; links: FooterLink[] }

export default function FooterPanel() {
  const { settings, updateSetting } = useEditor()
  const [cols, setCols] = useState<FooterCol[]>(() => {
    try { return JSON.parse(settings.footer || '[{"title":"Shop","links":[]},{"title":"About","links":[]},{"title":"Care","links":[]}]') } catch { return [] }
  })

  const save = (next: FooterCol[]) => { setCols(next); updateSetting('footer', JSON.stringify(next)) }

  const addCol = () => save([...cols, { title: '', links: [] }])
  const removeCol = (i: number) => save(cols.filter((_, idx) => idx !== i))
  const updateCol = (i: number, title: string) => save(cols.map((c, idx) => idx === i ? { ...c, title } : c))
  const addLink = (i: number) => save(cols.map((c, idx) => idx === i ? { ...c, links: [...c.links, { label: '', href: '/' }] } : c))
  const updateLink = (ci: number, li: number, field: string, value: string) =>
    save(cols.map((c, idx) => idx === ci ? { ...c, links: c.links.map((l, lIdx) => lIdx === li ? { ...l, [field]: value } : l) } : c))
  const removeLink = (ci: number, li: number) =>
    save(cols.map((c, idx) => idx === ci ? { ...c, links: c.links.filter((_, lIdx) => lIdx !== li) } : c))

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Copyright Text</label>
        <input value={settings.footerCopyright || ''} onChange={e => updateSetting('footerCopyright', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" placeholder="© Gümüş Güneş. All rights reserved." />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Email</label>
        <input value={settings.footerEmail || ''} onChange={e => updateSetting('footerEmail', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Phone</label>
        <input value={settings.footerPhone || ''} onChange={e => updateSetting('footerPhone', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Link Columns</span>
          <button onClick={addCol} className="flex items-center gap-1 text-xs text-gold"><Plus className="h-3 w-3" /> Add Column</button>
        </div>
        {cols.map((col, ci) => (
          <div key={ci} className="bg-gray-50 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <input value={col.title} onChange={e => updateCol(ci, e.target.value)} placeholder="Column title" className="flex-1 px-2 py-1 text-xs border border-border rounded font-medium" />
              <button onClick={() => removeCol(ci)} className="p-1 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
            {col.links.map((link, li) => (
              <div key={li} className="flex items-center gap-1 ml-2 mb-1">
                <input value={link.label} onChange={e => updateLink(ci, li, 'label', e.target.value)} placeholder="Label" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded" />
                <input value={link.href} onChange={e => updateLink(ci, li, 'href', e.target.value)} placeholder="/link" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded font-mono" />
                <button onClick={() => removeLink(ci, li)} className="p-0.5 text-muted-foreground hover:text-red-500"><X className="h-2.5 w-2.5" /></button>
              </div>
            ))}
            <button onClick={() => addLink(ci)} className="text-xs text-gold/70 hover:text-gold ml-2 mt-0.5">+ Add Link</button>
          </div>
        ))}
      </div>
    </div>
  )
}
