'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export default function NewTierPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [minPoints, setMinPoints] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [freeShipping, setFreeShipping] = useState(false)
  const [pointsMultiplier, setPointsMultiplier] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !minPoints) { toast.error('Name and Min Points are required'); return }
    setSaving(true)
    const benefits: Record<string, any> = {}
    if (discountPercent) benefits.discountPercent = parseFloat(discountPercent)
    if (freeShipping) benefits.freeShipping = true
    if (pointsMultiplier) benefits.pointsMultiplier = parseFloat(pointsMultiplier)
    try {
      const res = await fetch('/api/admin/customers/tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), minPoints: parseInt(minPoints), benefits, isActive: true }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Failed to create'); return }
      toast.success('Tier created')
      router.push('/admin/customers/tiers')
    } catch {
      toast.error('Failed to create')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Create Loyalty Tier" backHref="/admin/customers/tiers" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Tier Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. Gold" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Points *</label>
              <input type="number" value={minPoints} onChange={e => setMinPoints(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. 1000" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. 10" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points Multiplier</label>
              <input type="number" step="0.1" value={pointsMultiplier} onChange={e => setPointsMultiplier(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" placeholder="e.g. 1.5" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={freeShipping} onChange={e => setFreeShipping(e.target.checked)} className="rounded border-border" id="freeShipping" />
              <label htmlFor="freeShipping" className="text-sm font-medium">Free Shipping</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !name.trim() || !minPoints} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? 'Creating...' : 'Create Tier'}
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
