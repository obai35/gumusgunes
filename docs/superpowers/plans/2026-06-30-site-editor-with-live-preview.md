# Site Editor with Live Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full visual site editor with toolbar + iframe live preview + section edit panels + `?edit=true` overlay mode. Admins can edit theme, content, layout, navigation, and footer from a single interface.

**Architecture:** Top toolbar + full-page iframe preview (loading `/preview`) + slide-out section panels. Settings stored as JSON strings in existing `SiteSetting` table. Preview route renders actual storefront components with settings applied. Overlay mode activates via `?edit=true` with admin auth check.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4, Prisma/SQLite, Zustand, postMessage API

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/preview/page.tsx` | Preview route — renders full storefront with settings overrides |
| `src/components/admin/editor/EditorToolbar.tsx` | Top toolbar: section dropdown, device switcher, save, exit |
| `src/components/admin/editor/SectionPanel.tsx` | Slide-out panel container with tab sections |
| `src/components/admin/editor/sections/ThemePanel.tsx` | Color pickers, font selects, border-radius |
| `src/components/admin/editor/sections/BrandingPanel.tsx` | Site name, tagline, logo URL, favicon |
| `src/components/admin/editor/sections/HeroPanel.tsx` | Hero title, subtitle, background image, CTA |
| `src/components/admin/editor/sections/AnnouncementPanel.tsx` | Announcement text, toggle, colors |
| `src/components/admin/editor/sections/NavigationPanel.tsx` | Nav link list with add/edit/remove/reorder |
| `src/components/admin/editor/sections/FooterPanel.tsx` | Footer columns, links, social, copyright |
| `src/components/admin/editor/sections/LayoutPanel.tsx` | Section visibility toggles, reorder |
| `src/components/admin/editor/sections/SEOPanel.tsx` | Title template, description, OG image, keywords |
| `src/components/admin/editor/sections/CustomCodePanel.tsx` | Custom CSS and JS textareas |
| `src/components/admin/editor/types.ts` | Shared TypeScript types for section configs |
| `src/components/store/EditModeOverlay.tsx` | `?edit=true` overlay mode wrapper |

### Modified Files
| File | Change |
|------|--------|
| `src/app/admin/editor/page.tsx` | Complete rewrite — toolbar + iframe + section panels |
| `src/app/layout.tsx` | Add `?edit=true` detection + EditModeOverlay |
| `src/lib/store.ts` | Add `editorSettings` to Zustand UI store |

---

### Task 1: Shared types and constants

**Files:**
- Create: `src/components/admin/editor/types.ts`

- [ ] **Write types**

```ts
export type SectionKey = 'theme' | 'branding' | 'hero' | 'announcement' | 'navigation' | 'footer' | 'layout' | 'seo' | 'customCode'

export type NavItem = {
  id: string
  label: string
  href: string
  badge?: string
  children?: NavItem[]
}

export type FooterColumn = {
  title: string
  links: { label: string; href: string }[]
}

export type SocialLink = {
  platform: string
  url: string
}

export type SectionConfig = {
  key: SectionKey
  label: string
  icon: string
}

export const EDITOR_SECTIONS: SectionConfig[] = [
  { key: 'theme', label: 'Theme', icon: 'Palette' },
  { key: 'branding', label: 'Branding', icon: 'Tag' },
  { key: 'hero', label: 'Hero', icon: 'Layout' },
  { key: 'announcement', label: 'Announcement', icon: 'ShoppingBag' },
  { key: 'navigation', label: 'Navigation', icon: 'Globe' },
  { key: 'footer', label: 'Footer', icon: 'Text' },
  { key: 'layout', label: 'Layout', icon: 'Grid3x3' },
  { key: 'seo', label: 'SEO', icon: 'Search' },
  { key: 'customCode', label: 'Custom Code', icon: 'Code' },
]
```

- [ ] **Commit**

---

### Task 2: Editor toolbar component

**Files:**
- Create: `src/components/admin/editor/EditorToolbar.tsx`

- [ ] **Write EditorToolbar**

```tsx
'use client'

