'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function PlCategoryTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/pl-category?period=${period}&year=${year}&month=${month}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load P&L'); setLoading(false) })
  }, [period, year, month])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /><Skeleton className="h-48 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">No data</div>

  const chartData = data.categories.map((c: any) => ({
    name: c.categoryName,
    Revenue: c.revenue,
    Cost: c.cost,
    Profit: c.grossProfit,
  }))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        {['month', 'quarter', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value) || 2024)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm w-20" />
        {period !== 'year' && (
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 border border-border rounded-lg text-sm">
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleString('default', { month: 'long' })}</option>
            ))}
          </select>
        )}
        <ExportButton
          filename={`pl-category-${period}-${year}`}
          columns={[
            { header: 'Category', key: 'categoryName' },
            { header: 'Revenue', key: 'revenue' },
            { header: 'Cost', key: 'cost' },
            { header: 'Gross Profit', key: 'grossProfit' },
            { header: 'Margin %', key: 'margin' },
            { header: 'Orders', key: 'orderCount' },
          ]}
          data={data.categories}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Cost</p>
          <p className="text-xl font-bold text-orange-600">{formatCurrency(data.summary.totalCost)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Gross Profit</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.totalGrossProfit)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Overall Margin</p>
          <p className={`text-xl font-bold ${data.summary.overallMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.summary.overallMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">Revenue vs Cost by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [formatCurrency(v), undefined]}
            />
            <Legend />
            <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Profit" fill="#b8860b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">Category</th>
              <th className="p-3 font-medium text-right">Revenue</th>
              <th className="p-3 font-medium text-right">Cost</th>
              <th className="p-3 font-medium text-right">Profit</th>
              <th className="p-3 font-medium text-right">Margin</th>
              <th className="p-3 font-medium text-right">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.categories.map((c: any) => (
              <tr key={c.categoryId} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-medium text-navy">{c.categoryName}</td>
                <td className="p-3 text-right text-green-600">{formatCurrency(c.revenue)}</td>
                <td className="p-3 text-right text-orange-600">{formatCurrency(c.cost)}</td>
                <td className="p-3 text-right text-navy font-medium">{formatCurrency(c.grossProfit)}</td>
                <td className={`p-3 text-right font-medium ${c.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {c.margin.toFixed(1)}%
                </td>
                <td className="p-3 text-right text-muted-foreground">{c.orderCount}</td>
              </tr>
            ))}
            {data.categories.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No data</td></tr>}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold border-t-2 border-border">
              <td className="p-3 text-navy">Total</td>
              <td className="p-3 text-right text-green-600">{formatCurrency(data.summary.totalRevenue)}</td>
              <td className="p-3 text-right text-orange-600">{formatCurrency(data.summary.totalCost)}</td>
              <td className="p-3 text-right text-navy">{formatCurrency(data.summary.totalGrossProfit)}</td>
              <td className="p-3 text-right text-green-600">{data.summary.overallMargin.toFixed(1)}%</td>
              <td className="p-3 text-right text-muted-foreground" />
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  )
}
