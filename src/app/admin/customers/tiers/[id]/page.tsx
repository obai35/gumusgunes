'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Card, CardContent } from '@/components/ui/card'

export default function EditTierPage() {
  const { id } = useParams()
  const router = useRouter()
  const [name, setName] = useState('')
  const [minPoints, setMinPoints] = useState('')
  const [discountPercent, setDiscountPercent] = useState('')
  const [freeShipping, setFreeShipping] = useState(false)
  const [pointsMultiplier, setPointsMultiplier] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/customers/tiers/${id}`)
      .then(r => r.json())
      .then(data => {
        const t = data.tier
        setName(t.name)
        setMinPoints(String(t.minPoints))
        setIsActive(t.isActive)
        const b = t.benefits || {}
        if (b.discountPercent) setDiscountPercent(String(b.discountPercent))
        if (b.freeShipping) setFreeShipping(true)
        if (b.pointsMultiplier) setPointsMultiplier(String(b.pointsMultiplier))
      })
      .catch(() => toast.error('Failed to load tier'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !minPoints) { toast.error('Name and Min Points are required'); return }
    setSaving(true)
    const benefits: Record<string, any> = {}
    if (discountPercent) benefits.discountPercent = parseFloat(discountPercent)
    if (freeShipping) benefits.freeShipping = true
    if (pointsMultiplier) benefits.pointsMultiplier = parseFloat(pointsMultiplier)
    try {
      const res = await fetch(`/api/admin/customers/tiers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), minPoints: parseInt(minPoints), benefits, isActive }),
      })
      if (!res.ok) { toast.error('Failed to update'); return }
      toast.success('Tier updated')
      router.push('/admin/customers/tiers')
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-muted-foreground">Loading...</div>

  return (
    <div>
      <PageHeader title="Edit Loyalty Tier" backHref="/admin/customers/tiers" />
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Tier Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Minimum Points *</label>
              <input type="number" value={minPoints} onChange={e => setMinPoints(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount (%)</label>
              <input type="number" value={discountPercent} onChange={e => setDiscountPercent(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Points Multiplier</label>
              <input type="number" step="0.1" value={pointsMultiplier} onChange={e => setPointsMultiplier(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={freeShipping} onChange={e => setFreeShipping(e.target.checked)} className="rounded border-border" id="freeShipping" />
              <label htmlFor="freeShipping" className="text-sm font-medium">Free Shipping</label>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Active</label>
              <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded border-border" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving || !name.trim() || !minPoints} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
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
