'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface StatItem {
  value: string
  label: string
}

export function AboutSectionPanel() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const { settings, updateSetting } = useEditor()

  const title = settings.aboutTitle ?? ''
  const content = settings.aboutContent ?? ''
  const imageUrl = settings.aboutImageUrl ?? ''
  const mission = settings.aboutMission ?? ''
  const vision = settings.aboutVision ?? ''
  let raw: StatItem[] = []
  try { if (settings.aboutStats) raw = JSON.parse(settings.aboutStats) } catch {}
  const [stats, setStats] = useState<StatItem[]>(raw)

  const persistStats = (next: StatItem[]) => {
    setStats(next)
    updateSetting('aboutStats', JSON.stringify(next))
  }

  const addStat = () => {
    persistStats([...stats, { value: '', label: '' }])
  }

  const updateStat = (idx: number, field: keyof StatItem, value: string) => {
    const next = stats.map((s, i) => i === idx ? { ...s, [field]: value } : s)
    persistStats(next)
  }

  const removeStat = (idx: number) => {
    persistStats(stats.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Title')}</label>
        <Input value={title} onChange={e => updateSetting('aboutTitle', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Content')}</label>
        <Textarea rows={5} value={content} onChange={e => updateSetting('aboutContent', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Image URL')}</label>
        <Input value={imageUrl} onChange={e => updateSetting('aboutImageUrl', e.target.value)} />
        {imageUrl && (
          <img src={imageUrl} alt={ta('Preview')} className="mt-2 w-full h-32 object-cover rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Mission')}</label>
        <Textarea rows={3} value={mission} onChange={e => updateSetting('aboutMission', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Vision')}</label>
        <Textarea rows={3} value={vision} onChange={e => updateSetting('aboutVision', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Stats')}</label>
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-2">
            <input
              className="w-20 border rounded px-2 py-1 text-sm"
              placeholder={ta('Value')}
              value={stat.value}
              onChange={e => updateStat(idx, 'value', e.target.value)}
            />
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder={ta('Label')}
              value={stat.label}
              onChange={e => updateStat(idx, 'label', e.target.value)}
            />
            <button onClick={() => removeStat(idx)} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button onClick={addStat} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> {ta('Add Stat')}
        </Button>
      </div>
    </div>
  )
}