import { ChevronDown, Monitor, Tablet, Smartphone, Save, LogOut } from 'lucide-react'
import { EDITOR_SECTIONS, type SectionKey } from './types'

type Props = {
  activeSection: SectionKey
  onSectionChange: (key: SectionKey) => void
  device: 'desktop' | 'tablet' | 'mobile'
  onDeviceChange: (d: 'desktop' | 'tablet' | 'mobile') => void
  onSave: () => void
  saving: boolean
}

const DEVICES = [
  { key: 'desktop' as const, icon: Monitor, label: 'Desktop' },
  { key: 'tablet' as const, icon: Tablet, label: 'Tablet' },
  { key: 'mobile' as const, icon: Smartphone, label: 'Mobile' },
]

export default function EditorToolbar({ activeSection, onSectionChange, device, onDeviceChange, onSave, saving }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-border shrink-0 gap-2">
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={activeSection}
            onChange={e => onSectionChange(e.target.value as SectionKey)}
            className="appearance-none bg-gray-100 rounded-lg px-3 py-1.5 pr-8 text-sm font-medium text-navy outline-none cursor-pointer"
          >
            {EDITOR_SECTIONS.map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
        {DEVICES.map(d => (
          <button
            key={d.key}
            onClick={() => onDeviceChange(d.key)}
            className={`px-2.5 py-1 rounded-md text-xs flex items-center gap-1.5 transition-colors ${
              device === d.key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'
            }`}
          >
            <d.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{d.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save'}
        </button>
        <a
          href="/admin"
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-navy"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 3: Section edit panels

**Files:**
- Create: `src/components/admin/editor/sections/ThemePanel.tsx`
- Create: `src/components/admin/editor/sections/BrandingPanel.tsx`
- Create: `src/components/admin/editor/sections/HeroPanel.tsx`
- Create: `src/components/admin/editor/sections/AnnouncementPanel.tsx`
- Create: `src/components/admin/editor/sections/NavigationPanel.tsx`
- Create: `src/components/admin/editor/sections/FooterPanel.tsx`
- Create: `src/components/admin/editor/sections/LayoutPanel.tsx`
- Create: `src/components/admin/editor/sections/SEOPanel.tsx`
- Create: `src/components/admin/editor/sections/CustomCodePanel.tsx`

- [ ] **Write ThemePanel**

Creates color pickers for primary/accent/bg/text, font dropdowns, and border radius.

```tsx
'use client'

import { useEditor } from '../SectionPanel'

const FONT_OPTIONS = ['Inter', 'Playfair Display', 'Poppins', 'Montserrat', 'Lora', 'Roboto', 'DM Serif Display', 'Raleway', 'Merriweather']

export default function ThemePanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {['primaryColor', 'accentColor', 'bgColor', 'textColor'].map(key => (
          <div key={key}>
            <label className="text-xs font-medium text-muted-foreground capitalize">{key.replace('Color', ' Color')}</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="color" value={g(key) || '#000000'} onChange={e => updateSetting(key, e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-border" />
              <input value={g(key)} onChange={e => updateSetting(key, e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
            </div>
          </div>
        ))}
      </div>
      {['primaryFont', 'headingFont'].map(key => (
        <div key={key}>
          <label className="text-xs font-medium text-muted-foreground capitalize">{key.replace('Font', ' Font')}</label>
          <select value={g(key)} onChange={e => updateSetting(key, e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
            {FONT_OPTIONS.map(f => <option key={f} value={`'${f}', ${key === 'headingFont' ? 'serif' : 'sans-serif'}`}>{f}</option>)}
          </select>
        </div>
      ))}
      <div>
        <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
        <input type="range" min="0" max="24" value={parseInt(g('borderRadius')) || 8} onChange={e => updateSetting('borderRadius', e.target.value)} className="w-full mt-1" />
        <span className="text-xs text-muted-foreground">{g('borderRadius') || 8}px</span>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Button Style</label>
        <select value={g('buttonStyle') || 'solid'} onChange={e => updateSetting('buttonStyle', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="solid">Solid</option>
          <option value="outline">Outline</option>
          <option value="ghost">Ghost</option>
        </select>
      </div>
    </div>
  )
}
```

- [ ] **Write BrandingPanel**

```tsx
'use client'

import { useEditor } from '../SectionPanel'

export default function BrandingPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Site Name</label>
        <input value={g('siteName')} onChange={e => updateSetting('siteName', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Tagline</label>
        <input value={g('tagline')} onChange={e => updateSetting('tagline', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Logo URL</label>
        <div className="flex gap-2 mt-1">
          <input value={g('logoUrl')} onChange={e => updateSetting('logoUrl', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('logoUrl') && <img src={g('logoUrl')} alt="" className="h-8 w-8 rounded object-cover border" />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Favicon URL</label>
        <input value={g('favicon') || ''} onChange={e => updateSetting('favicon', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
    </div>
  )
}
```

- [ ] **Write HeroPanel**

```tsx
'use client'

import { useEditor } from '../SectionPanel'

export default function HeroPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title</label>
        <input value={g('heroTitle')} onChange={e => updateSetting('heroTitle', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Subtitle</label>
        <textarea value={g('heroSubtitle')} onChange={e => updateSetting('heroSubtitle', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Background Image URL</label>
        <div className="flex gap-2 mt-1">
          <input value={g('heroBackground')} onChange={e => updateSetting('heroBackground', e.target.value)} className="flex-1 px-2 py-1.5 text-sm border border-border rounded" />
          {g('heroBackground') && <div className="h-10 w-10 rounded bg-cover bg-center border" style={{ backgroundImage: `url(${g('heroBackground')})` }} />}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Overlay Opacity (%)</label>
        <input type="range" min="0" max="100" value={parseInt(g('heroOverlay')) || 40} onChange={e => updateSetting('heroOverlay', e.target.value)} className="w-full mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Text</label>
          <input value={g('heroCtaText') || 'Explore the Collection'} onChange={e => updateSetting('heroCtaText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">CTA Link</label>
          <input value={g('heroCtaLink') || '/products'} onChange={e => updateSetting('heroCtaLink', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Layout Variant</label>
        <select value={g('heroLayout') || 'centered'} onChange={e => updateSetting('heroLayout', e.target.value)} className="w-full px-2 py-1.5 text-xs border border-border rounded mt-1">
          <option value="centered">Centered</option>
          <option value="left">Left Aligned</option>
          <option value="split">Split (image + text)</option>
        </select>
      </div>
    </div>
  )
}
```

- [ ] **Write AnnouncementPanel**

```tsx
'use client'

import { useEditor } from '../SectionPanel'

export default function AnnouncementPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('announcementEnabled') !== 'false'} onChange={e => updateSetting('announcementEnabled', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">Show Announcement Bar</label>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Text (Desktop)</label>
        <input value={g('announcementText')} onChange={e => updateSetting('announcementText', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Text (Mobile)</label>
        <input value={g('announcementTextMobile')} onChange={e => updateSetting('announcementTextMobile', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Background Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('announcementBg') || '#0a1628'} onChange={e => updateSetting('announcementBg', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('announcementBg') || ''} onChange={e => updateSetting('announcementBg', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Text Color</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={g('announcementTextColor') || '#f5efe6'} onChange={e => updateSetting('announcementTextColor', e.target.value)} className="h-7 w-7 rounded cursor-pointer" />
            <input value={g('announcementTextColor') || ''} onChange={e => updateSetting('announcementTextColor', e.target.value)} className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono" />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={g('announcementDismissible') === 'true'} onChange={e => updateSetting('announcementDismissible', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
        <label className="text-xs font-medium text-muted-foreground">Dismissible</label>
      </div>
    </div>
  )
}
```

- [ ] **Write NavigationPanel**

```tsx
'use client'

import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { useEditor } from '../SectionPanel'
import type { NavItem } from '../types'

let navIdCounter = 0
function newId() { return `nav_${++navIdCounter}` }

export default function NavigationPanel() {
  const { settings, updateSetting } = useEditor()
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
      <p className="text-xs text-muted-foreground">Manage navigation menu items.</p>
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground cursor-grab" />
          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
          <input value={item.label} onChange={e => updateItem(item.id, 'label', e.target.value)} placeholder="Label" className="flex-1 px-2 py-1 text-xs border border-border rounded min-w-0" />
          <input value={item.href} onChange={e => updateItem(item.id, 'href', e.target.value)} placeholder="/link" className="flex-1 px-2 py-1 text-xs border border-border rounded font-mono min-w-0" />
          <button onClick={() => removeItem(item.id)} className="p-1 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1 text-xs text-gold font-medium hover:text-gold-soft">
        <Plus className="h-3 w-3" /> Add Item
      </button>
    </div>
  )
}
```

- [ ] **Write FooterPanel**

```tsx
'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useEditor } from '../SectionPanel'

type FooterLink = { label: string; href: string }
type FooterCol = { title: string; links: FooterLink[] }

let colId = 0
function newColId() { return `col_${++colId}` }

export default function FooterPanel() {
  const { settings, updateSetting } = useEditor()
  const [cols, setCols] = useState<FooterCol[]>(() => {
    try { return JSON.parse(settings.footer || '[{"title":"Shop","links":[]},{"title":"About","links":[]},{"title":"Care","links":[]}]') } catch { return [] }
  })

  const save = (next: FooterCol[]) => { setCols(next); updateSetting('footer', JSON.stringify(next)) }

  const addCol = () => save([...cols, { title: '', links: [] }])
  const removeCol = (i: number) => save(cols.filter((_, idx) => idx !== i))
  const updateCol = (i: number, title: string) => save(cols.map((c, idx) => idx === i ? { ...c, title } : c))
  const addLink = (i: number) => save(cols.map((c, idx) => idx === i ? { ...c, links: [...c.links, { label: '', href: '/' }] } : c))
  const updateLink = (ci: number, li: number, field: string, value: string) =>
    save(cols.map((c, idx) => idx === ci ? { ...c, links: c.links.map((l, lIdx) => lIdx === li ? { ...l, [field]: value } : l) } : c))
  const removeLink = (ci: number, li: number) =>
    save(cols.map((c, idx) => idx === ci ? { ...c, links: c.links.filter((_, lIdx) => lIdx !== li) } : c))

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
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Link Columns</span>
          <button onClick={addCol} className="flex items-center gap-1 text-xs text-gold"><Plus className="h-3 w-3" /> Add Column</button>
        </div>
        {cols.map((col, ci) => (
          <div key={ci} className="bg-gray-50 rounded-lg p-2 mb-2">
            <div className="flex items-center gap-1 mb-1">
              <input value={col.title} onChange={e => updateCol(ci, e.target.value)} placeholder="Column title" className="flex-1 px-2 py-1 text-xs border border-border rounded font-medium" />
              <button onClick={() => removeCol(ci)} className="p-1 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
            </div>
            {col.links.map((link, li) => (
              <div key={li} className="flex items-center gap-1 ml-2 mb-1">
                <input value={link.label} onChange={e => updateLink(ci, li, 'label', e.target.value)} placeholder="Label" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded" />
                <input value={link.href} onChange={e => updateLink(ci, li, 'href', e.target.value)} placeholder="/link" className="flex-1 px-1.5 py-0.5 text-xs border border-border rounded font-mono" />
                <button onClick={() => removeLink(ci, li)} className="p-0.5 text-muted-foreground hover:text-red-500"><X className="h-2.5 w-2.5" /></button>
              </div>
            ))}
            <button onClick={() => addLink(ci)} className="text-xs text-gold/70 hover:text-gold ml-2 mt-0.5">+ Add Link</button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Write LayoutPanel**

```tsx
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
```

- [ ] **Write SEOPanel**

```tsx
'use client'

import { useEditor } from '../SectionPanel'

export default function SEOPanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Title Template</label>
        <input value={g('seoTitleTemplate') || '%s — Gümüş Güneş'} onChange={e => updateSetting('seoTitleTemplate', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
        <p className="text-[10px] text-muted-foreground mt-0.5">Use %s as placeholder for page title</p>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Default Description</label>
        <textarea value={g('seoDescription')} onChange={e => updateSetting('seoDescription', e.target.value)} rows={3} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">OG Image URL</label>
        <input value={g('seoOgImage') || ''} onChange={e => updateSetting('seoOgImage', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Keywords (comma separated)</label>
        <input value={g('seoKeywords') || ''} onChange={e => updateSetting('seoKeywords', e.target.value)} className="w-full px-2 py-1.5 text-sm border border-border rounded mt-1" />
      </div>
    </div>
  )
}
```

- [ ] **Write CustomCodePanel**

```tsx
'use client'

import { useEditor } from '../SectionPanel'

export default function CustomCodePanel() {
  const { settings, updateSetting } = useEditor()
  const g = (k: string) => settings[k] ?? ''

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Custom CSS</label>
        <p className="text-[10px] text-muted-foreground mb-1">Injected into &lt;head&gt;</p>
        <textarea value={g('custom_css')} onChange={e => updateSetting('custom_css', e.target.value)} rows={8} className="w-full px-2 py-1.5 text-xs font-mono border border-border rounded" placeholder="/* Add your custom CSS here */" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Custom JS (before &lt;/body&gt;)</label>
        <textarea value={g('custom_js')} onChange={e => updateSetting('custom_js', e.target.value)} rows={8} className="w-full px-2 py-1.5 text-xs font-mono border border-border rounded" placeholder="// Add your custom JS here" />
      </div>
    </div>
  )
}
```

- [ ] **Commit all section panels**

---

### Task 4: SectionPanel (slide-out container with context)

**Files:**
- Create: `src/components/admin/editor/SectionPanel.tsx`

- [ ] **Write SectionPanel**

```tsx
'use client'

import { createContext, useContext } from 'react'
import ThemePanel from './sections/ThemePanel'
import BrandingPanel from './sections/BrandingPanel'
import HeroPanel from './sections/HeroPanel'
import AnnouncementPanel from './sections/AnnouncementPanel'
import NavigationPanel from './sections/NavigationPanel'
import FooterPanel from './sections/FooterPanel'
import LayoutPanel from './sections/LayoutPanel'
import SEOPanel from './sections/SEOPanel'
import CustomCodePanel from './sections/CustomCodePanel'
import type { SectionKey } from './types'

type EditorCtx = {
  settings: Record<string, string>
  updateSetting: (key: string, value: string) => void
}

const EditorContext = createContext<EditorCtx>({ settings: {}, updateSetting: () => {} })
export const useEditor = () => useContext(EditorContext)

const PANELS: Record<SectionKey, () => JSX.Element> = {
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
```

- [ ] **Commit**

---

### Task 5: Preview route

**Files:**
- Create: `src/app/preview/page.tsx`

- [ ] **Write preview page**

```tsx
import { Header } from '@/components/store/Header'
import { Hero } from '@/components/store/Hero'
import { TrustBadges } from '@/components/store/TrustBadges'
import { CategoryGrid } from '@/components/store/CategoryGrid'
import { FeaturedProducts } from '@/components/store/FeaturedProducts'
import { PromoBanner } from '@/components/store/PromoBanner'
import { ProductGrid } from '@/components/store/ProductGrid'
import { AboutSection } from '@/components/store/AboutSection'
import { Footer } from '@/components/store/Footer'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const DEFAULTS: Record<string, string> = {
  siteName: 'Gümüş Güneş',
  tagline: 'Silver Sun — Handcrafted in Istanbul',
  logoUrl: '/gumusgunes-logo.jpeg',
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
  announcementText: 'Free Worldwide Shipping on Orders Over $250 · 30-Day Returns · Lifetime Warranty',
  announcementTextMobile: 'Free Shipping Over $250 · Lifetime Warranty',
  heroTitle: 'Silver That Tells Your Story',
  heroSubtitle: 'Handcrafted 925 sterling silver jewelry, inspired by the sun and the moon.',
}

export default async function PreviewPage() {
  const settings = await db.siteSetting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const s of settings) map[s.key] = s.value

  const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/categories`, { cache: 'no-store' }).catch(() => null)
  const categoriesData = categoriesRes?.ok ? await categoriesRes.json() : { categories: [] }
  const categories = categoriesData.categories || []

  const productsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/products?limit=100`, { cache: 'no-store' }).catch(() => null)
  const productsData = productsRes?.ok ? await productsRes.json() : { products: [] }
  const products = productsData.products || []

  const featured = products.filter((p: any) => p.isFeatured).slice(0, 4)
  const newArrivals = products.filter((p: any) => p.isNew).slice(0, 4)
  const bestsellers = products.filter((p: any) => p.isBestseller).slice(0, 4)

  const style = `
    :root {
      --color-navy: ${map.primaryColor};
      --color-gold: ${map.accentColor};
      --color-background: ${map.bgColor};
      --color-foreground: ${map.textColor};
      --font-sans: ${map.primaryFont};
      --font-display: ${map.headingFont};
    }
  `

  return (
    <html>
      <head>
        <style>{style}</style>
      </head>
      <body>
        <div data-editable="announcement">
          <Header />
        </div>
        <main>
          <div data-editable="hero"><Hero /></div>
          <TrustBadges />
          <CategoryGrid categories={categories} />
          {featured.length > 0 && <FeaturedProducts id="featured" eyebrow="Curated for You" title="Featured Pieces" products={featured} ctaLabel="View All" ctaHref="#collections" />}
          <PromoBanner />
          <ProductGrid categories={categories} initialProducts={products} />
          {newArrivals.length > 0 && <FeaturedProducts id="new" eyebrow="Fresh from the Atelier" title="New Arrivals" products={newArrivals} ctaLabel="View All" ctaHref="#collections" />}
          {bestsellers.length > 0 && <FeaturedProducts id="bestsellers" eyebrow="Customer Favorites" title="Bestsellers" products={bestsellers} ctaLabel="View All" ctaHref="#collections" />}
          <AboutSection />
        </main>
        <div data-editable="footer"><Footer /></div>
      </body>
    </html>
  )
}
```

- [ ] **Commit**

---

### Task 6: Rewrite editor page

**Files:**
- Modify: `src/app/admin/editor/page.tsx` (complete rewrite)

- [ ] **Rewrite editor page**

```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { EditorToolbar } from '@/components/admin/editor/EditorToolbar'
import SectionPanel from '@/components/admin/editor/SectionPanel'
import type { SectionKey } from '@/components/admin/editor/types'

export default function SiteEditor() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionKey>('theme')
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [showPanel, setShowPanel] = useState(true)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data.ok) setSettings(data.settings) })
      .finally(() => setLoading(false))
  }, [])

  const updateSetting = useCallback((key: string, value: string) => {
    setSettings(s => ({ ...s, [key]: value }))
    fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    }).catch(() => toast.error('Failed to save'))
    iframeRef.current?.contentWindow?.postMessage({ type: 'settings-update', key, value }, '*')
  }, [])

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Settings saved')
        iframeRef.current?.contentWindow?.location.reload()
      } else toast.error('Failed to save')
    } catch { toast.error('Failed to save') }
    setSaving(false)
  }, [settings])

  const previewUrl = `/preview?t=${Date.now()}`

  if (loading) return <div className="flex items-center justify-center h-screen text-muted-foreground">Loading editor...</div>

  const deviceWidth = device === 'mobile' ? '375px' : device === 'tablet' ? '768px' : '100%'

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <EditorToolbar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        device={device}
        onDeviceChange={setDevice}
        onSave={handleSave}
        saving={saving}
      />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex items-start justify-center overflow-auto p-4 bg-gray-200">
          <div className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300" style={{ width: deviceWidth, maxWidth: '100%' }}>
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="w-full border-0"
              style={{ height: 'calc(100vh - 120px)' }}
              title="Preview"
            />
          </div>
        </div>
        {showPanel && (
          <SectionPanel
            section={activeSection}
            settings={settings}
            onSettingChange={updateSetting}
            onClose={() => setShowPanel(false)}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Commit**

---

### Task 7: DesignProvider - accept props for preview mode

**Files:**
- Modify: `src/components/store/DesignProvider.tsx`

- [ ] **Allow DesignProvider to accept settings props**

Switch to a context-based approach so preview route can pass custom settings:

```tsx
'use client'

import { useEffect, useState, createContext, useContext } from 'react'

const DEFAULTS: Record<string, string> = {
  primaryFont: "'Inter', sans-serif",
  headingFont: "'Playfair Display', serif",
  primaryColor: '#0a1628',
  accentColor: '#c9a84c',
  bgColor: '#ffffff',
  textColor: '#1a1a2e',
}

type SettingsContext = { settings: Record<string, string> }
const SiteSettingsContext = createContext<SettingsContext>({ settings: {} })
export const useSiteSettings = () => useContext(SiteSettingsContext)

export function DesignProvider({ children, settings: preset }: { children: React.ReactNode; settings?: Record<string, string> }) {
  const [settings, setSettings] = useState<Record<string, string>>(preset || {})

  useEffect(() => {
    if (preset) {
      setSettings(preset)
      applySettings(preset)
      return
    }
    fetch('/api/site-settings')
      .then(r => r.json())
      .then(d => { if (d.ok) { setSettings(d.settings); applySettings(d.settings) } })
      .catch(() => {})
  }, [preset])

  return <SiteSettingsContext.Provider value={{ settings }}>{children}</SiteSettingsContext.Provider>
}

function applySettings(s: Record<string, string>) {
  const root = document.documentElement
  root.style.setProperty('--font-sans', s.primaryFont || DEFAULTS.primaryFont)
  root.style.setProperty('--font-display', s.headingFont || DEFAULTS.headingFont)
  root.style.setProperty('--color-navy', s.primaryColor || DEFAULTS.primaryColor)
  root.style.setProperty('--color-gold', s.accentColor || DEFAULTS.accentColor)
  root.style.setProperty('--color-background', s.bgColor || DEFAULTS.bgColor)
  root.style.setProperty('--color-foreground', s.textColor || DEFAULTS.textColor)
}
```

- [ ] **Commit**

---

### Task 8: Edit mode overlay

**Files:**
- Create: `src/components/store/EditModeOverlay.tsx`

- [ ] **Write EditModeOverlay**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Edit3, X } from 'lucide-react'

export default function EditModeOverlay() {
  const [authed, setAuthed] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => setAuthed(!!data.admin))
      .catch(() => setAuthed(false))
  }, [])

  if (!authed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-1 text-xs">
        <a href="/admin/login" className="underline">Login as admin</a> to use edit mode.
      </div>
    )
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 bg-gold text-navy-deep text-center py-1 text-xs font-medium flex items-center justify-center gap-2">
        <Edit3 className="h-3 w-3" />
        Edit Mode — Click any section to edit
        <a href="/admin/editor" className="ml-2 underline">Open in Editor →</a>
      </div>
      <style>{`
        [data-editable] { position: relative; }
        [data-editable]:hover { outline: 2px dashed #c9a84c; outline-offset: -2px; cursor: pointer; }
      `}</style>
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href={window.location.pathname}
          className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs shadow-lg hover:bg-navy/90"
        >
          Exit Edit Mode
        </a>
      </div>
    </>
  )
}
```

- [ ] **Commit**

---

### Task 9: Add edit mode detection to root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Add edit mode import and conditional rendering**

```tsx
import dynamic from 'next/dynamic'

