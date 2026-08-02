'use client'

import { useEditor } from '../SectionPanel'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const ALL_SECTIONS = ['hero', 'trustBadges', 'flashSale', 'categoryGrid', 'featuredProducts', 'promoBanner', 'bundleConfigurator', 'newArrivals', 'productGrid', 'bestsellers', 'recentlyViewed', 'giftFinder', 'aboutSection', 'craftsmanshipTimeline', 'testimonials', 'rewardsSection', 'newsletter']

export function LayoutPanel() {
  const { ta } = useAdminTranslate()
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''
  const visible = (section: string) => g(`section_${section}`) !== 'hidden'

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">{ta('Show or hide sections on the homepage.')}</p>
      {ALL_SECTIONS.map(s => (
        <label key={s} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
          <input type="checkbox" checked={visible(s)} onChange={e => updateSetting(`section_${s}`, e.target.checked ? 'visible' : 'hidden')} className="h-4 w-4" />
          <span className="text-sm capitalize">{ta(s.replace(/([A-Z])/g, ' $1').trim())}</span>
        </label>
      ))}
    </div>
  )
}
