'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/admin/PageHeader'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Save, Clock, Tag, Percent, DollarSign } from 'lucide-react'

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const isNew = params.id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: '', appliesTo: 'all', discountType: 'PERCENTAGE', discountValue: '10',
    minOrder: '', startDate: '', endDate: '', isActive: true, targetValue: '',
  })

  useEffect(() => {
    if (isNew) return
    fetch('/api/admin/sales/' + params.id).then(r => r.json()).then(d => {
      if (d.sale) {
        const s = d.sale
        setForm({
          name: s.name, appliesTo: s.appliesTo, discountType: s.discountType,
          discountValue: String(s.discountValue), minOrder: s.minOrder ? String(s.minOrder) : '',
          startDate: s.startDate ? s.startDate.slice(0, 16) : '',
          endDate: s.endDate ? s.endDate.slice(0, 16) : '',
          isActive: s.isActive, targetValue: s.targetValue || '',
        })
      }
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [params.id, isNew])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const url = isNew ? '/api/admin/sales' : '/api/admin/sales/' + params.id
    const method = isNew ? 'POST' : 'PUT'
    const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (r.ok) { toast.success(isNew ? 'Created' : 'Saved'); router.push('/admin/marketing/sales') }
    else { toast.error('Failed') }; setSaving(false)
  }

  if (loading) return <div className="text-sm text-muted-foreground p-8">Loading...</div>

  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm'
  const labelCls = 'text-xs font-medium text-muted-foreground block mb-1'

  return (
    <div className="max-w-2xl">
      <PageHeader title={isNew ? 'New Flash Sale' : 'Edit Flash Sale'} backHref="/admin/marketing/sales" />
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-border p-6 space-y-5">
        <div><label className={labelCls}><Tag className="h-3.5 w-3.5 inline mr-1" />Name</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Summer Sale" className={inputCls} /></div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>Applies To</label><select value={form.appliesTo} onChange={e => setForm(p => ({ ...p, appliesTo: e.target.value }))} className={inputCls}><option value="all">All Products</option><option value="specific">Specific (targetValue)</option></select></div>
          <div><label className={labelCls}>Discount Type</label><select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))} className={inputCls}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed</option></select></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}>{form.discountType === 'PERCENTAGE' ? <Percent className="h-3.5 w-3.5 inline mr-1" /> : <DollarSign className="h-3.5 w-3.5 inline mr-1" />}Value</label><input type="number" step="0.01" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}>Min Order (optional)</label><input type="number" step="0.01" value={form.minOrder} onChange={e => setForm(p => ({ ...p, minOrder: e.target.value }))} className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className={labelCls}><Clock className="h-3.5 w-3.5 inline mr-1" />Starts At</label><input type="datetime-local" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} required className={inputCls} /></div>
          <div><label className={labelCls}><Clock className="h-3.5 w-3.5 inline mr-1" />Ends At</label><input type="datetime-local" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} required className={inputCls} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-end pb-2.5"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4" /><span className="text-sm text-navy">Active</span></label></div>
        </div>

        {form.appliesTo === 'specific' && (
          <div><label className={labelCls}>Target Value / Product IDs</label><input value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: e.target.value }))} placeholder="category-slug or product-id" className={inputCls} /></div>
        )}

        <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50"><Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}</button>
      </form>
    </div>
  )
}