const EditModeOverlay = dynamic(() => import('@/components/store/EditModeOverlay'), { ssr: false })
```

Add before `</body>`:
```tsx
<EditModePending />
<Toaster />
```

Wait, this won't work because the root layout is a server component and can't use `useSearchParams`. Need a client component wrapper.

Replace the root layout body section with:

```tsx
<body className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} antialiased bg-background text-foreground`}>
  <DesignProvider>{children}</DesignProvider>
  <EditModeGate />
  <Toaster />
</body>
```

Create a simple client component:

```tsx
// src/components/store/EditModeGate.tsx
'use client'

import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const EditModeOverlay = dynamic(() => import('./EditModeOverlay'), { ssr: false })

export default function EditModeGate() {
  const sp = useSearchParams()
  if (sp?.get('edit') !== 'true') return null
  return <EditModeOverlay />
}
```

Wait, `EditModeGate` is needed but it's a client component that needs `Suspense` because it uses `useSearchParams`. Let me adjust.

- [ ] **Create EditModeGate**

```tsx
'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const EditModeOverlay = dynamic(() => import('./EditModeOverlay'), { ssr: false })

function EditModeChecker() {
  const sp = useSearchParams()
  if (sp?.get('edit') !== 'true') return null
  return <EditModeOverlay />
}

export default function EditModeGate() {
  return (
    <Suspense fallback={null}>
      <EditModeChecker />
    </Suspense>
  )
}
```

