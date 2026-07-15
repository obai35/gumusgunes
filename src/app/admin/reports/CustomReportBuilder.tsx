'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { BarChart3, Loader2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

const METRICS = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'orders', label: 'Orders' },
  { value: 'customers', label: 'Customers' },
  { value: 'avg_order_value', label: 'Avg Order Value' },
]

const DIMENSIONS = [
  { value: 'date', label: 'Date (Daily)' },
  { value: 'month', label: 'Month' },
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'branch', label: 'Branch' },
]

export default function CustomReportBuilder() {
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['revenue', 'orders'])
  const [dimension, setDimension] = useState('date')
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  function toggleMetric(m: string) {
    setSelectedMetrics(prev =>
      prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
    )
  }

  async function generateReport() {
    if (selectedMetrics.length === 0) {
      toast.error('Select at least one metric')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/reports/builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: selectedMetrics, dimension, filters, from, to }),
      })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const chartData = data?.rows || []
  const colors = ['#b8860b', '#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-border p-5 space-y-4">
        <h2 className="text-sm font-semibold text-navy flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Report Configuration
        </h2>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Metrics</label>
          <div className="flex flex-wrap gap-2">
            {METRICS.map(m => (
              <button
                key={m.value}
                onClick={() => toggleMetric(m.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  selectedMetrics.includes(m.value)
                    ? 'bg-navy text-silver border-navy'
                    : 'bg-white text-muted-foreground border-border hover:text-navy'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Dimension</label>
            <select value={dimension} onChange={e => setDimension(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              {DIMENSIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Status Filter</label>
            <select value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={loading}
          className="px-6 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
          Generate Report
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {data.summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.summary.totalRevenue !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
                  <p className="text-xl font-bold text-navy">E£{data.summary.totalRevenue.toFixed(2)}</p>
                </div>
              )}
              {data.summary.totalOrders !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Orders</p>
                  <p className="text-xl font-bold text-navy">{data.summary.totalOrders}</p>
                </div>
              )}
              {data.summary.totalCustomers !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Customers</p>
                  <p className="text-xl font-bold text-navy">{data.summary.totalCustomers}</p>
                </div>
              )}
              {data.summary.avgOrderValue !== undefined && (
                <div className="bg-white rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Order Value</p>
                  <p className="text-xl font-bold text-navy">E£{data.summary.avgOrderValue.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {chartData.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Chart</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey={dimension} tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  {selectedMetrics.map((m, i) => (
                    <Bar
                      key={m}
                      dataKey={m}
                      name={METRICS.find(x => x.value === m)?.label || m}
                      fill={colors[i % colors.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-navy">Data Table</h3>
              <ExportButton
                filename={`custom-report-${dimension}`}
                columns={[
                  { header: dimension.charAt(0).toUpperCase() + dimension.slice(1), key: dimension },
                  ...selectedMetrics.map(m => ({ header: METRICS.find(x => x.value === m)?.label || m, key: m })),
                ]}
                data={chartData}
              />
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                  <th className="p-3 font-medium capitalize">{dimension}</th>
                  {selectedMetrics.map(m => (
                    <th key={m} className="p-3 font-medium text-right">{METRICS.find(x => x.value === m)?.label || m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{row[dimension]}</td>
                    {selectedMetrics.map(m => (
                      <td key={m} className="p-3 text-right text-navy">
                        {typeof row[m] === 'number' ? (m === 'orders' || m === 'customers' ? row[m] : `E£${row[m].toFixed(2)}`) : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
                {chartData.length === 0 && (
                  <tr><td colSpan={selectedMetrics.length + 1} className="p-6 text-center text-muted-foreground">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
