'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Plus } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

interface Tier {
  name: string
  points: number
  benefits: string
}

interface RewardItem {
  item: string
  points: number
  imageUrl: string
}

export function RewardsSectionPanel() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const { settings, updateSetting } = useEditor()

  const title = settings.rewardsTitle ?? ''
  const pointsPerEGP = settings.rewardsPointsPerEGP ?? '1'

  let tiersRaw: Tier[] = []
  try { if (settings.rewardsTiers) tiersRaw = JSON.parse(settings.rewardsTiers) } catch {}
  const [tiers, setTiers] = useState<Tier[]>(tiersRaw)

  let catalogRaw: RewardItem[] = []
  try { if (settings.rewardsCatalog) catalogRaw = JSON.parse(settings.rewardsCatalog) } catch {}
  const [catalog, setCatalog] = useState<RewardItem[]>(catalogRaw)

  const persistTiers = (next: Tier[]) => {
    setTiers(next)
    updateSetting('rewardsTiers', JSON.stringify(next))
  }

  const persistCatalog = (next: RewardItem[]) => {
    setCatalog(next)
    updateSetting('rewardsCatalog', JSON.stringify(next))
  }

  const addTier = () => persistTiers([...tiers, { name: '', points: 0, benefits: '' }])
  const addCatalogItem = () => persistCatalog([...catalog, { item: '', points: 0, imageUrl: '' }])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Section Title')}</label>
        <Input value={title} onChange={e => updateSetting('rewardsTitle', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Points per EGP')}</label>
        <Input type="number" min="0.1" step="0.1" value={pointsPerEGP} onChange={e => updateSetting('rewardsPointsPerEGP', e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Loyalty Tiers')}</label>
        {tiers.map((tier, idx) => (
          <div key={idx} className="border rounded p-2 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{ta('Tier')} {idx + 1}</span>
              <button onClick={() => persistTiers(tiers.filter((_, i) => i !== idx))} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={ta('Name')} value={tier.name} onChange={e => {
                const next = [...tiers]; next[idx] = { ...next[idx], name: e.target.value }; persistTiers(next)
              }} />
              <Input type="number" placeholder={ta('Min Points')} value={tier.points} onChange={e => {
                const next = [...tiers]; next[idx] = { ...next[idx], points: Number(e.target.value) }; persistTiers(next)
              }} />
            </div>
            <Textarea placeholder={ta('Benefits (one per line)')} rows={3} value={tier.benefits} onChange={e => {
              const next = [...tiers]; next[idx] = { ...next[idx], benefits: e.target.value }; persistTiers(next)
            }} />
          </div>
        ))}
        <Button onClick={addTier} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> {ta('Add Tier')}
        </Button>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">{ta('Reward Catalog')}</label>
        {catalog.map((item, idx) => (
          <div key={idx} className="border rounded p-2 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{ta('Item')} {idx + 1}</span>
              <button onClick={() => persistCatalog(catalog.filter((_, i) => i !== idx))} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder={ta('Item name')} value={item.item} onChange={e => {
                const next = [...catalog]; next[idx] = { ...next[idx], item: e.target.value }; persistCatalog(next)
              }} />
              <Input type="number" placeholder={ta('Points required')} value={item.points} onChange={e => {
                const next = [...catalog]; next[idx] = { ...next[idx], points: Number(e.target.value) }; persistCatalog(next)
              }} />
            </div>
            <Input placeholder={ta('Image URL (optional)')} value={item.imageUrl} onChange={e => {
              const next = [...catalog]; next[idx] = { ...next[idx], imageUrl: e.target.value }; persistCatalog(next)
            }} />
          </div>
        ))}
        <Button onClick={addCatalogItem} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> {ta('Add Reward Item')}
        </Button>
      </div>
    </div>
  )
}
