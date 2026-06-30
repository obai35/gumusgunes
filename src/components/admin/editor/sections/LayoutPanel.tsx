'use client'

import { useEditor } from '../SectionPanel'

const ALL_SECTIONS = ['hero', 'trustBadges', 'categoryGrid', 'featuredProducts', 'promoBanner', 'bundleConfigurator', 'newArrivals', 'productGrid', 'bestsellers', 'recentlyViewed', 'giftFinder', 'aboutSection', 'craftsmanshipTimeline', 'testimonials', 'rewardsSection', 'newsletter']

export default function LayoutPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''
  const visible = (section: string) => g(`section_${section}`) !== 'hidden'

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Show or hide sections on the homepage.</p>
      {ALL_SECTIONS.map(s => (
        <label key={s} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer">
          <input type="checkbox" checked={visible(s)} onChange={e => updateSetting(`section_${s}`, e.target.checked ? 'visible' : 'hidden')} className="h-4 w-4" />
          <span className="text-sm capitalize">{s.replace(/([A-Z])/g, ' $1').trim()}</span>
        </label>
      ))}
    </div>
  )
}
