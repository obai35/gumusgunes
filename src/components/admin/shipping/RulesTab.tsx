'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import RuleFormModal from './RuleFormModal'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function RulesTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => { fetchRules() }, [])

  async function fetchRules() {
    const res = await fetch('/api/admin/shipping/rules')
    if (res.ok) { const d = await res.json(); setRules(Array.isArray(d.rules) ? d.rules : []) }
    setLoading(false)
  }

  async function handleSave(data: any) {
    const url = editing ? `/api/admin/shipping/rules/${editing.id}` : '/api/admin/shipping/rules'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) { toast.success(editing ? ta('Rule updated') : ta('Rule created')); setShowModal(false); setEditing(null); fetchRules() }
    else { const e = await res.json(); toast.error(e.error || ta('Failed')) }
  }

  async function toggleActive(rule: any) {
    await fetch(`/api/admin/shipping/rules/${rule.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rule, isActive: !rule.isActive }) })
    fetchRules()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/shipping/rules/${id}`, { method: 'DELETE' })
    toast.success(ta('Rule deleted')); fetchRules()
  }

  if (loading) return <div className="text-muted-foreground text-sm">{ta('Loading...')}</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">{rules.length} {ta(rules.length === 1 ? 'rule' : 'rules')}</p>
        <button onClick={() => { setEditing(null); setShowModal(true) }} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium">{ta('Add Rule')}</button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-gray-50/50"><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Name')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Method')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Min Amount')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Governorate')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Discount')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Dates')}</th><th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Active')}</th><th className="text-right px-4 py-3 text-muted-foreground font-medium">{ta('Actions')}</th></tr></thead>
          <tbody>
            {Array.isArray(rules) && rules.map(r => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="px-4 py-3 font-medium text-navy">{r.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.method?.name || ta('All')}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.minAmount ? `E£${r.minAmount}` : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.governorate?.name || ta('All')}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.discountType === 'free' ? ta('Free') : r.discountType === 'percentage' ? `${r.discountValue}% ${ta('off')}` : `E£${r.discountValue} ${ta('off')}`}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{r.startDate || r.endDate ? `${r.startDate ? new Date(r.startDate).toLocaleDateString() : '—'} ${ta('to')} ${r.endDate ? new Date(r.endDate).toLocaleDateString() : '—'}` : ta('Always')}</td>
                <td className="px-4 py-3"><button onClick={() => toggleActive(r)} className={`px-2 py-0.5 rounded text-xs font-medium ${r.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{r.isActive ? ta('Active') : ta('Inactive')}</button></td>
                <td className="px-4 py-3 text-right"><button onClick={() => { setEditing(r); setShowModal(true) }} className="text-xs text-gold hover:underline mr-3">{ta('Edit')}</button><button onClick={() => handleDelete(r.id)} className="text-xs text-red-500 hover:underline">{ta('Delete')}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && <RuleFormModal rule={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null) }} />}
    </div>
  )
}
