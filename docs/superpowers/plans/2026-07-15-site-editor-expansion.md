# Site Editor Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 new editable sections to the visual site editor: Trust Badges, About Section, Craftsmanship Timeline, Testimonials, and Rewards Section.

**Architecture:** Follow the existing pattern: each section gets a panel component under `src/components/admin/editor/sections/`, registered in `SectionPanel.tsx` and `types.ts`. Data is stored as JSON strings in the `SiteSetting` key-value table. Public rendering components are added to the store components.

**Tech Stack:** Next.js 14 App Router, React 18, Prisma (SiteSetting model), TypeScript, Tailwind CSS

---

### Task 1: Add section keys and types

**Files:**
- Modify: `src/components/admin/editor/types.ts`

- [ ] **Add new section keys to the SectionKey union and EDITOR_SECTIONS array**

```ts
// In types.ts, add to SectionKey union:
export type SectionKey =
  | 'theme' | 'branding' | 'hero' | 'announcement' | 'promo'
  | 'navigation' | 'categories' | 'footer' | 'layout' | 'seo'
  | 'customCode'
  | 'trustBadges' | 'aboutSection' | 'craftsmanshipTimeline'
  | 'testimonials' | 'rewardsSection'

// Add to EDITOR_SECTIONS array (before the closing ]):
  { key: 'trustBadges', label: 'Trust Badges' },
  { key: 'aboutSection', label: 'About Section' },
  { key: 'craftsmanshipTimeline', label: 'Craftsmanship Timeline' },
  { key: 'testimonials', label: 'Testimonials' },
  { key: 'rewardsSection', label: 'Rewards Section' },
```

---

### Task 2: Register new panels in SectionPanel

**Files:**
- Modify: `src/components/admin/editor/SectionPanel.tsx`

- [ ] **Import new panel components and register them in PANELS and SECTION_VISIBILITY_MAP**

At the top imports section, add:
```tsx
import { TrustBadgesPanel } from './sections/TrustBadgesPanel'
import { AboutSectionPanel } from './sections/AboutSectionPanel'
import { CraftsmanshipTimelinePanel } from './sections/CraftsmanshipTimelinePanel'
import { TestimonialsPanel } from './sections/TestimonialsPanel'
import { RewardsSectionPanel } from './sections/RewardsSectionPanel'
```

In the `PANELS` record, add:
```tsx
  trustBadges: TrustBadgesPanel,
  aboutSection: AboutSectionPanel,
  craftsmanshipTimeline: CraftsmanshipTimelinePanel,
  testimonials: TestimonialsPanel,
  rewardsSection: RewardsSectionPanel,
```

In the `SECTION_VISIBILITY_MAP` at the bottom, add:
```tsx
  trustBadges: 'section_trustBadges',
  aboutSection: 'section_aboutSection',
  craftsmanshipTimeline: 'section_craftsmanshipTimeline',
  testimonials: 'section_testimonials',
  rewardsSection: 'section_rewardsSection',
```

---

### Task 3: Create TrustBadgesPanel

**Files:**
- Create: `src/components/admin/editor/sections/TrustBadgesPanel.tsx`

- [ ] **Create the component with JSON array editor for badge items**

```tsx
'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
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
```

---

### Task 4: Create AboutSectionPanel

**Files:**
- Create: `src/components/admin/editor/sections/AboutSectionPanel.tsx`

- [ ] **Create the component with text fields and stats array editor**

