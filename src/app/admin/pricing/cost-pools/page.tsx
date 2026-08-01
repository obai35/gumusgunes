'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, ArrowLeft, Check, X, CircleDollarSign } from 'lucide-react'
import Link from 'next/link'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type CostPool = {
  id: string
  name: string
  code: string | null
  description: string | null
  category: string
  basis: string
  rate: number
  isActive: boolean
  _count: { expenses: number }
}

const categories = [
  { value: 'mfg_overhead', label: 'Manufacturing Overhead' },
  { value: 'admin_overhead', label: 'Administrative Overhead' },
  { value: 'selling_overhead', label: 'Selling & Distribution' },
]

const bases = [
  { value: 'total_pct', label: '% of Total Cost' },
  { value: 'direct_pct', label: '% of Direct Cost' },
  { value: 'labor_pct', label: '% of Labor Cost' },
  { value: 'material_pct', label: '% of Material Cost' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
]

export default function CostPoolsPage() {
  const [items, setItems] = useState<CostPool[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', category: 'mfg_overhead', basis: 'total_pct', rate: '' })
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function fetchData() {
    setLoading(true)
    fetch('/api/admin/pricing/cost-pools')
      .then(r => r.json()).then(setItems).catch(() => toast.error(ta('Failed to load'))).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleSave() {
    if (!form.name) { toast.error(ta('Name is required')); return }
    const url = editing ? `/api/admin/pricing/cost-pools/${editing}` : '/api/admin/pricing/cost-pools'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, rate: Number(form.rate) }) })
    if (!res.ok) { toast.error(ta('Failed to save')); return }
    toast.success(editing ? ta('Updated') : ta('Created'))
    setShowForm(false); setEditing(null); setForm({ name: '', code: '', description: '', category: 'mfg_overhead', basis: 'total_pct', rate: '' })
    fetchData()
  }

  function startEdit(pool: CostPool) {
    setForm({ name: pool.name, code: pool.code || '', description: pool.description || '', category: pool.category, basis: pool.basis, rate: String(pool.rate) })
    setEditing(pool.id); setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm(ta('Deactivate this cost pool?'))) return
    const res = await fetch(`/api/admin/pricing/cost-pools/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error(ta('Failed')); return }
    toast.success(ta('Deactivated')); fetchData()
  }

  const categoryColors: Record<string, string> = {
    mfg_overhead: 'bg-blue-100 text-blue-700',
    admin_overhead: 'bg-purple-100 text-purple-700',
    selling_overhead: 'bg-amber-100 text-amber-700',
  }

  const basisLabels: Record<string, string> = {
    total_pct: '% Total', direct_pct: '% Direct', labor_pct: '% Labor', material_pct: '% Material', fixed_amount: 'Fixed',
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">{ta('Loading...')}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/pricing" className="text-muted-foreground hover:text-primary"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="text-2xl font-bold">{ta('Cost Pools')}</h1>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', code: '', description: '', category: 'mfg_overhead', basis: 'total_pct', rate: '' }) }} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> {editing ? ta('Edit Pool') : ta('New Pool')}
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input placeholder={ta('Name *')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder={ta('Code (e.g. OH-001)')} value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="rounded border px-3 py-2 text-sm">
              {categories.map(c => <option key={c.value} value={c.value}>{ta(c.label)}</option>)}
            </select>
            <select value={form.basis} onChange={e => setForm({ ...form, basis: e.target.value })} className="rounded border px-3 py-2 text-sm">
              {bases.map(b => <option key={b.value} value={b.value}>{ta(b.label)}</option>)}
            </select>
            <input type="number" placeholder={ta('Rate (EGP or %)')} value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input placeholder={ta('Description')} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded border px-3 py-2 text-sm sm:col-span-3" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground"><Check className="h-4 w-4" /> {editing ? ta('Update') : ta('Create')}</button>
            <button onClick={() => { setShowForm(false); setEditing(null) }} className="inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm"><X className="h-4 w-4" /> {ta('Cancel')}</button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(pool => (
          <motion.div key={pool.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-sm">{pool.name}</h3>
                {pool.code && <p className="text-xs text-muted-foreground">{pool.code}</p>}
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${categoryColors[pool.category] || 'bg-gray-100'}`}>
                {ta(categories.find(c => c.value === pool.category)?.label ?? '') || pool.category}
              </span>
            </div>
            {pool.description && <p className="text-xs text-muted-foreground mb-3">{pool.description}</p>}
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{ta(basisLabels[pool.basis])}</span>
              <span className="font-mono font-bold">{fmtCurrency(pool.rate)}</span>
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>{ta(`${fmtNum(pool._count.expenses)} linked expenses`)}</span>
              <span className={pool.isActive ? 'text-green-600' : 'text-red-600'}>{pool.isActive ? ta('Active') : ta('Inactive')}</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <button onClick={() => startEdit(pool)} className="text-xs text-primary hover:underline flex items-center gap-1"><Edit className="h-3 w-3" /> {ta('Edit')}</button>
              <button onClick={() => handleDelete(pool.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3" /> {ta('Deactivate')}</button>
            </div>
          </motion.div>
        ))}
        {items.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{ta('No cost pools yet. Create one to start allocating overhead.')}</div>}
      </div>
    </div>
  )
}
