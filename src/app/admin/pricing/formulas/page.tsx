'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, ArrowLeft, Check, X, Calculator } from 'lucide-react'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Formula = {
  id: string
  name: string
  description: string | null
  type: string
  value: number
  currency: string
  isDefault: boolean
  isActive: boolean
  sortOrder: number
}

const formulaTypes = [
  { value: 'margin', label: 'Target Margin %', desc: 'price = cost / (1 - margin%)' },
  { value: 'markup_multiplier', label: 'Markup Multiplier', desc: 'price = cost × multiplier' },
  { value: 'fixed_amount', label: 'Fixed Addition', desc: 'price = cost + fixed amount' },
]

export default function FormulasPage() {
  const [items, setItems] = useState<Formula[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', type: 'margin', value: '', currency: 'EGP', isDefault: false })
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function fetchData() {
    setLoading(true)
    fetch('/api/admin/pricing/formulas')
      .then(r => r.json()).then(setItems).catch(() => toast.error(ta('Failed to load'))).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleSave() {
    if (!form.name || !form.value) { toast.error(ta('Name and value are required')); return }
    const url = editing ? `/api/admin/pricing/formulas/${editing}` : '/api/admin/pricing/formulas'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: Number(form.value) }) })
    if (!res.ok) { toast.error(ta('Failed to save')); return }
    toast.success(editing ? ta('Updated') : ta('Created'))
    setShowForm(false); setEditing(null); setForm({ name: '', description: '', type: 'margin', value: '', currency: 'EGP', isDefault: false })
    fetchData()
  }

  function startEdit(f: Formula) {
    setForm({ name: f.name, description: f.description || '', type: f.type, value: String(f.value), currency: f.currency, isDefault: f.isDefault })
    setEditing(f.id); setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm(ta('Delete this formula?'))) return
    const res = await fetch(`/api/admin/pricing/formulas/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error(ta('Failed')); return }
    toast.success(ta('Deleted')); fetchData()
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">{ta('Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing" className="text-muted-foreground hover:text-primary"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">{ta('Pricing Formulas')}</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', type: 'margin', value: '', currency: 'EGP', isDefault: false }) }} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> {ta('New Formula')}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input placeholder={ta('Name *')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="rounded border px-3 py-2 text-sm">
              {formulaTypes.map(t => <option key={t.value} value={t.value}>{ta(t.label)}</option>)}
            </select>
            <input type="number" step="any" placeholder={form.type === 'margin' ? ta('Target margin % (e.g. 40)') : form.type === 'markup_multiplier' ? ta('Multiplier (e.g. 2.5)') : ta('Fixed amount')} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder={ta('Description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2 text-sm col-span-2" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
              {ta('Default formula')}
            </label>
          </div>
          <p className="text-xs text-muted-foreground">{formulaTypes.find(t => t.value === form.type)?.desc}</p>
          <div className="flex gap-2">
            <button onClick={handleSave} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"><Check className="h-4 w-4" /> {editing ? ta('Update') : ta('Create')}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm"><X className="h-4 w-4" /> {ta('Cancel')}</button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(f => {
          const typeInfo = formulaTypes.find(t => t.value === f.type)
          return (
            <motion.div key={f.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between mb-1">
                <h3 className="font-medium text-sm">{f.name}</h3>
                {f.isDefault && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">{ta('Default')}</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-2">{ta(typeInfo?.label ?? '')}</p>
              <p className="text-xs text-muted-foreground">{typeInfo?.desc}</p>
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-lg font-bold font-mono">
                  {f.type === 'margin' ? `${fmtNum(f.value)}%` : f.type === 'markup_multiplier' ? `×${fmtNum(f.value)}` : `${fmtNum(f.value)} ${f.currency}`}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(f)} className="text-xs text-primary hover:underline"><Edit className="h-3 w-3 inline" /> {ta('Edit')}</button>
                  <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:underline"><Trash2 className="h-3 w-3 inline" /> {ta('Delete')}</button>
                </div>
              </div>
            </motion.div>
          )
        })}
        {items.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{ta('No pricing formulas yet.')}</div>}
      </div>
    </div>
  )
}
