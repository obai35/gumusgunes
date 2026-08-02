'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts'
import React from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function YoYComparisonTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [years, setYears] = useState(3)
  const [metric, setMetric] = useState('all')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/yoy-comparison?years=${years}&metric=${metric}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false); if (d.years?.length) setSelectedYear(d.years[d.years.length - 1].year) })
      .catch(() => { toast.error(ta('Failed to load YoY')); setLoading(false) })
  }, [years, metric])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data || !data.years) return <div className="text-muted-foreground text-sm">{ta('No data')}</div>

  const yearlyChartData = data.years.map((y: any) => ({
    year: String(y.year),
    Revenue: y.revenue || 0,
    Orders: y.orderCount || 0,
    Customers: y.customers || 0,
  }))

  const selectedYearData = data.years.find((y: any) => y.year === selectedYear)
  const monthlyChartData = selectedYearData?.monthlyRevenue || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[2, 3, 5].map(y => (
            <button key={y} onClick={() => setYears(y)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${years === y ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {ta(`${y} Years`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          {[
            { value: 'all', label: ta('All') },
            { value: 'revenue', label: ta('Revenue') },
            { value: 'customers', label: ta('Customers') },
          ].map(m => (
            <button key={m.value} onClick={() => setMetric(m.value)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${metric === m.value ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m.label}
            </button>
          ))}
        </div>
        <ExportButton
          filename="yoy-comparison"
          columns={[
            { header: ta('Year'), key: 'year' },
            { header: ta('Revenue'), key: 'revenue' },
            { header: ta('Orders'), key: 'orderCount' },
            { header: ta('YoY Rev %'), key: 'revChange' },
            { header: ta('YoY Orders %'), key: 'orderChange' },
          ]}
          data={data.years}
        />
      </div>

      {data.years.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.years.slice(-2).map((y: any, i: number) => (
            <React.Fragment key={String(y.year)}>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta(`${y.year} Revenue`)}</p>
                <p className="text-xl font-bold text-navy">{fmtCurrency(y.revenue)}</p>
                {y.revChange != null && i > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-0.5 ${y.revChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {y.revChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {ta(`${y.revChange >= 0 ? '+' : ''}${y.revChange}% YoY`)}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta(`${y.year} Orders`)}</p>
                <p className="text-xl font-bold text-navy">{y.orderCount}</p>
                {y.orderChange != null && i > 0 && (
                  <p className={`text-xs mt-1 flex items-center gap-0.5 ${y.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {y.orderChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {ta(`${y.orderChange >= 0 ? '+' : ''}${y.orderChange}% YoY`)}
                  </p>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">{ta('Yearly Comparison')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              {(metric === 'all' || metric === 'customers') && (
                <Bar dataKey="Customers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy">{ta('Monthly Breakdown')}</h3>
            <select value={selectedYear || ''} onChange={e => setSelectedYear(parseInt(e.target.value))}
              className="px-2 py-1 border border-border rounded text-xs">
              {data.years.map((y: any) => <option key={y.year} value={y.year}>{y.year}</option>)}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 9 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              <Area type="monotone" dataKey="revenue" stroke="#b8860b" fill="#b8860b" fillOpacity={0.2} strokeWidth={2} dot={{ r: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Year')}</th>
              <th className="p-3 font-medium text-right">{ta('Revenue')}</th>
              <th className="p-3 font-medium text-right">{ta('Orders')}</th>
              <th className="p-3 font-medium text-right">{ta('Customers')}</th>
              <th className="p-3 font-medium text-right">{ta('Rev Change')}</th>
              <th className="p-3 font-medium text-right">{ta('Order Change')}</th>
            </tr>
          </thead>
          <tbody>
            {data.years.map((y: any) => (
              <tr key={y.year} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-bold text-navy">{y.year}</td>
                <td className="p-3 text-right text-green-600">{fmtCurrency(y.revenue)}</td>
                <td className="p-3 text-right text-navy">{y.orderCount}</td>
                <td className="p-3 text-right text-amber-600">{y.customers || '-'}</td>
                <td className={`p-3 text-right font-medium ${y.revChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {y.revChange != null ? ta(`${y.revChange >= 0 ? '+' : ''}${y.revChange}%`) : '-'}
                </td>
                <td className={`p-3 text-right font-medium ${y.orderChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {y.orderChange != null ? ta(`${y.orderChange >= 0 ? '+' : ''}${y.orderChange}%`) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
