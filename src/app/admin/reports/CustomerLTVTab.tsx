'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function CustomerLTVTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [months, setMonths] = useState(12)
  const [chartMode, setChartMode] = useState<'ltv' | 'revenue'>('ltv')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/customer-ltv?months=${months}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load LTV'); setLoading(false) })
  }, [months])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

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
              {m} Months
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setChartMode('ltv')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'ltv' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            LTV
          </button>
          <button onClick={() => setChartMode('revenue')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${chartMode === 'revenue' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            Revenue
          </button>
        </div>
        <ExportButton
          filename="customer-ltv"
          columns={[
            { header: 'Cohort', key: 'cohort' },
            { header: 'Users', key: 'users' },
            { header: 'Total Revenue', key: 'totalRevenue' },
            { header: 'Total Orders', key: 'totalOrders' },
            { header: 'LTV', key: 'ltv' },
            { header: 'Avg Orders/User', key: 'avgOrdersPerUser' },
          ]}
          data={data.cohortData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Customers</p>
          <p className="text-xl font-bold text-navy">{data.overall.totalUsers}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg LTV</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.avgLtv)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg AOV (w/ orders)</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.userAov)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.overall.totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">
          {chartMode === 'ltv' ? 'Customer LTV by Cohort' : 'Revenue by Cohort'}
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
              <th className="p-3 font-medium">Cohort</th>
              <th className="p-3 font-medium text-right">Users</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Orders</th>
              <th className="p-3 font-medium text-right">LTV</th>
              <th className="p-3 font-medium text-right">Avg Orders/User</th>
            </tr>
          </thead>
          <tbody>
            {data.cohortData.map((c: any) => (
              <tr key={c.cohort} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{c.cohort}</td>
                <td className="p-3 text-right text-muted-foreground">{c.users}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(c.totalRevenue)}</td>
                <td className="p-3 text-right text-muted-foreground">{c.totalOrders}</td>
                <td className="p-3 text-right font-medium text-navy">{formatCurrency(c.ltv)}</td>
                <td className="p-3 text-right text-muted-foreground">{c.avgOrdersPerUser}</td>
              </tr>
            ))}
            {data.cohortData.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
