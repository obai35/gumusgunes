'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useEditor } from '../SectionPanel'
import type { FooterColumn } from '../types'

let colId = 0
let linkId = 0

export function FooterPanel() {
  const { settings, updateSetting } = useEditor()
  type Col = FooterColumn & { _id: number }
  type Link = { label: string; href: string; _id: number }
  const [cols, setCols] = useState<Col[]>(() => {
    try { return (JSON.parse(settings.footer || '[{"title":"Shop","links":[]},{"title":"About","links":[]},{"title":"Care","links":[]}]') as FooterColumn[]).map(c => ({ ...c, _id: ++colId, links: c.links.map(l => ({ ...l, _id: ++linkId })) })) } catch { return [] }
  })

  const save = (next: Col[]) => { setCols(next); updateSetting('footer', JSON.stringify(next.map(({ _id, ...rest }) => ({ ...rest }))) as any) }

  const addCol = () => save([...cols, { title: '', links: [], _id: ++colId }])
  const removeCol = (id: number) => save(cols.filter(c => c._id !== id))
  const updateCol = (id: number, title: string) => save(cols.map(c => c._id === id ? { ...c, title } : c))
  const addLink = (cid: number) => save(cols.map(c => c._id === cid ? { ...c, links: [...c.links, { label: '', href: '/', _id: ++linkId }] } : c))
  const updateLink = (cid: number, lid: number, field: string, value: string) =>
    save(cols.map(c => c._id === cid ? { ...c, links: c.links.map(l => l._id === lid ? { ...l, [field]: value } : l) } : c))
  const removeLink = (cid: number, lid: number) =>
    save(cols.map(c => c._id === cid ? { ...c, links: c.links.filter(l => l._id !== lid) } : c))

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
      <div>
        <label className="text-xs font-medium text-muted-foreground">Address</label>
        <input value={settings.footerAddress || ''} onChange={e => updateSetting('footerAddress', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground block mb-2">Social Links</span>
        {['instagram', 'facebook', 'twitter', 'youtube'].map(platform => (
          <div key={platform} className="mb-1">
            <label className="text-xs text-muted-foreground capitalize block">{platform}</label>
            <input value={settings[`footer${platform.charAt(0).toUpperCase() + platform.slice(1)}`] || ''} onChange={e => updateSetting(`footer${platform.charAt(0).toUpperCase() + platform.slice(1)}`, e.target.value)} className="w-full px-2 py-1 text-xs border border-border rounded mt-0.5" placeholder={`https://${platform}.com/...`} />
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Link Columns</span>
          <button onClick={addCol} className="flex items-center gap-1 text-xs text-gold"><Plus className="h-3 w-3" /> Add Column</button>
        </div>
        {cols.map(col => (
          <div key={col._id} className="bg-gray-50 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <input value={col.title} onChange={e => updateCol(col._id, e.target.value)} placeholder="Column title" className="flex-1 px-2 py-1 text-xs border border-border rounded font-medium" />
              <button onClick={() => removeCol(col._id)} className="p-1 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
            {Array.isArray(col.links) && col.links.map(link => (
              <div key={link._id} className="flex items-center gap-1 ml-2 mb-1">
                <input value={link.label} onChange={e => updateLink(col._id, link._id, 'label', e.target.value)} placeholder="Label" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded" />
                <input value={link.href} onChange={e => updateLink(col._id, link._id, 'href', e.target.value)} placeholder="/link" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded font-mono" />
                <button onClick={() => removeLink(col._id, link._id)} className="p-0.5 text-muted-foreground hover:text-red-500"><X className="h-2.5 w-2.5" /></button>
              </div>
            ))}
            <button onClick={() => addLink(col._id)} className="text-xs text-gold/70 hover:text-gold ml-2 mt-0.5">+ Add Link</button>
          </div>
        ))}
      </div>
    </div>
  )
}
