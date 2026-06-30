'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function NewDiscount() {
  const router = useRouter()
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    code: '', type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED', value: 0,
    maxUses: 0, expiresAt: '',
    appliesTo: 'all', targetValue: '', minOrder: '',
  })

  useEffect(() => {
    fetch('/api/categories?flat=true')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const body: Record<string, any> = {
      code: form.code,
      type: form.type,
      value: form.value,
      maxUses: form.maxUses,
      expiresAt: form.expiresAt || undefined,
      appliesTo: form.appliesTo,
      minOrder: form.minOrder || undefined,
    }
    if (form.appliesTo !== 'all' && form.targetValue) {
      body.targetValue = form.targetValue
    }
    const res = await fetch('/api/admin/discounts/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { toast.success('Discount created'); router.push('/admin/discounts'); router.refresh() }
    else { toast.error('Failed to create discount') }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-semibold text-navy mb-6">Create Discount Code</h1>
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 bg-white rounded-xl border border-border p-6">
        <div>
          <label className="text-sm font-medium text-navy">Code</label>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '_') })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1 font-mono" placeholder="e.g. SUMMER20" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENTAGE' | 'FIXED' })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">
            <option value="PERCENTAGE">Percentage (%)</option>
            <option value="FIXED">Fixed Amount ($)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Value</label>
          <input type="number" step="0.01" min="0" required value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" placeholder={form.type === 'PERCENTAGE' ? 'e.g. 20' : 'e.g. 10.00'} />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Usage Limit (0 = unlimited)</label>
          <input type="number" min="0" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Expires At (optional)</label>
          <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium text-navy">Applies To</label>
          <select value={form.appliesTo} onChange={(e) => setForm({ ...form, appliesTo: e.target.value, targetValue: '' })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1">
            <option value="all">All Products</option>
            <option value="category">Specific Category</option>
            <option value="tag">Specific Tag</option>
          </select>
        </div>
        {form.appliesTo === 'category' && (
          <div>
            <label className="text-sm font-medium text-navy">Category</label>
            <select value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" required>
              <option value="">Select a category</option>
              {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        )}
        {form.appliesTo === 'tag' && (
          <div>
            <label className="text-sm font-medium text-navy">Tag Keyword</label>
            <input value={form.targetValue} onChange={(e) => setForm({ ...form, targetValue: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" placeholder="e.g. new-arrival" required />
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-navy">Minimum Order Amount (optional)</label>
          <input type="number" step="0.01" min="0" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" placeholder="e.g. 50.00" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" className="px-6 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Create Discount</button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2.5 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}
