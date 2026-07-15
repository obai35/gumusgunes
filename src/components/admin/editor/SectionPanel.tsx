'use client'

import { createContext, useContext, type ComponentType } from 'react'
import { ThemePanel } from './sections/ThemePanel'
import { BrandingPanel } from './sections/BrandingPanel'
import { HeroPanel } from './sections/HeroPanel'
import { AnnouncementPanel } from './sections/AnnouncementPanel'
import { PromoPanel } from './sections/PromoPanel'
import { NavigationPanel } from './sections/NavigationPanel'
import { CategoriesPanel } from './sections/CategoriesPanel'
import { FooterPanel } from './sections/FooterPanel'
import { LayoutPanel } from './sections/LayoutPanel'
import { SEOPanel } from './sections/SEOPanel'
import { CustomCodePanel } from './sections/CustomCodePanel'
import { TrustBadgesPanel } from './sections/TrustBadgesPanel'
import { AboutSectionPanel } from './sections/AboutSectionPanel'
import { CraftsmanshipTimelinePanel } from './sections/CraftsmanshipTimelinePanel'
import { TestimonialsPanel } from './sections/TestimonialsPanel'
import { RewardsSectionPanel } from './sections/RewardsSectionPanel'
import type { SectionKey } from './types'
import { Eye, EyeOff } from 'lucide-react'

type EditorCtx = {
  settings: Record<string, string>
  updateSetting: (key: string, value: string) => void
}

const EditorContext = createContext<EditorCtx>({ settings: {}, updateSetting: () => {} })
export const useEditor = () => useContext(EditorContext)

const PANELS: Record<SectionKey, ComponentType> = {
  theme: ThemePanel,
  branding: BrandingPanel,
  hero: HeroPanel,
  announcement: AnnouncementPanel,
  promo: PromoPanel,
  navigation: NavigationPanel,
  categories: CategoriesPanel,
  footer: FooterPanel,
  layout: LayoutPanel,
  seo: SEOPanel,
  customCode: CustomCodePanel,
  trustBadges: TrustBadgesPanel,
  aboutSection: AboutSectionPanel,
  craftsmanshipTimeline: CraftsmanshipTimelinePanel,
  testimonials: TestimonialsPanel,
  rewardsSection: RewardsSectionPanel,
}

type Props = { section: SectionKey; settings: Record<string, string>; onSettingChange: (key: string, value: string) => void; onClose: () => void }

const SECTION_VISIBILITY_MAP: Partial<Record<SectionKey, string>> = {
  hero: 'hero',
  announcement: 'announcement',
  promo: 'promoBanner',
  navigation: 'navigation',
  categories: 'categoryGrid',
  footer: 'footer',
  trustBadges: 'trustBadges',
  aboutSection: 'aboutSection',
  craftsmanshipTimeline: 'craftsmanshipTimeline',
  testimonials: 'testimonials',
  rewardsSection: 'rewardsSection',
}

function canToggle(section: SectionKey): boolean {
  return section in SECTION_VISIBILITY_MAP
}

function isVisible(settings: Record<string, string>, section: SectionKey): boolean {
  const key = SECTION_VISIBILITY_MAP[section]
  if (!key) return true
  return settings[`section_${key}`] !== 'hidden'
}

export default function SectionPanel({ section, settings, onSettingChange, onClose }: Props) {
  const Panel = PANELS[section]
  if (!Panel) return null

  const showToggle = canToggle(section)
  const visible = isVisible(settings, section)

  return (
    <EditorContext.Provider value={{ settings, updateSetting: onSettingChange }}>
      <div className="w-[400px] border-l border-border bg-white flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-navy capitalize">{section.replace(/([A-Z])/g, ' $1')}</h3>
          <div className="flex items-center gap-2">
            {showToggle && (
              <button
                onClick={() => {
                  const key = SECTION_VISIBILITY_MAP[section]!
                  onSettingChange(`section_${key}`, visible ? 'hidden' : 'visible')
                }}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {visible ? 'Visible' : 'Hidden'}
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-navy text-sm">✕</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Panel />
        </div>
      </div>
    </EditorContext.Provider>
  )
}
