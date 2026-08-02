'use client'

import { useState, useEffect } from 'react'
import MethodFormModal from './MethodFormModal'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type PaymentMethod = {
  id: string; code: string; name: string; nameAr: string | null
  description: string | null; descriptionAr: string | null
  isActive: boolean; sortOrder: number; config: Record<string, any>
}

export default function SettingsTab() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => { fetchMethods() }, [])

  async function fetchMethods() {
    const res = await fetch('/api/admin/payment-methods')
    if (res.ok) { const d = await res.json(); setMethods(Array.isArray(d.methods) ? d.methods : []) }
    setLoading(false)
  }

  async function handleSave(data: Partial<PaymentMethod> & { config: Record<string, any> }) {
    const res = await fetch(`/api/admin/payment-methods/${editing!.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { setEditing(null); fetchMethods() }
  }

  async function toggleActive(m: PaymentMethod) {
    await fetch(`/api/admin/payment-methods/${m.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !m.isActive }),
    })
    fetchMethods()
  }

  if (loading) return <div className="text-muted-foreground text-sm">{ta('Loading...')}</div>

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">{ta('Configure which payment methods are available and their settings.')}</p>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Order')}</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Method')}</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Code')}</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">{ta('Active')}</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">{ta('Actions')}</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(methods) && methods.map(m => (
              <tr key={m.id} className="border-b border-border/50">
                <td className="px-4 py-3 text-muted-foreground text-xs">{m.sortOrder}</td>
                <td className="px-4 py-3 font-medium text-navy">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{m.code}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(m)} className={`px-2 py-0.5 rounded text-xs font-medium ${m.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.isActive ? ta('Active') : ta('Inactive')}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(m)} className="text-xs text-gold hover:underline">{ta('Configure')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <MethodFormModal method={editing} onSave={handleSave} onClose={() => setEditing(null)} />}
    </div>
  )
}