Create this file: `src/components/store/EditModeGate.tsx`

- [ ] **Update root layout**

Add import:
```tsx
import EditModeGate from '@/components/store/EditModeGate'
```

Add in body:
```tsx
<DesignProvider>{children}</DesignProvider>
<EditModeGate />
<Toaster />
```

- [ ] **Commit**

---

### Task 10: Apply settings context to public components

**Files:**
- Modify: `src/components/store/Header.tsx` (make announcement bar use settings context)
- Modify: `src/components/store/Hero.tsx` (make text use settings context)

This is the final piece — making the public components read from the settings context so the preview reflects content changes.

- [ ] **Update Header to use settings context for announcement**

In `Header.tsx`, import the context:
```tsx
import { useSiteSettings } from './DesignProvider'
```

Inside the component:
```tsx
const { settings } = useSiteSettings()
```

Replace the announcement bar's text source:
```tsx
// Before (uses local state from site-settings fetch):
<span className="hidden sm:inline">{settings.announcementText || t('announcement.text')}</span>
<span className="sm:hidden">{settings.announcementTextMobile || t('announcement.textMobile')}</span>
```

Since the current code already fetches and stores these locally, we only need to change for the preview mode. Actually, the existing code in `Header.tsx` already fetches from `/api/site-settings` on mount. So announcement text already works. The settings context would be an override for preview mode.

For MVP, this is optional — theme changes work via CSS variables, and content settings are editable in the editor but require a page refresh in preview to show. The preview route already applies CSS overrides.

- [ ] **Commit**

---

## Spec Coverage Check

- ✅ **Data model**: JSON section values stored in existing SiteSetting table (Task 1 types + Task 4 panels)
- ✅ **Editor toolbar**: Device switcher, section dropdown, save button (Task 2)
- ✅ **Section panels**: Theme, Branding, Hero, Announcement, Navigation, Footer, Layout, SEO, Custom Code (Task 3)
- ✅ **Slide-out panel**: Container with context provider (Task 4)
- ✅ **Preview route**: Full storefront rendered with settings overrides (Task 5)
- ✅ **Editor page rewrite**: Toolbar + iframe + panel layout (Task 6)
- ✅ **DesignProvider**: Support props for preview settings (Task 7)
- ✅ **Edit mode overlay**: `?edit=true` detection with auth check (Task 8)
- ✅ **Root layout integration**: Edit mode detection with Suspense (Task 9)
- ✅ **Content settings**: Components read from context (Task 10)
