'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Method = { id: string; name: string; estimatedDays: string; isActive: boolean; createdAt: string }

export default function MethodsTab() {
  const [methods, setMethods] = useState<Method[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [days, setDays] = useState('')
  const [editing, setEditing] = useState<Method | null>(null)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => { fetchMethods() }, [])

  async function fetchMethods() {
    const res = await fetch('/api/admin/shipping/methods')
    if (res.ok) { const d = await res.json(); setMethods(Array.isArray(d.methods) ? d.methods : []) }
    setLoading(false)
  }

  async function handleSave() {
    if (!name.trim()) return
    if (editing) {
      await fetch(`/api/admin/shipping/methods/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, estimatedDays: days }) })
    } else {
      await fetch('/api/admin/shipping/methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, estimatedDays: days }) })
    }
    toast.success(ta(editing ? 'Method updated' : 'Method created'))
    setShowForm(false); setEditing(null); setName(''); setDays('')
    fetchMethods()
  }

  async function toggleActive(m: Method) {
    await fetch(`/api/admin/shipping/methods/${m.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...m, isActive: !m.isActive }) })
    fetchMethods()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/shipping/methods/${id}`, { method: 'DELETE' })
    toast.success(ta('Method deleted'))
    fetchMethods()
  }

  if (loading) return <div className="text-muted-foreground text-sm">{ta('Loading...')}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{ta(`${fmtNum(methods.length)} shipping methods`)}</p>
        <button onClick={() => { setEditing(null); setName(''); setDays(''); setShowForm(!showForm) }} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">
          {showForm ? ta('Cancel') : ta('Add Method')}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-border p-4 mb-4 space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder={ta('Company name')} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <input value={days} onChange={e => setDays(e.target.value)} placeholder={ta("Estimated delivery (e.g. '1-3 business days')")} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <button onClick={handleSave} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{editing ? ta('Update') : ta('Create')}</button>
        </div>
      )}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Name')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Est. Delivery')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Active')}</th><th className="text-right px-4 py-3 text-muted-foreground font-medium">{ta('Actions')}</th></tr></thead>
          <tbody>
            {Array.isArray(methods) && methods.map(m => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-navy">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.estimatedDays}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(m)} className={`px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{m.isActive ? ta('Active') : ta('Inactive')}</button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => { setEditing(m); setName(m.name); setDays(m.estimatedDays); setShowForm(true) }} className="text-xs text-gold hover:underline mr-3">{ta('Edit')}</button>
                  <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 hover:underline">{ta('Delete')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
