'use client'

import { createContext, useContext, type ComponentType } from 'react'
import { ThemePanel } from './sections/ThemePanel'
import { BrandingPanel } from './sections/BrandingPanel'
import { HeroPanel } from './sections/HeroPanel'
import { AnnouncementPanel } from './sections/AnnouncementPanel'
import { NavigationPanel } from './sections/NavigationPanel'
import { FooterPanel } from './sections/FooterPanel'
import { LayoutPanel } from './sections/LayoutPanel'
import { SEOPanel } from './sections/SEOPanel'
import { CustomCodePanel } from './sections/CustomCodePanel'
import type { SectionKey } from './types'

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
  navigation: NavigationPanel,
  footer: FooterPanel,
  layout: LayoutPanel,
  seo: SEOPanel,
  customCode: CustomCodePanel,
}

type Props = { section: SectionKey; settings: Record<string, string>; onSettingChange: (key: string, value: string) => void; onClose: () => void }

export default function SectionPanel({ section, settings, onSettingChange, onClose }: Props) {
  const Panel = PANELS[section]
  if (!Panel) return null

  return (
    <EditorContext.Provider value={{ settings, updateSetting: onSettingChange }}>
      <div className="w-[400px] border-l border-border bg-white flex flex-col shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-navy capitalize">{section.replace(/([A-Z])/g, ' $1')}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-navy text-sm">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <Panel />
        </div>
      </div>
    </EditorContext.Provider>
  )
}