```tsx
'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus } from 'lucide-react'

interface StatItem {
  value: string
  label: string
}

export function AboutSectionPanel() {
  const { settings, updateSetting } = useEditor()

  const title = settings.aboutTitle ?? ''
  const content = settings.aboutContent ?? ''
  const imageUrl = settings.aboutImageUrl ?? ''
  const mission = settings.aboutMission ?? ''
  const vision = settings.aboutVision ?? ''
  const raw = settings.aboutStats ? JSON.parse(settings.aboutStats) : []
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
        <label className="text-xs text-gray-500 font-medium">Title</label>
        <Input value={title} onChange={e => updateSetting('aboutTitle', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Content</label>
        <Textarea rows={5} value={content} onChange={e => updateSetting('aboutContent', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Image URL</label>
        <Input value={imageUrl} onChange={e => updateSetting('aboutImageUrl', e.target.value)} />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Mission</label>
        <Textarea rows={3} value={mission} onChange={e => updateSetting('aboutMission', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Vision</label>
        <Textarea rows={3} value={vision} onChange={e => updateSetting('aboutVision', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Stats</label>
        {stats.map((stat, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-2">
            <input
              className="w-20 border rounded px-2 py-1 text-sm"
              placeholder="Value"
              value={stat.value}
              onChange={e => updateStat(idx, 'value', e.target.value)}
            />
            <input
              className="flex-1 border rounded px-2 py-1 text-sm"
              placeholder="Label"
              value={stat.label}
              onChange={e => updateStat(idx, 'label', e.target.value)}
            />
            <button onClick={() => removeStat(idx)} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button onClick={addStat} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> Add Stat
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 5: Create CraftsmanshipTimelinePanel

**Files:**
- Create: `src/components/admin/editor/sections/CraftsmanshipTimelinePanel.tsx`

- [ ] **Create the component with timeline entry editor**

```tsx
'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus } from 'lucide-react'

interface TimelineEntry {
  year: string
  title: string
  description: string
  imageUrl: string
}

