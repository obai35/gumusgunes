'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, X, CheckCircle, DollarSign } from 'lucide-react'
import { formatCurrency } from './format'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
}

export default function PayrollTab() {
  const [runs, setRuns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ periodStart: '', periodEnd: '' })

  function fetchRuns() {
    setLoading(true)
    fetch('/api/admin/accounting/payroll-runs')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setRuns(d.runs || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load payroll runs'); setLoading(false) })
  }

  useEffect(() => { fetchRuns() }, [])

  async function handleCreate() {
    if (!form.periodStart || !form.periodEnd) { toast.error('Select period dates'); return }
    try {
      const res = await fetch('/api/admin/accounting/payroll-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Payroll run created')
      setShowModal(false)
      fetchRuns()
    } catch { toast.error('Failed to create payroll run') }
  }

  async function handleAction(id: string, action: string) {
    try {
      const res = await fetch(`/api/admin/accounting/payroll-runs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Payroll ${action}d`)
      fetchRuns()
    } catch { toast.error(`Failed to ${action}`) }
  }

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-navy">Payroll Runs</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> New Run
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center text-muted-foreground text-sm">
          No payroll runs yet. Click "New Run" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map(run => (
            <div key={run.id} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-navy">
                    {new Date(run.periodStart).toLocaleDateString()} — {new Date(run.periodEnd).toLocaleDateString()}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {run.items?.length || 0} employees · Created {new Date(run.createdAt).toLocaleDateString()}
                    {run.processedBy && ` · by ${run.processedBy.name}`}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[run.status] || ''}`}>
                  {run.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-muted-foreground">Gross Salaries</p>
                  <p className="text-lg font-bold text-navy">{formatCurrency(run.totalSalaries)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="text-lg font-bold text-red-600">-{formatCurrency(run.totalDeductions)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Net Pay</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(run.totalNet)}</p>
                </div>
              </div>

              {run.items?.length > 0 && (
                <div className="border-t border-border pt-3 mt-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground text-xs">
                        <th className="pb-2 font-medium">Employee</th>
                        <th className="pb-2 font-medium text-right">Salary</th>
                        <th className="pb-2 font-medium text-right">Bonus</th>
                        <th className="pb-2 font-medium text-right">Deductions</th>
                        <th className="pb-2 font-medium text-right">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.items.map((item: any) => (
                        <tr key={item.id} className="border-t border-border/50">
                          <td className="py-1.5 text-navy">{item.employee?.name}</td>
                          <td className="py-1.5 text-right">{formatCurrency(item.salary)}</td>
                          <td className="py-1.5 text-right text-green-600">{item.bonus > 0 ? formatCurrency(item.bonus) : '-'}</td>
                          <td className="py-1.5 text-right text-red-600">{item.deductions > 0 ? formatCurrency(item.deductions) : '-'}</td>
                          <td className="py-1.5 text-right font-medium text-navy">{formatCurrency(item.netPay)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                {run.status === 'draft' && (
                  <button onClick={() => handleAction(run.id, 'approve')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </button>
                )}
                {run.status === 'approved' && (
                  <button onClick={() => handleAction(run.id, 'pay')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Mark Paid
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-navy">New Payroll Run</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-muted-foreground hover:text-navy" /></button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Period Start</label>
              <input type="date" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Period End</label>
              <input type="date" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
