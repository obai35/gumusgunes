'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminCurrenciesPage() {
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true })

  useEffect(() => {
    fetch('/api/admin/currencies').then(r => r.json()).then(d => {
      if (d.ok) setCurrencies(Array.isArray(d.currencies) ? d.currencies : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const rate = parseFloat(form.exchangeRate)
    if (!form.code || !form.name || !form.symbol || isNaN(rate) || rate <= 0) {
      return toast.error('All fields required, exchange rate must be positive')
    }
    const url = '/api/admin/currencies'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing, exchangeRate: rate } : { ...form, exchangeRate: rate }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(editing ? 'Currency updated' : 'Currency created')
      const data = await res.json()
      if (editing) {
        setCurrencies(currencies.map(c => c.id === editing ? data.currency : c))
      } else {
        setCurrencies([data.currency, ...currencies])
      }
      setShowForm(false); setEditing(null)
      setForm({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true })
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  function editCurrency(c: any) {
    setForm({ code: c.code, name: c.name, symbol: c.symbol, exchangeRate: String(c.exchangeRate), isDefault: c.isDefault, isActive: c.isActive })
    setEditing(c.id)
    setShowForm(true)
  }

  async function setDefault(c: any) {
    const res = await fetch('/api/admin/currencies', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, isDefault: true }),
    })
    if (res.ok) {
      setCurrencies(currencies.map(curr => ({ ...curr, isDefault: curr.id === c.id })))
      toast.success(`Default currency set to ${c.code}`)
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  async function deleteCurrency(id: string) {
    if (!confirm('Delete this currency?')) return
    const res = await fetch('/api/admin/currencies', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setCurrencies(currencies.filter(c => c.id !== id))
      toast.success('Currency deleted')
    } else {
      const err = await res.json()
      toast.error(err.error || 'Failed')
    }
  }

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Currencies</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false, isActive: true }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'Add Currency'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-lg space-y-3">
          <h3 className="font-semibold text-navy">{editing ? 'Edit Currency' : 'New Currency'}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">Code</label><input required value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="EGP" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Symbol</label><input required value={form.symbol} onChange={e => setForm({ ...form, symbol: e.target.value })} placeholder="E£" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Exchange Rate</label><input required type="number" step="0.0001" value={form.exchangeRate} onChange={e => setForm({ ...form, exchangeRate: e.target.value })} placeholder="1" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div><label className="text-xs font-medium text-muted-foreground">Name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Egyptian Pound" className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{editing ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Code</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rate (vs EGP)</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Default</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map(c => (
              <tr key={c.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-mono font-bold text-navy">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.symbol}</td>
                <td className="px-4 py-3 font-mono text-navy">{c.exchangeRate}</td>
                <td className="px-4 py-3">{c.isDefault ? <span className="text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-medium">Default</span> : <button onClick={() => setDefault(c)} className="text-xs text-muted-foreground hover:text-navy">Set default</button>}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editCurrency(c)} className="text-gold hover:text-gold/80 text-xs font-medium">Edit</button>
                  {!c.isDefault && <button onClick={() => deleteCurrency(c.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>}
                </td>
              </tr>
            ))}
            {currencies.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No currencies yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