export function CraftsmanshipTimelinePanel() {
  const { settings, updateSetting } = useEditor()
  const raw = settings.craftsmanshipTimeline ? JSON.parse(settings.craftsmanshipTimeline) : []
  const [entries, setEntries] = useState<TimelineEntry[]>(raw)

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
      <p className="text-sm text-gray-500">Key milestones in the brand's history.</p>
      {entries.map((entry, idx) => (
        <div key={idx} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Entry {idx + 1}</span>
            <button onClick={() => remove(idx)} className="text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Year</label>
              <Input value={entry.year} onChange={e => update(idx, 'year', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Title</label>
              <Input value={entry.title} onChange={e => update(idx, 'title', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Description</label>
            <Textarea rows={3} value={entry.description} onChange={e => update(idx, 'description', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Image URL (optional)</label>
            <Input value={entry.imageUrl} onChange={e => update(idx, 'imageUrl', e.target.value)} />
          </div>
        </div>
      ))}
      <Button onClick={add} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Add Entry
      </Button>
    </div>
  )
}
```

---

### Task 6: Create TestimonialsPanel

**Files:**
- Create: `src/components/admin/editor/sections/TestimonialsPanel.tsx`

- [ ] **Create the component with testimonial card editor**

```tsx
'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus, Star } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  photo: string
  quote: string
  rating: number
  active: boolean
}

export function TestimonialsPanel() {
  const { settings, updateSetting } = useEditor()
  const raw = settings.testimonials ? JSON.parse(settings.testimonials) : []
  const [testimonials, setTestimonials] = useState<Testimonial[]>(raw)

  const persist = (next: Testimonial[]) => {
    setTestimonials(next)
    updateSetting('testimonials', JSON.stringify(next))
  }

  const update = (id: string, field: keyof Testimonial, value: string | number | boolean) => {
    persist(testimonials.map(t => t.id === id ? { ...t, [field]: value } : t))
  }

  const add = () => {
    const id = String(Date.now())
    persist([...testimonials, { id, name: '', role: '', photo: '', quote: '', rating: 5, active: true }])
  }

  const remove = (id: string) => {
    persist(testimonials.filter(t => t.id !== id))
  }

  const toggle = (id: string) => {
    persist(testimonials.map(t => t.id === id ? { ...t, active: !t.active } : t))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">Customer testimonials displayed on the homepage.</p>
      {testimonials.map((t) => (
        <div key={t.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.name || 'New Testimonial'}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggle(t.id)}
                className={`text-xs px-2 py-0.5 rounded ${t.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
              >
                {t.active ? 'Active' : 'Hidden'}
              </button>
              <button onClick={() => remove(t.id)} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500">Name</label>
              <Input value={t.name} onChange={e => update(t.id, 'name', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Role</label>
              <Input value={t.role} onChange={e => update(t.id, 'role', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Photo URL</label>
            <Input value={t.photo} onChange={e => update(t.id, 'photo', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Quote</label>
            <Textarea rows={3} value={t.quote} onChange={e => update(t.id, 'quote', e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => update(t.id, 'rating', n)}>
                  <Star className={`w-5 h-5 ${n <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
      <Button onClick={add} variant="outline" size="sm" className="w-full">
        <Plus className="w-4 h-4 mr-1" /> Add Testimonial
      </Button>
    </div>
  )
}
```

---

### Task 7: Create RewardsSectionPanel

**Files:**
- Create: `src/components/admin/editor/sections/RewardsSectionPanel.tsx`

- [ ] **Create the component with tier and catalog editors**

```tsx
'use client'

import { useState } from 'react'
import { useEditor } from '../SectionPanel'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Trash2, Plus } from 'lucide-react'

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
  const { settings, updateSetting } = useEditor()

  const title = settings.rewardsTitle ?? ''
  const pointsPerEGP = settings.rewardsPointsPerEGP ?? '1'

  const tiersRaw = settings.rewardsTiers ? JSON.parse(settings.rewardsTiers) : []
  const [tiers, setTiers] = useState<Tier[]>(tiersRaw)

  const catalogRaw = settings.rewardsCatalog ? JSON.parse(settings.rewardsCatalog) : []
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
        <label className="text-xs text-gray-500 font-medium">Section Title</label>
        <Input value={title} onChange={e => updateSetting('rewardsTitle', e.target.value)} />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-medium">Points per EGP</label>
        <Input type="number" min="0.1" step="0.1" value={pointsPerEGP} onChange={e => updateSetting('rewardsPointsPerEGP', e.target.value)} />
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">Loyalty Tiers</label>
        {tiers.map((tier, idx) => (
          <div key={idx} className="border rounded p-2 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Tier {idx + 1}</span>
              <button onClick={() => persistTiers(tiers.filter((_, i) => i !== idx))} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Name" value={tier.name} onChange={e => {
                const next = [...tiers]; next[idx] = { ...next[idx], name: e.target.value }; persistTiers(next)
              }} />
              <Input type="number" placeholder="Min Points" value={tier.points} onChange={e => {
                const next = [...tiers]; next[idx] = { ...next[idx], points: Number(e.target.value) }; persistTiers(next)
              }} />
            </div>
            <Textarea placeholder="Benefits (one per line)" rows={3} value={tier.benefits} onChange={e => {
              const next = [...tiers]; next[idx] = { ...next[idx], benefits: e.target.value }; persistTiers(next)
            }} />
          </div>
        ))}
        <Button onClick={addTier} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> Add Tier
        </Button>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-medium">Reward Catalog</label>
        {catalog.map((item, idx) => (
          <div key={idx} className="border rounded p-2 mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Item {idx + 1}</span>
              <button onClick={() => persistCatalog(catalog.filter((_, i) => i !== idx))} className="text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Item name" value={item.item} onChange={e => {
                const next = [...catalog]; next[idx] = { ...next[idx], item: e.target.value }; persistCatalog(next)
              }} />
              <Input type="number" placeholder="Points required" value={item.points} onChange={e => {
                const next = [...catalog]; next[idx] = { ...next[idx], points: Number(e.target.value) }; persistCatalog(next)
              }} />
            </div>
            <Input placeholder="Image URL (optional)" value={item.imageUrl} onChange={e => {
              const next = [...catalog]; next[idx] = { ...next[idx], imageUrl: e.target.value }; persistCatalog(next)
            }} />
          </div>
        ))}
        <Button onClick={addCatalogItem} variant="outline" size="sm" className="w-full mt-2">
          <Plus className="w-4 h-4 mr-1" /> Add Reward Item
        </Button>
      </div>
    </div>
  )
}
```

---

### Task 8: Add visibility toggles for new sections

**Files:**
- Modify: `src/components/admin/editor/sections/LayoutPanel.tsx`

- [ ] **Add visibility checkboxes for the 5 new sections**

In the LayoutPanel component, add checkboxes after the existing ones:
```tsx
          <label key="section_trustBadges" className="flex items-center gap-2">
            <input type="checkbox" checked={g('section_trustBadges') !== 'false'} onChange={e => updateSetting('section_trustBadges', e.target.checked ? 'true' : 'false')} />
            <span>Trust Badges</span>
          </label>
          <label key="section_aboutSection" className="flex items-center gap-2">
            <input type="checkbox" checked={g('section_aboutSection') !== 'false'} onChange={e => updateSetting('section_aboutSection', e.target.checked ? 'true' : 'false')} />
            <span>About Section</span>
          </label>
          <label key="section_craftsmanshipTimeline" className="flex items-center gap-2">
            <input type="checkbox" checked={g('section_craftsmanshipTimeline') !== 'false'} onChange={e => updateSetting('section_craftsmanshipTimeline', e.target.checked ? 'true' : 'false')} />
            <span>Craftsmanship Timeline</span>
          </label>
          <label key="section_testimonials" className="flex items-center gap-2">
            <input type="checkbox" checked={g('section_testimonials') !== 'false'} onChange={e => updateSetting('section_testimonials', e.target.checked ? 'true' : 'false')} />
            <span>Testimonials</span>
          </label>
          <label key="section_rewardsSection" className="flex items-center gap-2">
            <input type="checkbox" checked={g('section_rewardsSection') !== 'false'} onChange={e => updateSetting('section_rewardsSection', e.target.checked ? 'true' : 'false')} />
            <span>Rewards Section</span>
          </label>
```

---

### Task 9: Create public rendering components for new sections

**Files:**
- Create: `src/components/store/TrustBadgesSection.tsx`
- Create: `src/components/store/AboutSection.tsx`
- Create: `src/components/store/CraftsmanshipTimeline.tsx`
- Create: `src/components/store/TestimonialsSection.tsx`
- Create: `src/components/store/RewardsSection.tsx`

- [ ] **Create TrustBadgesSection component**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface TrustBadge {
  id: string
  icon: string
  label: string
  active: boolean
}

const s = (key: string, fallback: string) => {
  if (typeof window !== 'undefined') {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        return data[key] ?? fallback
      } catch {}
    }
  }
  return fallback
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/site-settings')
  if (!res.ok) return {}
  return res.json()
}

export function TrustBadgesSection() {
  const [badges, setBadges] = useState<TrustBadge[]>([])

  useEffect(() => {
    const raw = s('trustBadges', '[]')
    let parsed: TrustBadge[]
    try { parsed = JSON.parse(raw) } catch { parsed = [] }
    setBadges(parsed.filter(b => b.active))
  }, [])

  useEffect(() => {
    fetchSettings().then(data => {
      const raw = data.trustBadges ?? '[]'
      try {
        const parsed: TrustBadge[] = JSON.parse(raw)
        setBadges(parsed.filter(b => b.active))
      } catch {}
    })
  }, [])

  if (badges.length === 0) return null

  return (
    <section className="bg-gray-50 py-8" data-editable="trustBadges">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {badges.map(badge => (
            <div key={badge.id} className="flex items-center justify-center gap-2 text-gray-700">
              <span className="text-2xl">{badge.icon}</span>
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Create AboutSection component**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface StatItem {
  value: string
  label: string
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/site-settings')
  if (!res.ok) return {}
  return res.json()
}

export function AboutSection() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [mission, setMission] = useState('')
  const [vision, setVision] = useState('')
  const [stats, setStats] = useState<StatItem[]>([])

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        setTitle(data.aboutTitle ?? '')
        setContent(data.aboutContent ?? '')
        setImageUrl(data.aboutImageUrl ?? '')
        setMission(data.aboutMission ?? '')
        setVision(data.aboutVision ?? '')
        try { setStats(JSON.parse(data.aboutStats || '[]')) } catch { setStats([]) }
      } catch {}
    }
    fetchSettings().then(data => {
      setTitle(data.aboutTitle ?? '')
      setContent(data.aboutContent ?? '')
      setImageUrl(data.aboutImageUrl ?? '')
      setMission(data.aboutMission ?? '')
      setVision(data.aboutVision ?? '')
      try { setStats(JSON.parse(data.aboutStats || '[]')) } catch { setStats([]) }
    })
  }, [])

  if (!title && !content) return null

  return (
    <section className="py-16 bg-white" data-editable="aboutSection">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8" data-setting="aboutTitle">{title}</h2>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {imageUrl && (
            <img src={imageUrl} alt="About" className="rounded-lg w-full h-64 object-cover" />
          )}
          <div>
            <p className="text-gray-600 leading-relaxed" data-setting="aboutContent">{content}</p>
          </div>
        </div>
        {mission && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
            <p className="text-gray-600" data-setting="aboutMission">{mission}</p>
          </div>
        )}
        {vision && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
            <p className="text-gray-600" data-setting="aboutVision">{vision}</p>
          </div>
        )}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Create CraftsmanshipTimeline component**

```tsx
'use client'

import { useEffect, useState } from 'react'

interface TimelineEntry {
  year: string
  title: string
  description: string
  imageUrl: string
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/site-settings')
  if (!res.ok) return {}
  return res.json()
}

export function CraftsmanshipTimeline() {
  const [entries, setEntries] = useState<TimelineEntry[]>([])

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        try { setEntries(JSON.parse(data.craftsmanshipTimeline || '[]')) } catch { setEntries([]) }
      } catch {}
    }
    fetchSettings().then(data => {
      try { setEntries(JSON.parse(data.craftsmanshipTimeline || '[]')) } catch { setEntries([]) }
    })
  }, [])

  if (entries.length === 0) return null

  return (
    <section className="py-16 bg-gray-50" data-editable="craftsmanshipTimeline">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-300" />
          {entries.map((entry, idx) => (
            <div key={idx} className={`relative flex items-center mb-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              <div className="flex-1 px-4">
                <div className={`bg-white rounded-lg shadow p-4 ${idx % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                  <span className="text-primary font-bold text-lg">{entry.year}</span>
                  <h3 className="text-lg font-semibold mt-1">{entry.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{entry.description}</p>
                  {entry.imageUrl && (
                    <img src={entry.imageUrl} alt={entry.title} className="mt-2 rounded w-full h-32 object-cover" />
                  )}
                </div>
              </div>
              <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-primary border-4 border-white" />
              <div className="flex-1 px-4" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Create TestimonialsSection component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  id: string
  name: string
  role: string
  photo: string
  quote: string
  rating: number
  active: boolean
}

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/site-settings')
  if (!res.ok) return {}
  return res.json()
}

export function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        try {
          const all: Testimonial[] = JSON.parse(data.testimonials || '[]')
          setTestimonials(all.filter(t => t.active))
        } catch { setTestimonials([]) }
      } catch {}
    }
    fetchSettings().then(data => {
      try {
        const all: Testimonial[] = JSON.parse(data.testimonials || '[]')
        setTestimonials(all.filter(t => t.active))
      } catch { setTestimonials([]) }
    })
  }, [])

  if (testimonials.length === 0) return null

  const t = testimonials[current]

  return (
    <section className="py-16 bg-white" data-editable="testimonials">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8">What Our Customers Say</h2>
        <div className="bg-gray-50 rounded-xl p-8 shadow-sm">
          {t.photo && (
            <img src={t.photo} alt={t.name} className="w-16 h-16 rounded-full mx-auto object-cover mb-4" />
          )}
          <div className="flex justify-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <Star key={n} className={`w-5 h-5 ${n <= t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
            ))}
          </div>
          <p className="text-gray-700 italic text-lg mb-4">&ldquo;{t.quote}&rdquo;</p>
          <p className="font-semibold">{t.name}</p>
          {t.role && <p className="text-sm text-gray-500">{t.role}</p>}
        </div>
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setCurrent(c => (c - 1 + testimonials.length) % testimonials.length)}
              className="p-2 rounded-full border hover:bg-gray-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % testimonials.length)}
              className="p-2 rounded-full border hover:bg-gray-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
