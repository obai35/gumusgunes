'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Percent, Landmark } from 'lucide-react'
import { formatCurrency } from './format'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function TaxTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState(String(new Date().getFullYear()))

  function fetchTax() {
    setLoading(true)
    fetch(`/api/admin/accounting/tax?year=${year}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load tax report')); setLoading(false) })
  }

  useEffect(() => { fetchTax() }, [year])

  const years = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">{ta('No data')}</div>

  function handleExportCSV() {
    const rows = (data.monthlyBreakdown || []).map((m: any) => ({
      Month: m.month,
      'Taxable Sales': m.taxable,
      'Tax Collected': m.taxCollected,
      Orders: m.count,
    }))
    rows.push({ Month: ta('Total'), 'Taxable Sales': data.estimated.totalTaxable, 'Tax Collected': data.estimated.totalTaxCollected, Orders: rows.reduce((s: number, r: any) => s + r.Orders, 0) })
    const csv = [ta('Month'), ta('Taxable Sales'), ta('Tax Collected'), ta('Orders')].join(',') + '\n' + rows.map(r => `"${r.Month}",${r['Taxable Sales']},${r['Tax Collected']},${r.Orders}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tax-report-${year}.csv`; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select value={year} onChange={e => setYear(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> {ta('CSV')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Tax Rate')}</p>
          <p className="text-2xl font-bold text-navy flex items-center gap-1"><Percent className="h-5 w-5" />{((data.taxRate || 0) * 100).toFixed(1)}%</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Taxable Sales')}</p>
          <p className="text-2xl font-bold text-navy">{formatCurrency(data.estimated.totalTaxable)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Tax Exempt')}</p>
          <p className="text-2xl font-bold text-muted-foreground">{formatCurrency(data.estimated.totalExempt)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Tax Owed')}</p>
          <p className="text-2xl font-bold text-amber-600 flex items-center gap-1"><Landmark className="h-5 w-5" />{formatCurrency(data.estimated.taxOwed)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">{ta('Monthly Tax Breakdown')}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend />
            <Bar dataKey="taxable" name={ta('Taxable Sales')} fill="#3b82f6" radius={[3, 3, 0, 0]} />
            <Bar dataKey="taxCollected" name={ta('Tax Collected')} fill="#f59e0b" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Month')}</th>
              <th className="p-3 font-medium text-right">{ta('Orders')}</th>
              <th className="p-3 font-medium text-right">{ta('Taxable Sales')}</th>
              <th className="p-3 font-medium text-right">{ta('Tax Collected')}</th>
            </tr>
          </thead>
          <tbody>
            {data.monthlyBreakdown?.map((m: any) => (
              <tr key={m.month} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{m.month}</td>
                <td className="p-3 text-right text-muted-foreground">{m.count}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(m.taxable)}</td>
                <td className="p-3 text-right font-semibold text-amber-600">{formatCurrency(m.taxCollected)}</td>
              </tr>
            ))}
            {(!data.monthlyBreakdown || data.monthlyBreakdown.length === 0) && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">{ta('No tax data for')} {year}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
