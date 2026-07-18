'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, DollarSign, Download, BarChart3 } from 'lucide-react'
import { formatCurrency } from './page'
import { generatePdf } from '@/lib/pdf-export'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'

export default function ProfitLossTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [period, setPeriod] = useState('year')
  const [comparison, setComparison] = useState('')

  function fetchPL() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('period', period)
    params.set('year', year)
    if (comparison) params.set('comparison', comparison)
    fetch(`/api/admin/accounting/pl?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load P&L'); setLoading(false) })
  }

  useEffect(() => { fetchPL() }, [period, year, comparison])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const colors = { income: '#10b981', expenses: '#f59e0b', net: '#6366f1' }

  const comparisonData = data.monthlyComparison?.map((m: any) => ({
    month: m.month.slice(5),
    Income: m.income,
    Expenses: m.expenses,
    Net: m.net,
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {['year', 'quarter', 'month'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setComparison(comparison ? '' : 'monthly')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${comparison ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Monthly View
        </button>
        <button
          onClick={() => {
            const rows: Record<string, any>[] = [
              ...data.incomeItems.map((i: any) => ({ Category: 'Income', Account: i.name, Amount: i.balance })),
              ...data.expenseItems.map((e: any) => ({ Category: 'Expense', Account: e.name, Amount: e.balance })),
              { Category: '', Account: 'Net Profit', Amount: data.netProfit },
            ]
            const csv = ['Category,Account,Amount', ...rows.map(r => `"${r.Category}","${r.Account}",${r.Amount}`)].join('\n')
            const blob = new Blob([csv], { type: 'text/csv' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pnl-${year}.csv`; a.click()
          }}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
        <button
          onClick={() => {
            const rows = [
              ['Type', 'Account', 'Amount'],
              ...data.incomeItems.map((i: any) => ['Income', i.name, String(i.balance)]),
              ...data.expenseItems.map((e: any) => ['Expense', e.name, String(e.balance)]),
              ['', 'Net Profit', String(data.netProfit)],
            ]
            const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pnl-${year}.xls`; a.click()
          }}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Excel
        </button>
        <button
          onClick={async () => {
            const rows: (string | number)[][] = [
              ...data.incomeItems.map((i: any) => ['Income', i.name, formatCurrency(i.balance)]),
              ...data.expenseItems.map((e: any) => ['Expense', e.name, formatCurrency(e.balance)]),
            ]
            await generatePdf({
              title: 'Profit & Loss Statement',
              subtitle: `${data.period === 'year' ? 'Year' : data.period} ending ${new Date(data.dateRange?.end).toLocaleDateString()}`,
              columns: ['Type', 'Account', 'Amount'],
              rows,
              footers: [
                { label: 'Total Income', value: formatCurrency(data.totalIncome) },
                { label: 'Total Expenses', value: formatCurrency(data.totalExpenses) },
                { label: `Net ${data.netProfit >= 0 ? 'Profit' : 'Loss'}`, value: formatCurrency(Math.abs(data.netProfit)) },
              ],
            })
          }}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-50"><TrendingUp className="h-4 w-4 text-green-600" /></div>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-amber-50"><TrendingDown className="h-4 w-4 text-amber-600" /></div>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.totalExpenses)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${data.netProfit >= 0 ? 'bg-indigo-50' : 'bg-red-50'}`}><DollarSign className={`h-4 w-4 ${data.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`} /></div>
            <p className="text-xs text-muted-foreground">Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
          </div>
          <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-indigo-600' : 'text-red-600'}`}>{formatCurrency(Math.abs(data.netProfit))}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">Income</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Amount</th></tr></thead>
            <tbody>
              {data.incomeItems.map((i: any) => (
                <tr key={i.code} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{i.name}</td>
                  <td className="p-3 text-right font-semibold text-green-600">{formatCurrency(i.balance)}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">Total Income</td><td className="p-3 text-right text-green-700">{formatCurrency(data.totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border"><h3 className="font-semibold text-navy">Expenses</h3></div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Amount</th></tr></thead>
            <tbody>
              {data.expenseItems.map((e: any) => (
                <tr key={e.code} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-medium text-navy">{e.name}</td>
                  <td className="p-3 text-right font-semibold text-amber-600">{formatCurrency(e.balance)}</td>
                </tr>
              ))}
              <tr className="bg-amber-50 font-semibold border-t-2 border-border">
                <td className="p-3 text-navy">Total Expenses</td><td className="p-3 text-right text-amber-700">{formatCurrency(data.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {comparisonData.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Monthly Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Income" fill={colors.income} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill={colors.expenses} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Net" fill={colors.net} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{data.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(Math.abs(data.netProfit))}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">{period === 'year' ? `Year ${year}` : `${period} ${year}`}</p>
            <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${data.netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {data.netProfit >= 0 ? '+' : '-'} Income - Expenses
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
          <div><p className="text-xs opacity-60">Total Income</p><p className="font-semibold text-green-300">+{formatCurrency(data.totalIncome)}</p></div>
          <div><p className="text-xs opacity-60">Total Expenses</p><p className="font-semibold text-red-300">-{formatCurrency(data.totalExpenses)}</p></div>
        </div>
      </div>
    </div>
  )
}