```

- [ ] **Create RewardsSection component**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'

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

async function fetchSettings(): Promise<Record<string, string>> {
  const res = await fetch('/api/site-settings')
  if (!res.ok) return {}
  return res.json()
}

export function RewardsSection() {
  const [title, setTitle] = useState('')
  const [pointsPerEGP, setPointsPerEGP] = useState('1')
  const [tiers, setTiers] = useState<Tier[]>([])
  const [catalog, setCatalog] = useState<RewardItem[]>([])

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        setTitle(data.rewardsTitle ?? '')
        setPointsPerEGP(data.rewardsPointsPerEGP ?? '1')
        try { setTiers(JSON.parse(data.rewardsTiers || '[]')) } catch { setTiers([]) }
        try { setCatalog(JSON.parse(data.rewardsCatalog || '[]')) } catch { setCatalog([]) }
      } catch {}
    }
    fetchSettings().then(data => {
      setTitle(data.rewardsTitle ?? '')
      setPointsPerEGP(data.rewardsPointsPerEGP ?? '1')
      try { setTiers(JSON.parse(data.rewardsTiers || '[]')) } catch { setTiers([]) }
      try { setCatalog(JSON.parse(data.rewardsCatalog || '[]')) } catch { setCatalog([]) }
    })
  }, [])

  if (!title && tiers.length === 0) return null

  return (
    <section className="py-16 bg-gray-50" data-editable="rewardsSection">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4" data-setting="rewardsTitle">{title}</h2>
        <p className="text-center text-gray-600 mb-8">Earn {pointsPerEGP} point per EGP spent</p>
        {tiers.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {tiers.map((tier, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
                <Gift className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                <p className="text-2xl font-bold text-primary mb-2">{tier.points.toLocaleString()} pts</p>
                {tier.benefits && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {tier.benefits.split('\n').filter(Boolean).map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
        {catalog.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-center mb-6">Redeem Your Points</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {catalog.map((item, idx) => (
                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                  {item.imageUrl && <img src={item.imageUrl} alt={item.item} className="w-full h-32 object-cover rounded mb-3" />}
                  <h4 className="font-semibold">{item.item}</h4>
                  <p className="text-sm text-primary font-bold mt-1">{item.points.toLocaleString()} points</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
```

