'use client'

import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { useEditor } from '../SectionPanel'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import type { NavItem } from '../types'

let navIdCounter = 0
function newId() { return `nav_${++navIdCounter}` }

export function NavigationPanel() {
  const { settings, updateSetting } = useEditor()
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [items, setItems] = useState<NavItem[]>(() => {
    try { return JSON.parse(settings.navigation || '[]') } catch { return [] }
  })

  const save = (next: NavItem[]) => {
    setItems(next)
    updateSetting('navigation', JSON.stringify(next))
  }

  const addItem = () => save([...items, { id: newId(), label: '', href: '/' }])
  const removeItem = (id: string) => save(items.filter(i => i.id !== id))
  const updateItem = (id: string, field: string, value: string) =>
    save(items.map(i => i.id === id ? { ...i, [field]: value } : i))

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{ta('Manage navigation menu items.')}</p>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
          <input value={item.label} onChange={e => updateItem(item.id, 'label', e.target.value)} placeholder={ta('Label')} className="flex-1 px-2 py-1 text-xs border border-border rounded min-w-0" />
          <input value={item.href} onChange={e => updateItem(item.id, 'href', e.target.value)} placeholder="/link" className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono min-w-0" />
          <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-xs text-gold font-medium hover:text-gold-soft">
        <Plus className="h-3 w-3" /> {ta('Add Item')}
      </button>
    </div>
  )
}
