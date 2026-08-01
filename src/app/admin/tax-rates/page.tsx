'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminTaxRatesPage() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [rates, setRates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', rate: '', country: 'EG', region: '', isActive: true })

  useEffect(() => {
    fetch('/api/admin/tax-rates').then(r => r.json()).then(d => {
      if (d.ok) setRates(Array.isArray(d.rates) ? d.rates : [])
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const rateNum = parseFloat(form.rate)
    if (!form.name || isNaN(rateNum) || rateNum < 0 || rateNum > 100) return toast.error(ta('Valid name and rate (0-100) required'))
    const url = '/api/admin/tax-rates'
    const method = editing ? 'PUT' : 'POST'
    const body = editing ? { ...form, id: editing, rate: rateNum } : { ...form, rate: rateNum }
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (res.ok) {
      toast.success(ta(editing ? 'Tax rate updated' : 'Tax rate created'))
      const data = await res.json()
      if (editing) {
        setRates(rates.map(r => r.id === editing ? data.taxRate : r))
      } else {
        setRates([data.taxRate, ...rates])
      }
      setShowForm(false); setEditing(null)
      setForm({ name: '', rate: '', country: 'EG', region: '', isActive: true })
    } else {
      const err = await res.json()
      toast.error(ta(err.error || 'Failed'))
    }
  }

  function editRate(r: any) {
    setForm({ name: r.name, rate: String(r.rate), country: r.country, region: r.region || '', isActive: r.isActive })
    setEditing(r.id)
    setShowForm(true)
  }

  async function deleteRate(id: string) {
    if (!confirm(ta('Delete this tax rate?'))) return
    const res = await fetch('/api/admin/tax-rates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { setRates(rates.filter(r => r.id !== id)); toast.success(ta('Tax rate deleted')) }
    else { const err = await res.json(); toast.error(ta(err.error || 'Failed')) }
  }

  if (loading) return <div className="p-6 space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">{ta('Tax Rates')}</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', rate: '', country: 'EG', region: '', isActive: true }) }} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> {ta(showForm ? 'Cancel' : 'Add Tax Rate')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-border p-5 mb-6 max-w-lg space-y-3">
          <h3 className="font-semibold text-navy">{ta(editing ? 'Edit Tax Rate' : 'New Tax Rate')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Name')}</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={ta('VAT')} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Rate (%)')}</label><input required type="number" step="0.01" min="0" max="100" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} placeholder={ta('18')} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Country')}</label><input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder={ta('EG')} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">{ta('Region (optional)')}</label><input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} placeholder={ta('All')} className="w-full px-3 py-2 rounded-lg border border-border text-sm mt-1" /></div>
          </div>
          <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> {ta('Active')}</label></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{ta(editing ? 'Update' : 'Create')}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-gray-50 transition-colors">{ta('Cancel')}</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Name')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Rate')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Country')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Region')}</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">{ta('Status')}</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">{ta('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {rates.map(r => (
              <tr key={r.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3 font-mono text-navy">{r.rate}%</td>
                <td className="px-4 py-3 text-muted-foreground">{r.country || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.region || '—'}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ta(r.isActive ? 'Active' : 'Inactive')}</span></td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => editRate(r)} className="text-gold hover:text-gold/80 text-xs font-medium">{ta('Edit')}</button>
                  <button onClick={() => deleteRate(r.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">{ta('Delete')}</button>
                </td>
              </tr>
            ))}
            {rates.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{ta('No tax rates configured.')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
