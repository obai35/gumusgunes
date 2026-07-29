'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Palette } from 'lucide-react'
import { FEATURES, DEFAULT_ENABLED_FEATURES, type Feature } from '@/lib/features'

type Store = {
  id: string
  name: string
  slug: string
  plan: string
  isDemo: boolean
  features: string[]
  theme: Record<string, string>
  status: string
}

export default function StoreConfigPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [enabled, setEnabled] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/stores/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setStore(data.store)
        setEnabled(data.store.features || DEFAULT_ENABLED_FEATURES)
      })
  }, [params.id])

  function toggleFeature(key: string) {
    setEnabled(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/stores/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features: enabled }),
    })
    setSaving(false)
  }

  if (!store) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  const groups = Object.entries(
    FEATURES.reduce((acc, feat) => {
      const g = feat.group
      acc[g] = acc[g] || []
      acc[g].push(feat)
      return acc
    }, {} as Record<string, Feature[]>)
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="text-sm text-muted-foreground">{store.slug} · {store.plan} · {store.status}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/stores/${store.id}/theme-designer`}
            className="border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors inline-flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            Theme Designer
          </Link>
          <Link href={`/stores/${store.id}/generate`}
            className="border px-3 py-1.5 rounded-lg text-sm hover:bg-muted transition-colors">
            Generate
          </Link>
        </div>
      </div>

      <h2 className="font-semibold mb-3">Features</h2>
      {groups.map(([group, features]) => (
        <div key={group} className="mb-6">
          <h3 className="text-xs uppercase text-muted-foreground font-semibold mb-2">{group}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {features.map(feat => (
              <label key={feat.key}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${enabled.includes(feat.key) ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/50'}`}>
                <input type="checkbox" checked={enabled.includes(feat.key)} onChange={() => toggleFeature(feat.key)}
                  className="mt-0.5 rounded" />
                <div>
                  <p className="text-sm font-medium">{feat.name}</p>
                  <p className="text-xs text-muted-foreground">{feat.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving}
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        <Save className="h-4 w-4" />
        {saving ? 'Saving...' : 'Save Features'}
      </button>
    </div>
  )
}