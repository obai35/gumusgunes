'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface TimelineEntry {
  year: string
  title: string
  description: string
  imageUrl: string
}

export function CraftsmanshipTimelinePanel() {
  const { settings, updateSetting } = useEditor()
  let raw: TimelineEntry[] = []
  try { if (settings.craftsmanshipTimeline) raw = JSON.parse(settings.craftsmanshipTimeline) } catch {}
  const [entries, setEntries] = useState<TimelineEntry[]>(raw)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  const persist = (next: TimelineEntry[]) => {
    setEntries(next)
    updateSetting('craftsmanshipTimeline', JSON.stringify(next))
  }

  const update = (idx: number, field: keyof TimelineEntry, value: string) => {
    persist(entries.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const add = () => {
    persist([...entries, { year: '', title: '', description: '', imageUrl: '' }])
  }

  const remove = (idx: number) => {
    persist(entries.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{ta("Key milestones in the brand's history.")}</p>
      {entries.map((entry, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{ta(`Entry ${idx + 1}`)}</span>
            <button onClick={() => remove(idx)} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">{ta('Year')}</label>
              <Input value={entry.year} onChange={e => update(idx, 'year', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">{ta('Title')}</label>
              <Input value={entry.title} onChange={e => update(idx, 'title', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">{ta('Description')}</label>
            <Textarea rows={3} value={entry.description} onChange={e => update(idx, 'description', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">{ta('Image URL (optional)')}</label>
            <Input value={entry.imageUrl} onChange={e => update(idx, 'imageUrl', e.target.value)} />
          </div>
        </div>
      ))}
      <Button onClick={add} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> {ta('Add Entry')}
      </Button>
    </div>
  )
}
