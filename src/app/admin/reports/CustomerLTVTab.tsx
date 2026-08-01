'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function CustomerLTVTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [chartMode, setChartMode] = useState<'ltv' | 'revenue'>('ltv')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/customer-ltv?months=${months}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load LTV')); setLoading(false) })
  }, [months])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">{ta('No data')}</div>

  const chartData = data.cohortData.map((c: any) => ({
    cohort: c.cohort,
    LTV: c.ltv,
    Revenue: c.totalRevenue,
    Users: c.users,
    'Avg Orders': c.avgOrdersPerUser,
  }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[6, 12, 24].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${months === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m} {ta('Months')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setChartMode('ltv')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'ltv' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('LTV')}
          </button>
          <button onClick={() => setChartMode('revenue')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'revenue' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('Revenue')}
          </button>
        </div>
        <ExportButton
          filename="customer-ltv"
          columns={[
            { header: ta('Cohort'), key: 'cohort' },
            { header: ta('Users'), key: 'users' },
            { header: ta('Total Revenue'), key: 'totalRevenue' },
            { header: ta('Total Orders'), key: 'totalOrders' },
            { header: ta('LTV'), key: 'ltv' },
            { header: ta('Avg Orders/User'), key: 'avgOrdersPerUser' },
          ]}
          data={data.cohortData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Customers')}</p>
          <p className="text-xl font-bold text-navy">{fmtNum(data.overall.totalUsers)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Avg LTV')}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.avgLtv)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Avg AOV (w/ orders)')}</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.userAov)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Revenue')}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartMode === 'ltv' ? ta('Customer LTV by Cohort') : ta('Revenue by Cohort')}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [chartMode === 'ltv' ? formatCurrency(v) : formatCurrency(v), undefined]}
            />
            <Area
              type="monotone"
              dataKey={chartMode === 'ltv' ? 'LTV' : 'Revenue'}
              stroke="#b8860b"
              fill="#b8860b"
              fillOpacity={0.2}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Cohort')}</th>
              <th className="p-3 font-medium text-right">{ta('Users')}</th>
              <th className="p-3 font-medium text-right">{ta('Revenue')}</th>
              <th className="p-3 font-medium text-right">{ta('Orders')}</th>
              <th className="p-3 font-medium text-right">{ta('LTV')}</th>
              <th className="p-3 font-medium text-right">{ta('Avg Orders/User')}</th>
            </tr>
          </thead>
          <tbody>
            {data.cohortData.map((c: any) => (
              <tr key={c.cohort} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{c.cohort}</td>
                <td className="p-3 text-right text-muted-foreground">{fmtNum(c.users)}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(c.totalRevenue)}</td>
                <td className="p-3 text-right text-muted-foreground">{fmtNum(c.totalOrders)}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(c.ltv)}</td>
                <td className="p-3 text-right text-muted-foreground">{fmtNum(c.avgOrdersPerUser)}</td>
              </tr>
            ))}
            {data.cohortData.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{ta('No data')}</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
