'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Plus, Trash2, RefreshCw, FileText, DollarSign, ArrowRightLeft, CheckCircle, XCircle, TrendingUp, TrendingDown, Download } from 'lucide-react'
import { formatCurrency } from './format'

type SubTab = 'groups' | 'inter-company' | 'runs' | 'reports'

export default function ConsolidationTab() {
  const [subTab, setSubTab] = useState<SubTab>('groups')

  const subTabs: { key: SubTab; label: string; icon: any }[] = [
    { key: 'groups', label: 'Groups', icon: Building2 },
    { key: 'inter-company', label: 'Inter-Company', icon: ArrowRightLeft },
    { key: 'runs', label: 'Consolidation Runs', icon: RefreshCw },
    { key: 'reports', label: 'Consolidated Reports', icon: FileText },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {subTabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${subTab === key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {subTab === 'groups' && <GroupsView />}
      {subTab === 'inter-company' && <InterCompanyView />}
      {subTab === 'runs' && <ConsolidationRunsView />}
      {subTab === 'reports' && <ConsolidatedReportsView />}
    </div>
  )
}

function GroupsView() {
  const [groups, setGroups] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<any>(null)
  const [addEntityStoreId, setAddEntityStoreId] = useState('')
  const [addEntityPct, setAddEntityPct] = useState('100')

  function fetchGroups() {
    setLoading(true)
    fetch('/api/admin/accounting/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load groups'); setLoading(false) })
  }

  useEffect(() => {
    fetchGroups()
    fetch('/api/admin/accounting/branches?all=1').then(r => r.json()).then(d => setStores(d.branches || [])).catch(() => {})
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))
    const res = await fetch('/api/admin/accounting/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { toast.success('Group created'); setShowCreate(false); fetchGroups() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  async function handleAddEntity() {
    if (!selectedGroup || !addEntityStoreId) return
    const res = await fetch(`/api/admin/accounting/groups/${selectedGroup.id}/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityStoreId: addEntityStoreId, ownershipPct: parseFloat(addEntityPct) }),
    })
    if (res.ok) { toast.success('Entity added'); setAddEntityStoreId(''); setAddEntityPct('100'); fetchGroupDetail(selectedGroup.id) }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  async function handleRemoveEntity(entityId: string) {
    if (!confirm('Remove entity from group?')) return
    const res = await fetch(`/api/admin/accounting/groups/${selectedGroup!.id}/entities?entityId=${entityId}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Entity removed'); fetchGroupDetail(selectedGroup!.id) }
    else toast.error('Failed')
  }

  async function fetchGroupDetail(id: string) {
    const res = await fetch(`/api/admin/accounting/groups/${id}`)
    if (res.ok) { const d = await res.json(); setSelectedGroup(d.group) }
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm('Delete this group and all related data?')) return
    const res = await fetch(`/api/admin/accounting/groups/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Group deleted'); setSelectedGroup(null); fetchGroups() }
    else toast.error('Failed')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">Groups</h3>
          <button onClick={() => setShowCreate(!showCreate)} className="p-1.5 bg-navy text-silver rounded-lg hover:bg-navy/90 transition-colors"><Plus className="h-4 w-4" /></button>
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-navy/5 rounded-xl p-4 space-y-3 border border-navy/10">
            <input name="name" required placeholder="Group name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <input name="slug" required placeholder="group-slug" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <select name="currency" className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
            <button type="submit" className="w-full px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Create Group</button>
          </form>
        )}

        {groups.length === 0 && <p className="text-sm text-muted-foreground">No groups yet</p>}
        {groups.map(g => (
          <div key={g.id} onClick={() => fetchGroupDetail(g.id)}
            className={`p-3 rounded-xl border cursor-pointer transition-colors ${selectedGroup?.id === g.id ? 'border-navy bg-navy/5' : 'border-border hover:border-navy/30'}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm text-navy">{g.name}</p>
              <button onClick={(e) => { e.stopPropagation(); handleDeleteGroup(g.id) }} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{g.entities?.length || 0} entities</p>
          </div>
        ))}
      </div>

      <div className="lg:col-span-2">
        {selectedGroup ? (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-navy">{selectedGroup.name}</h3>
                  <p className="text-xs text-muted-foreground">Currency: {selectedGroup.currency}</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-navy mb-3">Entities ({selectedGroup.entities?.length || 0})</h4>
              <div className="space-y-2 mb-4">
                {selectedGroup.entities?.map((e: any) => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-navy">{e.entityStore?.name || e.entityStoreId}</p>
                      <p className="text-xs text-muted-foreground">{e.ownershipPct}% · {e.consolidationMethod} {e.isPrimary ? '· Primary' : ''}</p>
                    </div>
                    <button onClick={() => handleRemoveEntity(e.id)} className="p-1 text-red-400 hover:text-red-600 rounded"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <select value={addEntityStoreId} onChange={e => setAddEntityStoreId(e.target.value)} className="flex-1 px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">Select store...</option>
                  {stores?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input type="number" value={addEntityPct} onChange={e => setAddEntityPct(e.target.value)} placeholder="%" className="w-20 px-3 py-2 border border-border rounded-lg text-sm" />
                <button onClick={handleAddEntity} disabled={!addEntityStoreId} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">Add</button>
              </div>
            </div>

            {selectedGroup.interCompanyTxns?.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold text-navy mb-3">Recent IC Transactions</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup.interCompanyTxns.slice(0, 20).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-muted-foreground text-xs">{new Date(t.date).toLocaleDateString()}</span>
                      <span className="text-navy font-medium">{t.fromStore?.name || t.fromStoreId} → {t.toStore?.name || t.toStoreId}</span>
                      <span className="font-medium">{formatCurrency(t.amount)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'eliminated' ? 'bg-green-100 text-green-700' : t.status === 'settled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGroup.consolidationRuns?.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold text-navy mb-3">Recent Runs</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup.consolidationRuns.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                      <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs">{r.periodStart?.slice(0, 10)} - {r.periodEnd?.slice(0, 10)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                      <span className="text-xs text-muted-foreground">{r.eliminatedTxns} eliminated</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Select a group to manage</div>
        )}
      </div>
    </div>
  )
}

function InterCompanyView() {
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecord, setShowRecord] = useState(false)

  useEffect(() => {
    fetch('/api/admin/accounting/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); if (d.groups?.length) setSelectedGroupId(d.groups[0].id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedGroupId) return
    setLoading(true)
    fetch(`/api/admin/accounting/inter-company?groupId=${selectedGroupId}`)
      .then(r => r.json())
      .then(d => { setTransactions(d.transactions || []); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [selectedGroupId])

  async function handleRecord(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const data = Object.fromEntries(new FormData(form))
    const res = await fetch('/api/admin/accounting/inter-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, amount: parseFloat(data.amount as string), groupId: selectedGroupId }),
    })
    if (res.ok) { toast.success('Transaction recorded'); setShowRecord(false); fetch(`/api/admin/accounting/inter-company?groupId=${selectedGroupId}`).then(r => r.json()).then(d => setTransactions(d.transactions || [])) }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button onClick={() => setShowRecord(!showRecord)} className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Plus className="h-4 w-4" /> Record
        </button>
      </div>

      {showRecord && (
        <form onSubmit={handleRecord} className="bg-navy/5 rounded-xl p-4 border border-navy/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select name="fromStoreId" required className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">From Store</option>
              {groups.find(g => g.id === selectedGroupId)?.entities?.map((e: any) => (
                <option key={e.id} value={e.entityStoreId}>{e.entityStore?.name || e.entityStoreId}</option>
              ))}
            </select>
            <select name="toStoreId" required className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">To Store</option>
              {groups.find(g => g.id === selectedGroupId)?.entities?.map((e: any) => (
                <option key={e.id} value={e.entityStoreId}>{e.entityStore?.name || e.entityStoreId}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input name="amount" type="number" step="0.01" required placeholder="Amount" className="px-3 py-2 border border-border rounded-lg text-sm" />
            <select name="type" className="px-3 py-2 border border-border rounded-lg text-sm">
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
              <option value="loan">Loan</option>
              <option value="dividend">Dividend</option>
              <option value="service_fee">Service Fee</option>
              <option value="expense_allocation">Expense Allocation</option>
            </select>
          </div>
          <input name="description" required placeholder="Description" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Record</button>
            <button type="button" onClick={() => setShowRecord(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <Skeleton className="h-40 w-full" /> : transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No inter-company transactions</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">From</th>
                <th className="p-3 font-medium">To</th>
                <th className="p-3 font-medium text-right">Amount</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="p-3 text-navy font-medium">{t.fromStore?.name || t.fromStoreId}</td>
                  <td className="p-3 text-navy font-medium">{t.toStore?.name || t.toStoreId}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(t.amount)}</td>
                  <td className="p-3 text-muted-foreground capitalize">{t.type}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'eliminated' ? 'bg-green-100 text-green-700' : t.status === 'settled' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                  </td>
                  <td className="p-3 text-muted-foreground">{t.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ConsolidationRunsView() {
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')

  useEffect(() => {
    fetch('/api/admin/accounting/groups')
      .then(r => r.json())
      .then(d => { setGroups(d.groups || []); if (d.groups?.length) setSelectedGroupId(d.groups[0].id) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedGroupId) return
    setLoading(true)
    fetch(`/api/admin/accounting/consolidation?groupId=${selectedGroupId}`)
      .then(r => r.json())
      .then(d => { setRuns(d.runs || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selectedGroupId])

  async function handleRun() {
    if (!periodStart || !periodEnd) { toast.error('Period start and end required'); return }
    setRunning(true)
    const res = await fetch('/api/admin/accounting/consolidation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: selectedGroupId, periodStart, periodEnd }),
    })
    if (res.ok) { toast.success('Consolidation completed'); fetch(`/api/admin/accounting/consolidation?groupId=${selectedGroupId}`).then(r => r.json()).then(d => setRuns(d.runs || [])) }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
    setRunning(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Group</label>
          <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Period Start</label>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Period End</label>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={handleRun} disabled={running || !periodStart || !periodEnd || !selectedGroupId}
          className="flex items-center gap-1.5 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} /> {running ? 'Running...' : 'Run Consolidation'}
        </button>
      </div>

      {loading ? <Skeleton className="h-40 w-full" /> : runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No consolidation runs yet</p>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Period</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Eliminated</th>
                <th className="p-3 font-medium text-right">Revenue</th>
                <th className="p-3 font-medium text-right">Net Income</th>
                <th className="p-3 font-medium text-right">Assets</th>
                <th className="p-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.periodStart?.slice(0, 10)} - {r.periodEnd?.slice(0, 10)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-right">{r.eliminatedTxns}</td>
                  <td className="p-3 text-right font-medium">{formatCurrency(r.totalRevenue)}</td>
                  <td className="p-3 text-right font-medium">
                    <span className={r.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(r.netIncome)}</span>
                  </td>
                  <td className="p-3 text-right">{formatCurrency(r.totalAssets)}</td>
                  <td className="p-3 text-xs text-red-500 max-w-48 truncate">{r.errorMessage || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ConsolidatedReportsView() {
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [reportType, setReportType] = useState<string>('pl')
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const now = new Date()
  const [periodStart, setPeriodStart] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState(() => now.toISOString().slice(0, 10))

  useEffect(() => {
    fetch('/api/admin/accounting/groups')
      .then(r => r.json())
      .then(d => setGroups(d.groups || []))
      .catch(() => {})
  }, [])

  function fetchReport() {
    if (!selectedGroupId) return
    setLoading(true)
    const params = new URLSearchParams({ groupId: selectedGroupId, type: reportType })
    if (reportType === 'pl') { params.set('periodStart', periodStart); params.set('periodEnd', periodEnd) }
    else { params.set('asOf', periodEnd) }

    fetch(`/api/admin/accounting/consolidation/reports?${params}`)
      .then(r => r.json())
      .then(d => { if (d.error) toast.error(d.error); else setReport(d.report); setLoading(false) })
      .catch(() => { toast.error('Failed to load report'); setLoading(false) })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Group</label>
          <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
            <option value="">Select...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Report</label>
          <select value={reportType} onChange={e => setReportType(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
            <option value="pl">P&L (Consolidated)</option>
            <option value="balance-sheet">Balance Sheet (Consolidated)</option>
          </select>
        </div>
        {reportType === 'pl' && (
          <>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
              <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
          </>
        )}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">{reportType === 'pl' ? 'To' : 'As of'}</label>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={fetchReport} disabled={!selectedGroupId || loading}
          className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </div>

      {report && reportType === 'pl' && (
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-lg font-semibold text-navy">Consolidated P&L</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-navy">{formatCurrency(report.totalRevenue)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">COGS</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(report.totalCogs)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Gross Profit</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(report.grossProfit)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Net Income</p>
              <p className={`text-xl font-bold ${report.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(report.netIncome)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="text-lg font-semibold text-navy">{formatCurrency(report.totalExpenses)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">IC Revenue</p>
              <p className="text-lg font-semibold text-navy">{formatCurrency(report.totalIcRevenue)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">IC Expense</p>
              <p className="text-lg font-semibold text-navy">{formatCurrency(report.totalIcExpense)}</p>
            </div>
          </div>
        </div>
      )}

      {report && reportType === 'balance-sheet' && (
        <div className="bg-white rounded-xl border border-border p-5 space-y-4">
          <h3 className="text-lg font-semibold text-navy">Consolidated Balance Sheet</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Total Assets</p>
              <p className="text-xl font-bold text-navy">{formatCurrency(report.totalAssets)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Total Liabilities</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(report.totalLiabilities)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-muted-foreground">Total Equity</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(report.totalEquity)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">IC Due From</p>
              <p className="text-lg font-semibold text-navy">{formatCurrency(report.interCompanyDueFrom)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">IC Due To</p>
              <p className="text-lg font-semibold text-navy">{formatCurrency(report.interCompanyDueTo)}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-muted-foreground">IC Elimination</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(report.icElimination)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
