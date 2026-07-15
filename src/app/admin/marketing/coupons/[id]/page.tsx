'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { PageHeader } from '@/components/admin/PageHeader'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditCouponPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState('PERCENTAGE')
  const [value, setValue] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [appliesTo, setAppliesTo] = useState('all')
  const [targetValue, setTargetValue] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    fetch('/api/admin/discounts/' + params.id).then(r => r.json()).then(data => {
      const d = data.discount; setCode(d.code); setType(d.type); setValue(String(d.value))
      setMaxUses(d.maxUses ? String(d.maxUses) : ''); setExpiresAt(d.expiresAt ? d.expiresAt.split('T')[0] : '')
      setAppliesTo(d.appliesTo || 'all'); setTargetValue(d.targetValue || ''); setMinOrder(d.minOrder ? String(d.minOrder) : ''); setIsActive(d.isActive)
    }).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const res = await fetch('/api/admin/discounts/' + params.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, type, value, maxUses, expiresAt: expiresAt || null, appliesTo, targetValue, minOrder, isActive }) })
    if (res.ok) { toast.success('Updated'); router.push('/admin/marketing/coupons') } else { const err = await res.json(); toast.error(err.error || 'Failed') }
    setSaving(false)
  }

  if (loading) return <div className="p-6"><Skeleton className="h-8 w-48 mb-4" /><Skeleton className="h-16" /></div>
  return (
    <div className="max-w-lg">
      <PageHeader title="Edit Coupon" backHref="/admin/marketing/coupons" />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm font-medium text-navy">Active</label>
          <button type="button" onClick={() => setIsActive(!isActive)} className={'h-5 w-9 rounded-full transition-colors ' + (isActive ? 'bg-green-500' : 'bg-gray-300')}>
            <div className={'h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform ' + (isActive ? 'translate-x-4' : 'translate-x-0.5')} />
          </button>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Code</label><input value={code} onChange={e => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))} required className="w-full px-3 py-2 border border-border rounded-lg text-sm font-mono" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="PERCENTAGE">Percentage (%)</option><option value="FIXED">Fixed Amount</option><option value="SHIPPING">Shipping Promo</option>
          </select>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Value</label><input value={value} onChange={e => setValue(e.target.value)} type="number" step="0.01" required className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <div><label className="text-sm font-medium text-navy block mb-1">Applies To</label>
          <select value={appliesTo} onChange={e => setAppliesTo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
            <option value="all">All Products</option><option value="category">Specific Category</option><option value="tag">Specific Tag</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium text-navy block mb-1">Min Order</label><input value={minOrder} onChange={e => setMinOrder(e.target.value)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          <div><label className="text-sm font-medium text-navy block mb-1">Max Uses</label><input value={maxUses} onChange={e => setMaxUses(e.target.value)} type="number" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        </div>
        <div><label className="text-sm font-medium text-navy block mb-1">Expires At</label><input value={expiresAt} onChange={e => setExpiresAt(e.target.value)} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
        <button type="submit" disabled={saving} className="w-full px-4 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </div>
  )
}
