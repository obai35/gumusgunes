'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Plus, Trash2, X } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function BudgetTab() {
  const { ta, fmtCurrency } = useAdminTranslate()
  const [budgets, setBudgets] = useState<any>(null)
  const [actual, setActual] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [showAdd, setShowAdd] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])

  const [newAccountCode, setNewAccountCode] = useState('')
  const [newMonth, setNewMonth] = useState(String(new Date().getMonth() + 1))
  const [newAmount, setNewAmount] = useState('')

  function fetchData() {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/accounting/budgets?year=${year}`).then(r => r.json()),
      fetch(`/api/admin/accounting/budgets/actual?year=${year}`).then(r => r.json()),
      fetch('/api/admin/accounting/accounts').then(r => r.json()),
    ])
      .then(([b, a, accts]) => { setBudgets(b); setActual(a); setAccounts(accts.accounts || []); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load budget data')); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [year])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  async function handleSaveBudget() {
    if (!newAccountCode || !newMonth || !newAmount) { toast.error(ta('All fields required')); return }
    try {
      const res = await fetch('/api/admin/accounting/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountCode: newAccountCode, month: parseInt(newMonth), year: parseInt(year), amount: parseFloat(newAmount) }),
      })
      if (res.ok) { toast.success(ta('Budget saved')); setShowAdd(false); setNewAccountCode(''); setNewAmount(''); fetchData() }
      else toast.error(ta('Failed to save'))
    } catch { toast.error(ta('Failed to save')) }
  }

  async function handleDeleteBudget(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/budgets?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success(ta('Budget deleted')); fetchData() }
      else toast.error(ta('Failed to delete'))
    } catch { toast.error(ta('Failed to delete')) }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>

  const chartData = actual?.byMonth?.map((m: any) => ({
    month: MONTHS[m.month - 1] || `M${m.month}`,
    Budgeted: m.totalBudgeted,
    Actual: m.totalActual,
  })) || []

  function handleExportCSV() {
    if (!actual?.byMonth) return
    const rows: Record<string, any>[] = []
    for (const m of actual.byMonth) {
      rows.push({ Month: MONTHS[m.month - 1], Budgeted: m.totalBudgeted, Actual: m.totalActual, Variance: m.totalActual - m.totalBudgeted })
    }
    rows.push({ Month: 'Total', Budgeted: actual.grandTotalBudgeted, Actual: actual.grandTotalActual, Variance: actual.grandVariance })
    const csv = ['Month,Budgeted,Actual,Variance', ...rows.map(r => `"${r.Month}",${r.Budgeted},${r.Actual},${r.Variance}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `budget-vs-actual-${year}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> {ta('Add Budget')}
        </button>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> {ta('CSV')}
        </button>
        <button onClick={fetchData} className="px-4 py-1.5 bg-gray-100 text-navy rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
          {ta('Refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Budgeted')}</p>
          <p className="text-2xl font-bold text-navy">{fmtCurrency(actual?.grandTotalBudgeted || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Actual')}</p>
          <p className="text-2xl font-bold text-blue-600">{fmtCurrency(actual?.grandTotalActual || 0)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Variance')}</p>
          <p className={`text-2xl font-bold ${(actual?.grandVariance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {(actual?.grandVariance || 0) >= 0 ? '+' : ''}{fmtCurrency(actual?.grandVariance || 0)}
            <span className="text-sm ml-1">({(actual?.grandVariancePct || 0) >= 0 ? '+' : ''}{actual?.grandVariancePct || 0}%)</span>
          </p>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">{ta('Budget vs Actual')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} />
              <Legend />
              <Bar dataKey="Budgeted" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {actual?.byMonth?.map((monthData: any) => (
        <div key={monthData.month} className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-navy">{MONTHS[monthData.month - 1]} {year}</h3>
            <span className={`text-xs font-medium ${monthData.totalActual >= monthData.totalBudgeted ? 'text-green-600' : 'text-red-600'}`}>
              {fmtCurrency(monthData.totalActual)} / {fmtCurrency(monthData.totalBudgeted)}
            </span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">{ta('Account')}</th><th className="p-3 font-medium text-right">{ta('Budgeted')}</th><th className="p-3 font-medium text-right">{ta('Actual')}</th><th className="p-3 font-medium text-right">{ta('Variance')}</th><th className="p-3 font-medium text-right">{ta('%')}</th></tr></thead>
            <tbody>
              {monthData.items.map((item: any) => (
                <tr key={item.accountCode} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{item.accountName}</td>
                  <td className="p-3 text-right text-muted-foreground">{fmtCurrency(item.budgeted)}</td>
                  <td className="p-3 text-right font-medium text-navy">{fmtCurrency(item.actual)}</td>
                  <td className={`p-3 text-right font-semibold ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.variance >= 0 ? '+' : ''}{fmtCurrency(item.variance)}</td>
                  <td className={`p-3 text-right text-xs font-medium ${item.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.variancePct >= 0 ? '+' : ''}{item.variancePct}%</td>
                </tr>
              ))}
              {monthData.items.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{ta('No budgets set for this month')}</td></tr>}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">{ta('Total')}</td>
                <td className="p-3 text-right text-navy">{fmtCurrency(monthData.totalBudgeted)}</td>
                <td className="p-3 text-right text-blue-600">{fmtCurrency(monthData.totalActual)}</td>
                <td className={`p-3 text-right ${monthData.totalActual - monthData.totalBudgeted >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthData.totalActual - monthData.totalBudgeted >= 0 ? '+' : ''}{fmtCurrency(monthData.totalActual - monthData.totalBudgeted)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ))}

      {(!actual?.byMonth || actual.byMonth.length === 0) && (
        <div className="bg-white rounded-xl border border-border p-6 text-center text-muted-foreground text-sm">
          {ta(`No budgets set for ${year}. Click "Add Budget" to get started.`)}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-navy">{ta('Add Budget')}</h2>
              <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{ta('Account')}</label>
                <select value={newAccountCode} onChange={e => setNewAccountCode(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  <option value="">{ta('Select account')}</option>
                  {accounts.map((a: any) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{ta('Month')}</label>
                <select value={newMonth} onChange={e => setNewMonth(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
                  {MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{ta('Budgeted Amount')}</label>
                <input type="number" step="0.01" value={newAmount} onChange={e => setNewAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-navy transition-colors">{ta('Cancel')}</button>
              <button onClick={handleSaveBudget} className="flex-1 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">{ta('Save')}</button>
            </div>
          </div>
        </div>
      )}

      {budgets?.byMonth?.length > 0 && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">{ta('All Budgets')}</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">{ta('Account')}</th><th className="p-3 font-medium">{ta('Month')}</th><th className="p-3 font-medium text-right">{ta('Amount')}</th><th className="p-3 font-medium">{ta('Actions')}</th></tr></thead>
            <tbody>
              {budgets.byMonth.flatMap((m: any) =>
                m.budgets.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{b.accountCode}</td>
                    <td className="p-3 text-muted-foreground">{MONTHS[b.month - 1]}</td>
                    <td className="p-3 text-right font-medium text-navy">{fmtCurrency(b.amount)}</td>
                    <td className="p-3">
                      <button onClick={() => handleDeleteBudget(b.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
