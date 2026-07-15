'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X, Warehouse as WarehouseIcon, Package, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/admin/PageHeader'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState({ name: '', code: '', address: '' })
  const [submitting, setSubmitting] = useState(false)

  async function fetchWarehouses() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/warehouses')
      const data = await res.json()
      if (data.ok) setWarehouses(data.warehouses || [])
    } catch { toast.error('Failed to load warehouses') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchWarehouses() }, [])

  function resetForm() { setForm({ name: '', code: '', address: '' }); setEditing(null); setShowForm(false) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.code) { toast.error('Name and code required'); return }
    setSubmitting(true)
    try {
      const url = '/api/admin/warehouses'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing ? { ...form, id: editing.id } : form) })
      const data = await res.json()
      if (data.ok) { toast.success(editing ? 'Updated' : 'Created'); resetForm(); fetchWarehouses() }
      else toast.error(data.error || 'Failed')
    } catch { toast.error('Operation failed') }
    finally { setSubmitting(false) }
  }

  async function toggleActive(w: any) {
    try {
      const res = await fetch('/api/admin/warehouses', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: w.id, name: w.name, code: w.code, address: w.address, isActive: !w.isActive }) })
      const data = await res.json()
      if (data.ok) { toast.success('Toggled'); fetchWarehouses() }
    } catch { toast.error('Failed') }
  }

  return (
    <div>
      <PageHeader title="Warehouses" actions={<button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /> Add Warehouse</button>} />
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={resetForm}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-navy">{editing ? 'Edit' : 'Add'} Warehouse</h3>
              <button onClick={resetForm}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="text-xs font-medium text-navy">Name</label><input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Code</label><input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" /></div>
              <div><label className="text-xs font-medium text-navy">Address</label><textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-lg text-sm mt-1" rows={2} /></div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 disabled:opacity-50">{submitting ? 'Saving...' : 'Save'}</button>
                <button type="button" onClick={resetForm} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {loading ? <div className="text-center py-12 text-muted-foreground">Loading...</div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {warehouses.map(w => (
            <div key={w.id} className={`bg-white rounded-xl border p-5 ${!w.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <WarehouseIcon className="h-5 w-5 text-navy" />
                  <div>
                    <h3 className="font-semibold text-navy">{w.name}</h3>
                    <span className="text-xs font-mono text-muted-foreground">{w.code}</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={w.isActive} onChange={() => toggleActive(w)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500" />
                </label>
              </div>
              {w.address && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="h-3 w-3" /> {w.address}</p>}
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Package className="h-3 w-3" /> {w._count?.stockLevels || 0} products</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => window.location.href = `/admin/warehouses/${w.id}`} className="text-xs text-gold hover:text-gold/80 font-medium">View Stock</button>
                <button onClick={() => { setForm({ name: w.name, code: w.code, address: w.address || '' }); setEditing(w); setShowForm(true) }} className="text-xs text-muted-foreground hover:text-navy">Edit</button>
              </div>
            </div>
          ))}
          {warehouses.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No warehouses yet</div>}
        </div>
      )}
    </div>
  )
}
