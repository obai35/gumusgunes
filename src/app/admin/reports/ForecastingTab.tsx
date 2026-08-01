'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  ComposedChart, Line, Bar,
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

export default function ForecastingTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [forecastMonths, setForecastMonths] = useState(6)
  const [historyMonths, setHistoryMonths] = useState(24)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/forecasting?forecastMonths=${forecastMonths}&historyMonths=${historyMonths}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load forecast')); setLoading(false) })
  }, [forecastMonths, historyMonths])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">{ta('No data')}</div>

  const chartData = [
    ...data.history.map((h: any) => ({ ...h, type: 'history' })),
    ...data.forecast.map((f: any) => ({ ...f, type: 'forecast' })),
  ]

  const TrendIcon = data.regression.trend === 'up' ? TrendingUp : data.regression.trend === 'down' ? TrendingDown : Minus
  const trendColor = data.regression.trend === 'up' ? 'text-green-600' : data.regression.trend === 'down' ? 'text-red-600' : 'text-gray-600'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setForecastMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${forecastMonths === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo {ta('Forecast')}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          {[12, 24, 36].map(m => (
            <button key={m} onClick={() => setHistoryMonths(m)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${historyMonths === m ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {m}mo {ta('History')}
            </button>
          ))}
        </div>
        <ExportButton
          filename="revenue-forecast"
          columns={[
            { header: ta('Month'), key: 'month' },
            { header: ta('Revenue'), key: 'revenue' },
            { header: ta('Type'), key: 'type' },
          ]}
          data={chartData}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon className={`h-4 w-4 ${trendColor}`} />
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{ta('Trend')}</p>
          </div>
          <p className={`text-xl font-bold capitalize ${trendColor}`}>{data.regression.trend}</p>
          <p className="text-xs text-muted-foreground">R² = {data.regression.r2}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Avg Monthly (History)')}</p>
          <p className="text-xl font-bold text-navy">{formatCurrency(data.summary.avgHistoryRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Avg Monthly (Forecast)')}</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.avgForecastRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Forecast')}</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(data.summary.totalForecastRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('History Total')}</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalHistoryRevenue)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4">{ta('Revenue History & Forecast')}</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 9 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [formatCurrency(v), ta('Revenue')]}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.6} name={ta('Historical')} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#b8860b"
              strokeWidth={2}
              dot={false}
              name={ta('Trend')}
            />
            {data.regression.trend && (
              <Line
                type="monotone"
                data={data.forecast}
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: '#3b82f6' }}
                name={ta('Forecast')}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">Historical Data</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.history.slice(-12).reverse().map((h: any) => (
                  <tr key={h.month} className="border-b border-border/50">
                    <td className="py-1.5 text-navy font-medium">{h.month}</td>
                    <td className="py-1.5 text-right text-green-600">{formatCurrency(h.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">Forecast</h3>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 font-medium">Month</th>
                  <th className="pb-2 font-medium text-right">Predicted Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.forecast.map((f: any) => (
                  <tr key={f.month} className="border-b border-border/50">
                    <td className="py-1.5 text-navy font-medium">{f.month}</td>
                    <td className="py-1.5 text-right text-blue-600 font-medium">{formatCurrency(f.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
