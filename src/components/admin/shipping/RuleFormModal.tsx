'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

type Rule = {
  id?: string; name: string; methodId: string; minAmount: string; governorateId: string
  discountType: string; discountValue: string; isActive: boolean
  startDate: string; endDate: string
}

type Props = {
  rule?: Rule | null
  onSave: (data: Rule) => void
  onClose: () => void
}

export default function RuleFormModal({ rule, onSave, onClose }: Props) {
  const [form, setForm] = useState<Rule>(rule || {
    name: '', methodId: '', minAmount: '', governorateId: '', discountType: 'free', discountValue: '', isActive: true, startDate: '', endDate: '',
  })
  const [methods, setMethods] = useState<{ id: string; name: string }[]>([])
  const [governorates, setGovernorates] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetch('/api/admin/shipping/methods').then(r => r.json()).then(d => setMethods(d.methods || [])).catch(() => {})
    fetch('/api/admin/shipping/rates').then(r => r.json()).then(d => setGovernorates(d.governorates || [])).catch(() => {})
  }, [])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-navy">{rule ? 'Edit Rule' : 'New Rule'}</h3><button onClick={onClose}><X className="h-4 w-4" /></button></div>
        <div className="space-y-3">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Rule name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <select value={form.methodId} onChange={e => setForm({...form, methodId: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">All methods</option>{methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <input value={form.minAmount} onChange={e => setForm({...form, minAmount: e.target.value})} type="number" placeholder="Min order amount (optional)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <select value={form.governorateId} onChange={e => setForm({...form, governorateId: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="">All governorates</option>{governorates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
          <select value={form.discountType} onChange={e => setForm({...form, discountType: e.target.value})} className="w-full px-3 py-2 border border-border rounded-lg text-sm"><option value="free">Free Shipping</option><option value="percentage">Percentage off Shipping</option><option value="fixed">Fixed amount off Shipping</option></select>
          {form.discountType !== 'free' && <input value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} type="number" placeholder={form.discountType === 'percentage' ? 'e.g. 50 for 50% off' : 'e.g. 20 for E£20 off'} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground">Start date (optional)</label><input value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
            <div><label className="text-xs text-muted-foreground">End date (optional)</label><input value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} type="date" className="w-full px-3 py-2 border border-border rounded-lg text-sm" /></div>
          </div>
          <button onClick={() => onSave(form)} className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Save Rule</button>
        </div>
      </div>
    </div>
  )
}
