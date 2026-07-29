'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewStorePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [plan, setPlan] = useState('starter')
  const [isDemo, setIsDemo] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const res = await fetch('/api/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, clientName, clientEmail, plan, isDemo }),
    })
    const data = await res.json()
    if (data.ok) {
      router.push(`/stores/${data.store.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Store</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="My Jewelry Store" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Client Name</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Ahmed Ali" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Client Email</label>
          <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="client@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <select value={plan} onChange={e => setPlan(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
            <option value="starter">Starter</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isDemo} onChange={e => setIsDemo(e.target.checked)} className="rounded" />
          Demo mode (sandboxed, watermarked)
        </label>
        <button type="submit" disabled={saving}
          className="w-full bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Creating...' : 'Create Store'}
        </button>
      </form>
    </div>
  )
}