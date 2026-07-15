'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Plus, GripVertical } from 'lucide-react'

interface TrustBadge {
  id: string
  icon: string
  label: string
  active: boolean
}

const defaultBadges: TrustBadge[] = [
  { id: '1', icon: '🔒', label: 'Secure Checkout', active: true },
  { id: '2', icon: '🛡️', label: 'SSL Encrypted', active: true },
  { id: '3', icon: '💰', label: 'Money-Back Guarantee', active: true },
  { id: '4', icon: '🚚', label: 'Free Shipping', active: true },
]

export function TrustBadgesPanel() {
  const { settings, updateSetting } = useEditor()
  const raw = settings.trustBadges ? JSON.parse(settings.trustBadges) : defaultBadges
  const [badges, setBadges] = useState<TrustBadge[]>(raw)

  const persist = (next: TrustBadge[]) => {
    setBadges(next)
    updateSetting('trustBadges', JSON.stringify(next))
  }

  const toggle = (id: string) => {
    persist(badges.map(b => b.id === id ? { ...b, active: !b.active } : b))
  }

  const update = (id: string, field: keyof TrustBadge, value: string | boolean) => {
    persist(badges.map(b => b.id === id ? { ...b, [field]: value } : b))
  }

  const add = () => {
    const id = String(Date.now())
    persist([...badges, { id, icon: '✅', label: 'New Badge', active: true }])
  }

  const remove = (id: string) => {
    persist(badges.filter(b => b.id !== id))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Trust badges displayed on the homepage and checkout.</p>
      {badges.map((badge, idx) => (
        <div key={badge.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            <span className="text-sm font-medium">Badge {idx + 1}</span>
            <button
              onClick={() => toggle(badge.id)}
              className={`ml-auto text-xs px-2 py-0.5 rounded ${badge.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
            >
              {badge.active ? 'Active' : 'Hidden'}
            </button>
            <button onClick={() => remove(badge.id)} className="text-red-500 hover:text-red-700">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Icon (emoji)</label>
              <Input value={badge.icon} onChange={e => update(badge.id, 'icon', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Label</label>
              <Input value={badge.label} onChange={e => update(badge.id, 'label', e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <Button onClick={add} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Add Badge
      </Button>
    </div>
  )
}
