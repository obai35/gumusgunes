'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const PRESETS = [
  { name: 'Gold Elegance', colors: { primary: '#C8A97E', secondary: '#1a1a2e', accent: '#e2b14a' } },
  { name: 'Modern Dark', colors: { primary: '#0f0f0f', secondary: '#ffffff', accent: '#6366f1' } },
  { name: 'Rose Luxury', colors: { primary: '#e8a0b4', secondary: '#2d1b1f', accent: '#c48395' } },
  { name: 'Ocean Breeze', colors: { primary: '#0ea5e9', secondary: '#0f172a', accent: '#38bdf8' } },
  { name: 'Emerald', colors: { primary: '#059669', secondary: '#022c22', accent: '#34d399' } },
]

const FONTS = ['Inter', 'Playfair Display', 'Cormorant Garamond', 'Lora', 'DM Sans']

export default function ThemePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [theme, setTheme] = useState({ primaryColor: '#C8A97E', secondaryColor: '#1a1a2e', accentColor: '#e2b14a', borderRadius: '0.5rem', fontFamily: 'Inter' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/stores/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setStore(data.store)
        if (data.store.theme) setTheme({ ...theme, ...data.store.theme })
      })
  }, [params.id])

  function applyPreset(preset: typeof PRESETS[0]) {
    setTheme(t => ({ ...t, ...preset.colors }))
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/stores/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme }),
    })
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/stores/${params.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Store
      </Link>
      <h1 className="text-2xl font-bold mb-6">Theme</h1>

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-2">Presets</h2>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.name} onClick={() => applyPreset(p)}
              className="border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors">
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map(k => (
          <div key={k}>
            <label className="block text-sm font-medium mb-1 capitalize">{k.replace(/([A-Z])/g, ' $1')}</label>
            <div className="flex items-center gap-2">
              <input type="color" value={theme[k]} onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))}
                className="h-9 w-12 rounded border cursor-pointer" />
              <input value={theme[k]} onChange={e => setTheme(t => ({ ...t, [k]: e.target.value }))}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background font-mono" />
            </div>
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Border Radius</label>
          <input value={theme.borderRadius} onChange={e => setTheme(t => ({ ...t, borderRadius: e.target.value }))}
            className="w-full border rounded-lg px-3 py-1.5 text-sm bg-background" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Font</label>
          <select value={theme.fontFamily} onChange={e => setTheme(t => ({ ...t, fontFamily: e.target.value }))}
            className="w-full border rounded-lg px-3 py-1.5 text-sm bg-background">
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving}
        className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {saving ? 'Saving...' : 'Save Theme'}
      </button>
    </div>
  )
}