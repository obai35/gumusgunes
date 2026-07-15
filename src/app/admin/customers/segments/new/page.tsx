'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export default function NewSegmentPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [minSpend, setMinSpend] = useState('')
  const [minOrders, setMinOrders] = useState('')
  const [registeredBefore, setRegisteredBefore] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const rules: Record<string, any> = {}
    if (minSpend) rules.minSpend = parseFloat(minSpend)
    if (minOrders) rules.minOrders = parseInt(minOrders)
    if (registeredBefore) rules.registeredBefore = registeredBefore
    try {
      const res = await fetch('/api/admin/customers/segments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), rules, isActive: true }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create'); return }
      toast.success('Segment created')
      router.push('/admin/customers/segments')
    } catch {
      toast.error('Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Create Segment" backHref="/admin/customers/segments" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Segment Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. High Spenders" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Total Spend ($)</label>
              <input type="number" value={minSpend} onChange={e => setMinSpend(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Orders</label>
              <input type="number" value={minOrders} onChange={e => setMinOrders(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. 5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registered Before</label>
              <input type="date" value={registeredBefore} onChange={e => setRegisteredBefore(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !name.trim()} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Segment'}
              </button>
              <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
