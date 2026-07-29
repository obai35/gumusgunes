'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Package, Plus, Trash2, Clock, DollarSign, BarChart, ChevronDown, ChevronUp, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from './format'

type SubTab = 'assets' | 'depreciation' | 'schedule'

export default function FixedAssetsTab() {
  const [subTab, setSubTab] = useState<SubTab>('assets')

  const tabs: { key: SubTab; label: string; icon: any }[] = [
    { key: 'assets', label: 'Asset Register', icon: Package },
    { key: 'depreciation', label: 'Run Depreciation', icon: TrendingDown },
    { key: 'schedule', label: 'Depreciation Schedule', icon: BarChart },
  ]

  return (
    <div>
      <div className="flex gap-1 border-b border-border mb-4">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                subTab === t.key ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </button>
          )
        })}
      </div>
      {subTab === 'assets' && <AssetRegisterView />}
      {subTab === 'depreciation' && <DepreciationRunView />}
      {subTab === 'schedule' && <DepreciationScheduleView />}
    </div>
  )
}

function AssetRegisterView() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', nameAr: '', assetNumber: '', category: 'equipment', purchaseCost: '', salvageValue: '', usefulLifeYears: '', purchaseDate: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter) params.set('status', filter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/fixed-assets?${params}`)
      .then(r => r.json())
      .then(d => { setAssets(d.assets); setTotal(d.total); setTotalPages(d.totalPages) })
      .catch(() => toast.error('Failed to load assets'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter, page])

  const create = async () => {
    if (!form.name || !form.assetNumber || !form.purchaseCost || !form.usefulLifeYears) {
      toast.error('Required fields missing'); return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/admin/accounting/fixed-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, purchaseCost: parseFloat(form.purchaseCost), salvageValue: parseFloat(form.salvageValue) || 0, usefulLifeYears: parseInt(form.usefulLifeYears), purchaseDate: form.purchaseDate || undefined }),
      })
      if (!r.ok) { const d = await r.json(); throw new Error(d.error) }
      toast.success('Asset created')
      setShowForm(false)
      setForm({ name: '', nameAr: '', assetNumber: '', category: 'equipment', purchaseCost: '', salvageValue: '', usefulLifeYears: '', purchaseDate: '', notes: '' })
      load()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    try {
      await fetch(`/api/admin/accounting/fixed-assets/${id}`, { method: 'DELETE' })
      toast.success('Deleted')
      load()
    } catch { toast.error('Failed') }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'active', 'fully-depreciated', 'disposed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs font-medium rounded-lg border ${filter === s ? 'bg-navy text-white border-navy' : 'bg-white border-border hover:bg-gray-50'}`}
            >{s || 'All'}</button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90">
          <Plus className="h-3 w-3" /> Add Asset
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-border p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input placeholder="Asset Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input placeholder="Asset Number *" value={form.assetNumber} onChange={e => setForm({ ...form, assetNumber: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="equipment">Equipment</option>
              <option value="furniture">Furniture</option>
              <option value="vehicles">Vehicles</option>
              <option value="buildings">Buildings</option>
              <option value="computers">Computers</option>
              <option value="leasehold">Leasehold Improvements</option>
            </select>
            <input type="number" placeholder="Purchase Cost *" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input type="number" placeholder="Salvage Value" value={form.salvageValue} onChange={e => setForm({ ...form, salvageValue: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input type="number" placeholder="Useful Life (Years) *" value={form.usefulLifeYears} onChange={e => setForm({ ...form, usefulLifeYears: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
            <input placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs border border-border rounded-lg">Cancel</button>
            <button onClick={create} disabled={saving} className="px-4 py-1.5 text-xs bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50">
              {saving ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null} Create Asset
            </button>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {assets.length === 0 && <p className="text-sm text-muted-foreground py-4">No assets found</p>}
        {assets.map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{a.name} <span className="text-xs text-muted-foreground">#{a.assetNumber}</span></p>
                <p className="text-xs text-muted-foreground capitalize">{a.category} · {a.depreciationMethod} · {a.usefulLifeYears}y life</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(a.currentBookValue)}</p>
                  <p className="text-xs text-muted-foreground">of {formatCurrency(a.purchaseCost)}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  a.status === 'active' ? 'bg-green-100 text-green-700'
                  : a.status === 'fully-depreciated' ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
                }`}>{a.status}</span>
                <button onClick={() => remove(a.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>{total} total assets</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-2 py-1 rounded text-xs border border-border hover:bg-gray-50 disabled:opacity-30"
          >Prev</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 5, totalPages - 9))
            const p = start + i
            if (p > totalPages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`px-2 py-1 rounded text-xs ${page === p ? 'bg-navy text-white' : 'border border-border hover:bg-gray-50'}`}
              >{p}</button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-2 py-1 rounded text-xs border border-border hover:bg-gray-50 disabled:opacity-30"
          >Next</button>
        </div>
      </div>
    </div>
  )
}

function DepreciationRunView() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/accounting/fixed-assets?status=active')
      .then(r => r.json())
      .then(d => setAssets(d.assets))
      .catch(() => toast.error('Failed to load assets'))
      .finally(() => setLoading(false))
  }, [])

  const runDep = async (assetId: string) => {
    setRunning(assetId)
    try {
      const r = await fetch(`/api/admin/accounting/fixed-assets/${assetId}/depreciation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodDate: new Date().toISOString() }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setResults(prev => [...prev, d])
      toast.success(`Depreciation recorded: ${formatCurrency(d.amount)}`)
    } catch (e: any) {
      toast.error(e.message)
    } finally { setRunning(null) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-border p-4">
        <p className="text-sm font-medium mb-3">Active Assets Ready for Depreciation</p>
        {assets.length === 0 && <p className="text-xs text-muted-foreground">No active assets</p>}
        {assets.map(a => (
          <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <div>
              <p className="text-sm font-medium">{a.name}</p>
              <p className="text-xs text-muted-foreground">Book value: {formatCurrency(a.currentBookValue)} · Cost: {formatCurrency(a.purchaseCost)}</p>
            </div>
            <button onClick={() => runDep(a.id)} disabled={running === a.id}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50"
            >
              {running === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingDown className="h-3 w-3" />}
              Record Depreciation
            </button>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-medium text-sm">Depreciation Results (This Session)</div>
          <div className="divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="px-4 py-2 flex items-center justify-between text-sm">
                <span>Period: {new Date(r.entry?.date || Date.now()).toLocaleDateString()}</span>
                <span className="font-semibold text-green-600">{formatCurrency(r.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function DepreciationScheduleView() {
  const [assets, setAssets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [schedule, setSchedule] = useState<any[]>([])
  const [scheduleLoading, setScheduleLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/accounting/fixed-assets')
      .then(r => r.json())
      .then(d => setAssets(d.assets))
      .catch(() => toast.error('Failed'))
      .finally(() => setLoading(false))
  }, [])

  const loadSchedule = async () => {
    if (!selectedAsset) return
    setScheduleLoading(true)
    try {
      const r = await fetch(`/api/admin/accounting/fixed-assets/${selectedAsset}/schedule`)
      const d = await r.json()
      setSchedule(d.schedule)
    } catch { toast.error('Failed to load schedule') }
    finally { setScheduleLoading(false) }
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">Select Asset</p>
          <select value={selectedAsset} onChange={e => setSelectedAsset(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm"
          >
            <option value="">Choose an asset...</option>
            {assets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.assetNumber})</option>)}
          </select>
        </div>
        <button onClick={loadSchedule} disabled={!selectedAsset || scheduleLoading}
          className="px-4 py-2 text-xs font-medium bg-navy text-white rounded-lg hover:bg-navy/90 disabled:opacity-50"
        >
          {scheduleLoading ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null} View Schedule
        </button>
      </div>

      {schedule.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-medium text-sm flex items-center justify-between">
            <span>Depreciation Schedule</span>
            <span className="text-xs text-muted-foreground">
              Total: {formatCurrency(schedule.reduce((s, y) => s + y.amount, 0))}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium text-xs text-muted-foreground">Year</th>
                <th className="px-4 py-2 font-medium text-xs text-muted-foreground">Depreciation</th>
                <th className="px-4 py-2 font-medium text-xs text-muted-foreground">Book Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {schedule.map((y, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2">Year {y.year}</td>
                  <td className="px-4 py-2 font-medium">{formatCurrency(y.amount)}</td>
                  <td className="px-4 py-2">{formatCurrency(y.bookValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
