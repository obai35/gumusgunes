'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const DISCOUNT_TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage (%)' },
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'SHIPPING', label: 'Shipping Promo' },
]

export default function NewDiscountPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [appliesTo, setAppliesTo] = useState('all')
  const [targetValue, setTargetValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [governorateId, setGovernorateId] = useState('')
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/shipping/governorates').then(r => r.json()).then(d => setGovernorates(d.governorates || [])).catch(() => {})
    fetch('/api/categories?flat=true').then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/discounts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code, type, value, maxUses, expiresAt: expiresAt || null,
        appliesTo: type === 'SHIPPING' ? null : appliesTo,
        targetValue: type === 'SHIPPING' ? null : targetValue,
        minOrder, governorateId: governorateId || null,
      }),
    })
    if (res.ok) { toast.success('Discount created'); router.push('/admin/discounts') }
    else { const err = await res.json(); toast.error(err.error || 'Failed') }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">New Discount</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-sm font-medium text-navy block mb-1">Code</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} placeholder="SUMMER20" required className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>

        <div><label className="text-sm font-medium text-navy block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            {DISCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {type === 'SHIPPING' ? (
          <div>
            <label className="text-sm font-medium text-navy block mb-1">Shipping Discount Value</label>
            <select value={value} onChange={e => setValue(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="0">Free Shipping</option>
              <option value="50">50% off Shipping</option>
              <option value="25">25% off Shipping</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">For free shipping, select "0". For percentage off shipping, select the percentage.</p>
          </div>
        ) : (
          <div><label className="text-sm font-medium text-navy block mb-1">Value</label><input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01" placeholder={type === 'PERCENTAGE' ? '20' : '50'} required className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        )}

        {type === 'SHIPPING' && (
          <div><label className="text-sm font-medium text-navy block mb-1">Restrict to Governorate (optional)</label>
            <select value={governorateId} onChange={e => setGovernorateId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">All governorates</option>
              {governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <p className="text-xs text-muted-foreground mt-1">If set, coupon only works for delivery addresses in this governorate.</p>
          </div>
        )}

        {type !== 'SHIPPING' && (
          <>
            <div><label className="text-sm font-medium text-navy block mb-1">Applies To</label>
              <select value={appliesTo} onChange={e => setAppliesTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                <option value="all">All Products</option>
                <option value="category">Specific Category</option>
                <option value="tag">Specific Tag</option>
              </select>
            </div>
            {appliesTo === 'category' && (
              <div><label className="text-sm font-medium text-navy block mb-1">Category</label>
                <select value={targetValue} onChange={e => setTargetValue(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            )}
            {appliesTo === 'tag' && (
              <div><label className="text-sm font-medium text-navy block mb-1">Tag Keyword</label><input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder="e.g. summer" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            )}
          </>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-navy block mb-1">Min Order (optional)</label><input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" placeholder="0 = no minimum" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          <div><label className="text-sm font-medium text-navy block mb-1">Max Uses (optional)</label><input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" placeholder="0 = unlimited" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        </div>

        <div><label className="text-sm font-medium text-navy block mb-1">Expires At (optional)</label><input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>

        <button type="submit" className="w-full px-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Create Discount</button>
      </form>
    </div>
  )
}
