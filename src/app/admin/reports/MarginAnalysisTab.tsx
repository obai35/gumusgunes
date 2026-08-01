'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  Line,
} from 'recharts'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function MarginAnalysisTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [categoryId, setCategoryId] = useState('')
  const [chartView, setChartView] = useState<'trend' | 'category'>('trend')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/margin-analysis?months=${months}${categoryId ? `&categoryId=${categoryId}` : ''}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load margins')); setLoading(false) })
  }, [months, categoryId])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">{ta('No data')}</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[3, 6, 12, 24].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${months === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo
            </button>
          ))}
        </div>
        {data.categories && (
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-lg text-sm">
            <option value="">{ta('All Categories')}</option>
            {data.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setChartView('trend')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartView === 'trend' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('Trend')}
          </button>
          <button onClick={() => setChartView('category')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartView === 'category' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('By Category')}
          </button>
        </div>
        <ExportButton
          filename="margin-analysis"
          columns={
            chartView === 'trend'
              ? [{ header: ta('Month'), key: 'month' }, { header: ta('Revenue'), key: 'revenue' }, { header: ta('Cost'), key: 'cost' }, { header: ta('Gross Profit'), key: 'grossProfit' }, { header: ta('Margin %'), key: 'margin' }]
              : [{ header: ta('Category'), key: 'categoryName' }, { header: ta('Revenue'), key: 'revenue' }, { header: ta('Cost'), key: 'cost' }, { header: ta('Gross Profit'), key: 'grossProfit' }, { header: ta('Margin %'), key: 'margin' }]
          }
          data={chartView === 'trend' ? data.trend : data.categoryBreakdown}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Revenue')}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Cost')}</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Gross Profit')}</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.totalGrossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Overall Margin')}</p>
          <p className={`text-xl font-bold ${data.summary.overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.summary.overallMargin}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartView === 'trend' ? ta('Margin Trend Over Time') : ta('Margin by Category')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartView === 'trend' ? data.trend : data.categoryBreakdown}
            margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey={chartView === 'trend' ? 'month' : 'categoryName'} tick={{ fontSize: 10 }} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name={ta('Revenue')} />
            <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} name={ta('Cost')} />
            <Line yAxisId="right" type="monotone" dataKey="margin" stroke="#b8860b" strokeWidth={2} dot={{ r: 3 }} name={ta('Margin %')} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{chartView === 'trend' ? ta('Month') : ta('Category')}</th>
              <th className="p-3 font-medium text-right">{ta('Revenue')}</th>
              <th className="p-3 font-medium text-right">{ta('Cost')}</th>
              <th className="p-3 font-medium text-right">{ta('Gross Profit')}</th>
              <th className="p-3 font-medium text-right">{ta('Margin %')}</th>
            </tr>
          </thead>
          <tbody>
            {(chartView === 'trend' ? data.trend : data.categoryBreakdown).map((r: any) => (
              <tr key={r.month || r.categoryId} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{r.month || r.categoryName}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(r.revenue)}</td>
                <td className="p-3 text-right text-orange-600">{formatCurrency(r.cost)}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(r.grossProfit)}</td>
                <td className={`p-3 text-right font-medium ${r.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {r.margin}%
                </td>
              </tr>
            ))}
            {(chartView === 'trend' ? data.trend : data.categoryBreakdown).length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{ta('No data')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
