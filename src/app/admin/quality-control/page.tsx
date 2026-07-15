'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, CheckCircle2, ClipboardCheck, FileText, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'
import { DataTable } from '@/components/admin/DataTable'
import type { ColumnDef } from '@tanstack/react-table'

type QC_CHECK = {
  id: string
  product: { id: string; name: string; sku: string }
  template: { id: string; name: string } | null
  passed: boolean
  notes: string | null
  checkedBy: string
  createdAt: string
}

export default function QualityControlPage() {
  const [tab, setTab] = useState<'templates' | 'checks'>('templates')
  const [templates, setTemplates] = useState<any[]>([])
  const [checks, setChecks] = useState<QC_CHECK[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', items: '' })
  const [submitting, setSubmitting] = useState(false)
  const [showCheckForm, setShowCheckForm] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [checkForm, setCheckForm] = useState({ productId: '', templateId: '', passed: true, notes: '' })
  const [checkSubmitting, setCheckSubmitting] = useState(false)

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/qc/templates')
      const d = await res.json()
      if (d.ok) setTemplates(d.templates || [])
    } catch { toast.error('Failed to load templates') }
  }

  async function fetchChecks() {
    try {
      const res = await fetch('/api/admin/qc/checks?limit=50')
      const d = await res.json()
      if (d.ok) setChecks(d.checks || [])
    } catch { toast.error('Failed to load checks') }
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTemplates(), fetchChecks()]).finally(() => setLoading(false))
    fetch('/api/admin/products?limit=200').then(r => r.json()).then(d => setProducts(Array.isArray(d.products) ? d.products : [])).catch(() => {})
  }, [])

  function resetForm() { setForm({ name: '', items: '' }); setEditing(null); setShowForm(false) }
  function resetCheckForm() { setCheckForm({ productId: '', templateId: '', passed: true, notes: '' }); setShowCheckForm(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.items) { toast.error('Name and items required'); return }
    const itemsArr = form.items.split('\n').filter(Boolean)
    setSubmitting(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch('/api/admin/qc/templates', {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { ...form, id: editing.id, items: itemsArr } : { ...form, items: itemsArr }),
      })
      const d = await res.json()
      if (d.ok) { toast.success(editing ? 'Updated' : 'Created'); resetForm(); fetchTemplates() }
      else toast.error(d.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setSubmitting(false) }
  }

  async function deleteTemplate(id: string) {
    try {
      const res = await fetch(`/api/admin/qc/templates?id=${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.ok) { toast.success('Deleted'); fetchTemplates() }
    } catch { toast.error('Failed to delete') }
  }

  async function handleCheckSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!checkForm.productId) { toast.error('Select a product'); return }
    setCheckSubmitting(true)
    try {
      const res = await fetch('/api/admin/qc/checks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkForm),
      })
      const d = await res.json()
      if (d.ok) { toast.success('Check recorded'); resetCheckForm(); fetchChecks() }
      else toast.error(d.error || 'Failed')
    } catch { toast.error('Failed') }
    finally { setCheckSubmitting(false) }
  }

  const checksColumns: ColumnDef<QC_CHECK>[] = [
    { accessorKey: 'product.name', header: 'Product', cell: ({ row }) => <span className="font-medium text-navy">{row.original.product.name} <span className="text-muted-foreground text-xs">({row.original.product.sku})</span></span> },
    { accessorKey: 'template.name', header: 'Template', cell: ({ row }) => <span className="text-xs">{row.original.template?.name || '—'}</span> },
    { accessorKey: 'passed', header: 'Result', cell: ({ row }) => row.original.passed ? <span className="text-green-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Pass</span> : <span className="text-red-600 font-medium">Fail</span> },
    { accessorKey: 'checkedBy', header: 'Checked By' },
    { accessorKey: 'notes', header: 'Notes', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.notes || '—'}</span> },
    { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => <span className="text-xs text-muted-foreground">{new Date(row.original.createdAt).toLocaleDateString()}</span> },
  ]

  return (
    <div>
      <PageHeader title="Quality Control" actions={
        <div className="flex gap-2">
          <button onClick={() => { resetCheckForm(); setShowCheckForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"><ClipboardCheck className="h-4 w-4" /> New Check</button>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> New Template</button>
        </div>
      } />
      <div className="flex gap-1 mb-6 border-b border-border">
        {(['templates', 'checks'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'}`}>{t === 'templates' ? 'Templates' : 'Inspection Log'}</button>
        ))}
      </div>

      {tab === 'templates' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map(t => (
            <div key={t.id} className={`bg-white rounded-xl border border-border p-4 ${!t.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-navy flex items-center gap-2"><FileText className="h-4 w-4" /> {t.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setForm({ name: t.name, items: Array.isArray(t.items) ? t.items.join('\n') : '' }); setEditing(t); setShowForm(true) }} className="text-xs text-muted-foreground hover:text-navy">Edit</button>
                  <button onClick={() => deleteTemplate(t.id)} className="text-xs text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                {Array.isArray(t.items) && t.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-1">• {item}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-2">{t.isActive ? 'Active' : 'Inactive'}</p>
            </div>
          ))}
          {templates.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No templates yet</div>}
        </div>
      )}

      {tab === 'checks' && (
        <DataTable columns={checksColumns} data={checks} keyExtractor={c => c.id} loading={loading} emptyTitle="No inspections recorded" />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-navy">{editing ? 'Edit' : 'New'} Template</h3><button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Checklist Items (one per line)</label><textarea required value={form.items} onChange={e => setForm(f => ({ ...f, items: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={6} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCheckForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetCheckForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-navy">Record QC Check</h3><button onClick={resetCheckForm}><X className="h-4 w-4 text-muted-foreground" /></button></div>
            <form onSubmit={handleCheckSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Product</label>
                <select required value={checkForm.productId} onChange={e => setCheckForm(f => ({ ...f, productId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1">
                  <option value="">Select product...</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div><label className="text-xs font-medium text-navy">Template</label>
                <select value={checkForm.templateId} onChange={e => setCheckForm(f => ({ ...f, templateId: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1">
                  <option value="">No template</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setCheckForm(f => ({ ...f, passed: true }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${checkForm.passed ? 'bg-green-100 text-green-700 border-green-300' : 'border-border'}`}>PASS</button>
                <button type="button" onClick={() => setCheckForm(f => ({ ...f, passed: false }))} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${!checkForm.passed ? 'bg-red-100 text-red-700 border-red-300' : 'border-border'}`}>FAIL</button>
              </div>
              <div><label className="text-xs font-medium text-navy">Notes</label><textarea value={checkForm.notes} onChange={e => setCheckForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={2} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={checkSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">{checkSubmitting ? 'Recording...' : 'Record Check'}</button>
                <button type="button" onClick={resetCheckForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
