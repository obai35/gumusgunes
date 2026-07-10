'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

type Governorate = { id: string; name: string }
type Method = { id: string; name: string }
type Rate = { methodId: string; governorateId: string; price: number }

export default function RatesTab() {
  const [governorates, setGovernorates] = useState<Governorate[]>([])
  const [methods, setMethods] = useState<Method[]>([])
  const [rates, setRates] = useState<Record<string, Record<string, string>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const res = await fetch('/api/admin/shipping/rates')
    if (res.ok) {
      const d = await res.json()
      setGovernorates(Array.isArray(d.governorates) ? d.governorates : [])
      setMethods(Array.isArray(d.methods) ? d.methods : [])
      const map: Record<string, Record<string, string>> = {}
      for (const m of d.methods) map[m.id] = {}
      for (const r of d.rates) {
        if (!map[r.methodId]) map[r.methodId] = {}
        map[r.methodId][r.governorateId] = r.price.toString()
      }
      setRates(map)
    }
    setLoading(false)
  }

  function setRate(methodId: string, governorateId: string, value: string) {
    setRates(prev => ({
      ...prev,
      [methodId]: { ...prev[methodId], [governorateId]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    const payload: { methodId: string; governorateId: string; price: number }[] = []
    for (const [methodId, govs] of Object.entries(rates)) {
      for (const [governorateId, price] of Object.entries(govs)) {
        const p = parseFloat(price)
        if (!isNaN(p) && p >= 0) payload.push({ methodId, governorateId, price: p })
      }
    }
    const res = await fetch('/api/admin/shipping/rates', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rates: payload }) })
    if (res.ok) toast.success('Rates saved')
    else toast.error('Failed to save')
    setSaving(false)
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-muted-foreground">Set shipping price per governorate per method. Empty = not available.</p>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save All Rates'}</button>
      </div>
      <div className="overflow-x-auto bg-white rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50/50">
              <th className="text-left px-3 py-2 text-muted-foreground font-medium sticky left-0 bg-gray-50/50">Governorate</th>
              {Array.isArray(methods) && methods.map(m => <th key={m.id} className="text-center px-2 py-2 text-muted-foreground font-medium min-w-[100px]">{m.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(governorates) && governorates.map(g => (
              <tr key={g.id} className="border-b border-border/50">
                <td className="px-3 py-2 font-medium text-navy sticky left-0 bg-white">{g.name}</td>
                {Array.isArray(methods) && methods.map(m => (
                  <td key={m.id} className="px-2 py-2 text-center">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="—"
                      value={rates[m.id]?.[g.id] ?? ''}
                      onChange={e => setRate(m.id, g.id, e.target.value)}
                      className="w-20 px-2 py-1 border border-border rounded text-sm text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
