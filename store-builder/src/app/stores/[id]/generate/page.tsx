'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'

export default function GeneratePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [store, setStore] = useState<any>(null)
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [output, setOutput] = useState('')

  useEffect(() => {
    fetch(`/api/stores/${params.id}`)
      .then(r => r.json())
      .then(data => setStore(data.store))
  }, [params.id])

  async function handleGenerate() {
    setGenerating(true)
    setOutput('')
    const res = await fetch(`/api/stores/${params.id}/generate`, { method: 'POST' })
    const data = await res.json()
    setOutput(JSON.stringify(data, null, 2))
    setDone(true)
    setGenerating(false)
  }

  if (!store) return <div className="p-6 text-sm text-muted-foreground">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href={`/stores/${params.id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Store
      </Link>

      <h1 className="text-2xl font-bold mb-2">Generate Storefront</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Generate a standalone site for <strong>{store.name}</strong> ({store.features?.length || 0} features)
      </p>

      <div className="bg-card border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-2">Generation Summary</h2>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>Source: Main Gümüş Güneş site</li>
          <li>Features: {(store.features || []).length} enabled</li>
          <li>Theme: custom colors, font: {store.theme?.fontFamily || 'Inter'}</li>
          <li>Mode: {store.isDemo ? 'Demo (sandboxed)' : 'Production'}</li>
        </ul>
      </div>

      {!done ? (
        <button onClick={handleGenerate} disabled={generating}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Download className="h-4 w-4" /> Generate &amp; Export</>}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-800 dark:text-green-200">
            ✅ Storefront generated successfully.
          </div>
          <pre className="bg-muted rounded-xl p-4 text-xs overflow-x-auto">{output}</pre>
          <button onClick={() => { setDone(false) }}
            className="border px-4 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
            Generate Again
          </button>
        </div>
      )}
    </div>
  )
}