---

### Task 10: Integrate new sections into the homepage

**Files:**
- Modify: `src/components/store/HomeClient.tsx` (or wherever the homepage sections are composed)

- [ ] **Add the new section components to the homepage layout**

Find where existing sections (Hero, PromoBanner, etc.) are rendered. Import and add the new sections wrapped in visibility checks:

```tsx
import { TrustBadgesSection } from './TrustBadgesSection'
import { AboutSection } from './AboutSection'
import { CraftsmanshipTimeline } from './CraftsmanshipTimeline'
import { TestimonialsSection } from './TestimonialsSection'
import { RewardsSection } from './RewardsSection'

// Inside the component, where other sections are rendered:
<VisibilityGate setting="section_trustBadges">
  <TrustBadgesSection />
</VisibilityGate>
<VisibilityGate setting="section_aboutSection">
  <AboutSection />
</VisibilityGate>
<VisibilityGate setting="section_craftsmanshipTimeline">
  <CraftsmanshipTimeline />
</VisibilityGate>
<VisibilityGate setting="section_testimonials">
  <TestimonialsSection />
</VisibilityGate>
<VisibilityGate setting="section_rewardsSection">
  <RewardsSection />
</VisibilityGate>
```

If `VisibilityGate` doesn't exist, create it:
```tsx
// src/components/store/VisibilityGate.tsx
'use client'

import { ReactNode, useEffect, useState } from 'react'

interface Props {
  setting: string
  children: ReactNode
}

export function VisibilityGate({ setting, children }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const el = document.getElementById('__PREVIEW_DATA')
    if (el) {
      try {
        const data = JSON.parse(el.textContent || '{}')
        setVisible(data[setting] !== 'false')
      } catch {}
    }
  }, [setting])

  useEffect(() => {
    fetch('/api/site-settings').then(r => r.json()).then(data => {
      setVisible(data[setting] !== 'false')
    }).catch(() => {})
  }, [setting])

  if (!visible) return null
  return <>{children}</>
}
```
