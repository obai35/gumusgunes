'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus, Play, CheckCircle, XCircle, Package, Wrench, DollarSign, TrendingDown,
  AlertCircle, Search, Settings2, GanttChartSquare, ClipboardList, Factory, Timer,
  Users, ArrowRight, Pause, RefreshCw, FileText, BarChart3
} from 'lucide-react'
import { formatCurrency } from '../accounting/format'

type Tab = 'dashboard' | 'orders' | 'routings' | 'work-centers' | 'boms'

export default function ManufacturingPage() {
  const [tab, setTab] = useState<Tab>('dashboard')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manufacturing</h1>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit overflow-x-auto">
        {([
          ['dashboard', 'Dashboard', BarChart3],
          ['orders', 'Production Orders', ClipboardList],
          ['routings', 'Routing', GanttChartSquare],
          ['work-centers', 'Work Centers', Wrench],
          ['boms', 'Bill of Materials', FileText],
        ] as [Tab, string, any][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${tab === key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardView />}
      {tab === 'orders' && <ProductionOrdersView />}
      {tab === 'routings' && <RoutingsView />}
      {tab === 'work-centers' && <WorkCentersView />}
      {tab === 'boms' && <BomsView />}
    </div>
  )
}

function DashboardView() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/accounting/production-orders').then(r => r.json()),
      fetch('/api/admin/accounting/routings').then(r => r.json()),
      fetch('/api/admin/accounting/work-centers').then(r => r.json()),
      fetch('/api/admin/pricing/overview').then(r => r.json()),
    ]).then(([orders, routings, workCenters, pricing]) => {
      const active = orders.filter((o: any) => o.status === 'in_progress' || o.status === 'planned')
      const completed = orders.filter((o: any) => o.status === 'completed')
      const totalCost = orders.reduce((s: number, o: any) => s + (o.actualCost || 0), 0)
      const totalStandard = orders.reduce((s: number, o: any) => s + (o.standardCost || 0), 0)
      setStats({
        totalOrders: orders.length,
        activeOrders: active.length,
        completedOrders: completed.length,
        totalRoutings: routings.length,
        totalWorkCenters: workCenters.length,
        totalCost: Math.round(totalCost * 100) / 100,
        totalStandard: Math.round(totalStandard * 100) / 100,
        avgMargin: pricing?.stats?.avgMargin ?? 0,
        recentOrders: orders.slice(0, 5),
      })
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  if (loading) return <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>

  if (!stats) return <p className="text-muted-foreground text-sm">Failed to load dashboard</p>

  const cards = [
    { label: 'Active Orders', value: stats.activeOrders, icon: Play, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats.completedOrders, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Routings', value: stats.totalRoutings, icon: GanttChartSquare, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Work Centers', value: stats.totalWorkCenters, icon: Wrench, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total MFG Cost', value: formatCurrency(stats.totalCost), icon: DollarSign, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'Avg Margin', value: `${stats.avgMargin.toFixed(1)}%`, icon: TrendingDown, color: 'text-teal-600', bg: 'bg-teal-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
            className="rounded-lg border bg-card p-4">
            <div className={`h-8 w-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {stats.recentOrders?.length > 0 && (
        <div className="rounded-lg border">
          <div className="border-b px-4 py-3 font-semibold text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Recent Orders
          </div>
          <div className="divide-y">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{o.orderNumber}</span>
                  <span className="text-muted-foreground">{o.product?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    o.status === 'completed' ? 'bg-green-100 text-green-700' :
                    o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                    o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{o.status}</span>
                  <span className="font-mono text-xs text-muted-foreground">{formatCurrency(o.actualCost || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductionOrdersView() {
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [routings, setRoutings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [form, setForm] = useState({ productId: '', workCenterId: '', routingId: '', quantity: '1', plannedStart: '', notes: '' })
  const [ops, setOps] = useState<any[]>([])

  function fetchAll() {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/accounting/production-orders').then(r => r.json()),
      fetch('/api/admin/products').then(r => r.json()).catch(() => []),
      fetch('/api/admin/accounting/work-centers').then(r => r.json()).catch(() => []),
      fetch('/api/admin/accounting/routings').then(r => r.json()).catch(() => []),
    ]).then(([o, p, w, r]) => {
      setOrders(Array.isArray(o) ? o : [])
      setProducts(Array.isArray(p) ? p : [])
      setWorkCenters(Array.isArray(w) ? w : [])
      setRoutings(Array.isArray(r) ? r : [])
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  async function createOrder() {
    if (!form.productId) { toast.error('Select product'); return }
    const res = await fetch('/api/admin/accounting/production-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantity: Number(form.quantity), plannedStart: form.plannedStart || null }),
    })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Order created')
    setShowForm(false)
    setForm({ productId: '', workCenterId: '', routingId: '', quantity: '1', plannedStart: '', notes: '' })
    fetchAll()
  }

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/accounting/production-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('Failed'); return }
    if (status === 'started') {
      const routing = orders.find(o => o.id === id)?.routingId
      if (routing) {
        const steps = await fetch(`/api/admin/accounting/routings/${routing}`).then(r => r.json())
        if (steps?.steps) {
          for (const step of steps.steps) {
            await fetch(`/api/admin/accounting/production-orders/${id}/operations`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ routingStepId: step.id }),
            })
          }
        }
      }
    }
    toast.success(`Status: ${status}`)
    fetchAll()
  }

  async function loadOps(orderId: string) {
    if (expanded === orderId) { setExpanded(null); return }
    setExpanded(orderId)
    const res = await fetch(`/api/admin/accounting/production-orders/${orderId}/operations`)
    const data = await res.json()
    setOps(Array.isArray(data) ? data : [])
  }

  async function toggleOp(op: any) {
    const res = await fetch(`/api/admin/accounting/production-orders/${op.productionOrderId}/operations/${op.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isCompleted: !op.isCompleted, status: op.isCompleted ? 'pending' : 'completed' }),
    })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success(op.isCompleted ? 'Reopened' : 'Completed')
    loadOps(op.productionOrderId)
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Production Orders</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> New Order
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 rounded-xl border border-border p-4 mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="">Select Product</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <select value={form.workCenterId} onChange={e => setForm({ ...form, workCenterId: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="">Work Center (optional)</option>
              {workCenters.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={form.routingId} onChange={e => setForm({ ...form, routingId: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="">Routing (optional)</option>
              {routings.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="Quantity" className="rounded border px-3 py-2 text-sm" />
            <input type="datetime-local" value={form.plannedStart} onChange={e => setForm({ ...form, plannedStart: e.target.value })} className="rounded border px-3 py-2 text-sm" />
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes" className="rounded border px-3 py-2 text-sm col-span-2" />
          </div>
          <div className="flex gap-2">
            <button onClick={createOrder} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border bg-gray-50">
              <th className="p-3 font-medium">Order #</th>
              <th className="p-3 font-medium">Product</th>
              <th className="p-3 font-medium">Qty</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium text-right">Std Cost</th>
              <th className="p-3 font-medium text-right">Actual Cost</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No production orders</td></tr>}
            {orders.map((o: any) => (
              <>
                <tr key={o.id} className={`border-b border-border/50 hover:bg-gray-50 ${expanded === o.id ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-3 font-medium text-navy">{o.orderNumber}</td>
                  <td className="p-3">{o.product?.name || '-'}</td>
                  <td className="p-3">{o.quantity}</td>
                  <td className="p-3">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      o.status === 'completed' ? 'bg-green-100 text-green-700' :
                      o.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      o.status === 'planned' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100'
                    }`}>{o.status}</span>
                  </td>
                  <td className="p-3 text-right font-mono">{formatCurrency(o.standardCost || 0)}</td>
                  <td className="p-3 text-right font-mono">{formatCurrency(o.actualCost || o.actualLaborCost || 0)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      {(o.status === 'planned' || o.status === 'pending') && (
                        <button onClick={() => updateStatus(o.id, 'in_progress')} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Start"><Play className="h-3.5 w-3.5" /></button>
                      )}
                      {o.status === 'in_progress' && (
                        <button onClick={() => updateStatus(o.id, 'completed')} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Complete"><CheckCircle className="h-3.5 w-3.5" /></button>
                      )}
                      <button onClick={() => loadOps(o.id)} className="p-1.5 text-muted-foreground hover:bg-gray-100 rounded" title="Operations">
                        <GanttChartSquare className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === o.id && (
                  <tr key={`${o.id}-ops`}>
                    <td colSpan={7} className="p-0">
                      <div className="bg-gray-50 px-6 py-4 space-y-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operation Steps</h4>
                        {ops.length === 0 && <p className="text-xs text-muted-foreground">No operations. Start the order to auto-generate from routing.</p>}
                        {ops.map((op: any) => (
                          <div key={op.id} className="flex items-center gap-3 bg-white rounded-lg border p-3">
                            <button onClick={() => toggleOp(op)} className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${op.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-blue-400'}`}>
                              {op.isCompleted && <CheckCircle className="h-3 w-3" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{op.step?.name || `Step ${op.sortOrder + 1}`}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  op.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  op.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{op.status}</span>
                              </div>
                              <p className="text-xs text-muted-foreground">{op.step?.workCenter?.name}</p>
                            </div>
                            {op.actualLaborCost != null && <span className="text-xs font-mono">{formatCurrency(op.actualLaborCost)}</span>}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RoutingsView() {
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ productId: '', name: '', description: '' })

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/accounting/routings').then(r => r.json()),
      fetch('/api/admin/products').then(r => r.json()).catch(() => []),
    ]).then(([r, p]) => {
      setItems(Array.isArray(r) ? r : [])
      setProducts(Array.isArray(p) ? p : [])
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate() {
    if (!form.name || !form.productId) { toast.error('Name and product required'); return }
    const res = await fetch('/api/admin/accounting/routings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Routing created')
    setShowForm(false); setForm({ productId: '', name: '', description: '' })
    fetchData()
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Routings</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> New Routing
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 rounded-xl border border-border p-4 mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <select value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })} className="rounded border px-3 py-2 text-sm">
              <option value="">Select Product</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Routing Name" className="rounded border px-3 py-2 text-sm" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="rounded border px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Create</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-4">
        {items.map(routing => (
          <div key={routing.id} className="rounded-lg border bg-card">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === routing.id ? null : routing.id)}>
              <div>
                <h4 className="font-medium text-sm">{routing.name}</h4>
                <p className="text-xs text-muted-foreground">{routing.product?.name} · {routing.steps?.length || 0} steps · {routing.totalStandardTime || 0} min total</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${routing.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {routing.isActive ? 'Active' : 'Inactive'}
                </span>
                <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedId === routing.id ? 'rotate-90' : ''}`} />
              </div>
            </div>
            {expandedId === routing.id && <RoutingDetail routing={routing} />}
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-12 text-muted-foreground">No routings defined</p>}
      </div>
    </div>
  )
}

function RoutingDetail({ routing }: { routing: any }) {
  const [steps, setSteps] = useState<any[]>(routing.steps || [])
  const [workCenters, setWorkCenters] = useState<any[]>([])
  const [showStepForm, setShowStepForm] = useState(false)
  const [stepForm, setStepForm] = useState({ workCenterId: '', name: '', standardTime: '', setupTime: '', laborCost: '', machineCost: '', notes: '' })

  useEffect(() => {
    fetch('/api/admin/accounting/work-centers').then(r => r.json()).then(d => setWorkCenters(Array.isArray(d) ? d : [])).catch(() => {})
  }, [])

  function fetchSteps() {
    fetch(`/api/admin/accounting/routings/${routing.id}/steps`).then(r => r.json()).then(d => setSteps(Array.isArray(d) ? d : [])).catch(() => {})
  }

  async function addStep() {
    if (!stepForm.workCenterId || !stepForm.name) { toast.error('Work center and name required'); return }
    const res = await fetch(`/api/admin/accounting/routings/${routing.id}/steps`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(stepForm),
    })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Step added')
    setShowStepForm(false)
    setStepForm({ workCenterId: '', name: '', standardTime: '', setupTime: '', laborCost: '', machineCost: '', notes: '' })
    fetchSteps()
  }

  async function deleteStep(stepId: string) {
    if (!confirm('Remove this step?')) return
    const res = await fetch(`/api/admin/accounting/routings/${routing.id}/steps/${stepId}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed'); return }
    toast.success('Removed')
    fetchSteps()
  }

  return (
    <div className="border-t border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Steps</h5>
        <button onClick={() => setShowStepForm(!showStepForm)} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="h-3 w-3" /> Add Step</button>
      </div>

      {showStepForm && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={stepForm.workCenterId} onChange={e => setStepForm({ ...stepForm, workCenterId: e.target.value })} className="rounded border px-2 py-1.5 text-xs">
              <option value="">Work Center</option>
              {workCenters.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <input value={stepForm.name} onChange={e => setStepForm({ ...stepForm, name: e.target.value })} placeholder="Step name" className="rounded border px-2 py-1.5 text-xs" />
            <input type="number" value={stepForm.standardTime} onChange={e => setStepForm({ ...stepForm, standardTime: e.target.value })} placeholder="Std time (min)" className="rounded border px-2 py-1.5 text-xs" />
            <input type="number" value={stepForm.setupTime} onChange={e => setStepForm({ ...stepForm, setupTime: e.target.value })} placeholder="Setup (min)" className="rounded border px-2 py-1.5 text-xs" />
            <input type="number" value={stepForm.laborCost} onChange={e => setStepForm({ ...stepForm, laborCost: e.target.value })} placeholder="Labor cost" className="rounded border px-2 py-1.5 text-xs" />
            <input type="number" value={stepForm.machineCost} onChange={e => setStepForm({ ...stepForm, machineCost: e.target.value })} placeholder="Machine cost" className="rounded border px-2 py-1.5 text-xs" />
          </div>
          <div className="flex gap-2">
            <button onClick={addStep} className="px-3 py-1.5 bg-navy text-silver rounded text-xs font-medium">Add</button>
            <button onClick={() => setShowStepForm(false)} className="px-3 py-1.5 border rounded text-xs">Cancel</button>
          </div>
        </div>
      )}

      {steps.length === 0 && <p className="text-xs text-muted-foreground">No steps yet. Add the first production step.</p>}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 text-xs">
            <span className="h-6 w-6 rounded-full bg-navy text-silver flex items-center justify-center font-bold text-[10px] shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy">{step.name}</p>
              <p className="text-muted-foreground">{step.workCenter?.name}</p>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span title="Std Time"><Timer className="h-3 w-3 inline" /> {step.standardTime || 0}m</span>
              <span title="Setup"><Settings2 className="h-3 w-3 inline" /> {step.setupTime || 0}m</span>
              <span title="Labor Cost"><DollarSign className="h-3 w-3 inline" /> {formatCurrency(step.laborCost || 0)}</span>
            </div>
            <button onClick={() => deleteStep(step.id)} className="text-red-400 hover:text-red-600"><XCircle className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkCentersView() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')

  function fetchData() {
    setLoading(true)
    fetch('/api/admin/accounting/work-centers')
      .then(r => r.json()).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { toast.error('Failed to load'); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  async function handleCreate() {
    const res = await fetch('/api/admin/accounting/work-centers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, description, hourlyRate: parseFloat(hourlyRate) || 0 }),
    })
    if (res.ok) { toast.success('Created'); setShowForm(false); setName(''); setCode(''); setDescription(''); setHourlyRate(''); fetchData() }
    else toast.error('Failed')
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Work Centers</h3>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 bg-navy text-silver rounded-lg text-xs font-medium hover:bg-navy/90 transition-colors flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-border p-4 mb-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code (e.g. WC-001)" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            <input value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} type="number" placeholder="Hourly Rate" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div className="flex gap-2"><button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90">Save</button><button onClick={() => setShowForm(false)} className="px-4 py-2 border border-border rounded-lg text-sm">Cancel</button></div>
        </div>
      )}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Code</th><th className="p-3 font-medium">Description</th><th className="p-3 font-medium text-right">Hourly Rate</th><th className="p-3 font-medium">Active</th></tr></thead>
          <tbody>
            {items.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No work centers</td></tr>}
            {items.map((wc: any) => (
              <tr key={wc.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{wc.name}</td>
                <td className="p-3 text-muted-foreground">{wc.code || '-'}</td>
                <td className="p-3 text-muted-foreground">{wc.description || '-'}</td>
                <td className="p-3 text-right font-mono">{formatCurrency(wc.hourlyRate)}/hr</td>
                <td className="p-3">{wc.isActive ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-red-600 text-xs font-medium">Inactive</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BomsView() {
  const [items, setItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedBom, setExpandedBom] = useState<string | null>(null)

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch('/api/admin/accounting/boms').then(r => r.json()).catch(() => []),
      fetch('/api/admin/products').then(r => r.json()).catch(() => []),
    ]).then(([b, p]) => {
      setItems(Array.isArray(b) ? b : [])
      setProducts(Array.isArray(p) ? p : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-navy">Bill of Materials</h3>
        <Link href="/admin/accounting" className="text-xs text-primary hover:underline">Full BOM management in Accounting</Link>
      </div>
      <div className="grid gap-3">
        {items.map((bom: any) => (
          <div key={bom.id} className="rounded-lg border bg-card">
            <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedBom(expandedBom === bom.id ? null : bom.id)}>
              <div>
                <p className="font-medium text-sm">{bom.name || bom.product?.name}</p>
                <p className="text-xs text-muted-foreground">{bom.product?.sku} · {bom.items?.length || 0} materials</p>
              </div>
              <ArrowRight className={`h-4 w-4 text-muted-foreground transition-transform ${expandedBom === bom.id ? 'rotate-90' : ''}`} />
            </div>
            {expandedBom === bom.id && (
              <div className="border-t border-border p-4">
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-muted-foreground border-b"><th className="pb-2 font-medium">Material</th><th className="pb-2 font-medium">Qty</th><th className="pb-2 font-medium text-right">Unit Cost</th><th className="pb-2 font-medium text-right">Total</th></tr></thead>
                  <tbody>
                    {bom.items?.map((item: any) => (
                      <tr key={item.id} className="border-b border-border/50">
                        <td className="py-2">{item.product?.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2 text-right font-mono">{formatCurrency(item.unitCost || 0)}</td>
                        <td className="py-2 text-right font-mono">{formatCurrency((item.unitCost || 0) * item.quantity)}</td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td colSpan={3} className="pt-2 text-right">Total:</td>
                      <td className="pt-2 text-right font-mono">{formatCurrency(bom.items?.reduce((s: number, i: any) => s + (i.unitCost || 0) * i.quantity, 0) || 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No BOMs found</p>}
      </div>
    </div>
  )
}
