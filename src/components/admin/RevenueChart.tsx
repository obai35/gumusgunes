'use client'

import { useState } from 'react'
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend,
} from 'recharts'
import { BarChart3 } from 'lucide-react'

type RevenueData = { date: string; revenue: number; orders?: number }

type RevenueChartProps = {
  data: RevenueData[]
  period: 'daily' | 'weekly' | 'monthly'
  onPeriodChange: (p: 'daily' | 'weekly' | 'monthly') => void
  comparison?: { value: number; positive: boolean }
  loading?: boolean
}

const periods = [
  { value: 'daily' as const, label: 'Daily' },
  { value: 'weekly' as const, label: 'Weekly' },
  { value: 'monthly' as const, label: 'Monthly' },
]

export function RevenueChart({ data, period, onPeriodChange, comparison, loading }: RevenueChartProps) {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar')

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-5">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-48 bg-gray-100 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-navy">Revenue</h3>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {periods.map(p => (
              <button
                key={p.value}
                onClick={() => onPeriodChange(p.value)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  period === p.value ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {comparison && (
            <span className={`text-xs font-medium ${comparison.positive ? 'text-green-600' : 'text-red-600'}`}>
              {comparison.positive ? '+' : ''}{comparison.value}% vs last {period}
            </span>
          )}
          <button
            onClick={() => setChartType(t => t === 'bar' ? 'line' : 'bar')}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
          No revenue data for this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${v}`} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [`$${v.toFixed(2)}`, period === 'daily' ? 'Revenue' : 'Revenue']}
            />
            {chartType === 'bar' ? (
              <Bar dataKey="revenue" fill="#b8860b" radius={[4, 4, 0, 0]} />
            ) : (
              <Line type="monotone" dataKey="revenue" stroke="#b8860b" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {data[0]?.orders !== undefined && (
              <Line type="monotone" dataKey="orders" stroke="#6b7280" strokeWidth={1.5} dot={false} />
            )}
            <Legend />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
