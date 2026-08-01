'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Clock, Sun as SunIcon, Moon } from 'lucide-react'

function formatCurrency(v: number) { return `E£${v.toFixed(2)}` }

function getHeatColor(value: number, max: number): string {
  if (max === 0) return 'bg-gray-50'
  const intensity = value / max
  if (intensity === 0) return 'bg-gray-50'
  if (intensity < 0.2) return 'bg-amber-50'
  if (intensity < 0.4) return 'bg-amber-100'
  if (intensity < 0.6) return 'bg-amber-200'
  if (intensity < 0.8) return 'bg-amber-300'
  return 'bg-amber-400'
}

const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => {
  if (i === 0) return '12a'
  if (i < 12) return `${i}a`
  if (i === 12) return '12p'
  return `${i - 12}p`
})

export default function SalesHeatmapTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState(() => {
    const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    return d.toISOString().slice(0, 10)
  })
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<'revenue' | 'count'>('revenue')

  function fetchData() {
    setLoading(true)
    fetch(`/api/admin/reports/sales-heatmap?from=${from}&to=${to}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load heatmap')); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>

  const maxVal = data ? (mode === 'revenue' ? data.maxRevenue : Math.max(...data.grid.flatMap((d: any) => d.hours.map((h: any) => h.count)), 1)) : 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        <span className="text-xs text-muted-foreground">{ta('to')}</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        <button onClick={fetchData}
          className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          {ta('Load')}
        </button>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button onClick={() => setMode('revenue')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'revenue' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('Revenue')}
          </button>
          <button onClick={() => setMode('count')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${mode === 'count' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('Orders')}
          </button>
        </div>
        <ExportButton
          filename="sales-heatmap"
          columns={
            data ? [{ header: ta('Day/Hour'), key: 'day' }, ...Array.from({ length: 24 }, (_, i) => ({ header: HOUR_LABELS[i], key: String(i) }))] : []
          }
          data={data ? data.grid.map((d: any) => {
            const row: any = { day: d.day }
            d.hours.forEach((h: any) => { row[String(h.hour)] = mode === 'revenue' ? h.revenue : h.count })
            return row
          }) : []}
        />
      </div>

      {data && data.busiestHour && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Revenue (period)')}</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(data.totals.totalRevenue)}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Total Orders')}</p>
            <p className="text-xl font-bold text-navy">{data.totals.totalOrders}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Busiest Day')}</p>
            <p className="text-xl font-bold text-navy">{data.busiestHour.day}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{ta('Busiest Hour')}</p>
            <p className="text-xl font-bold text-navy">{HOUR_LABELS[data.busiestHour.hour]}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-border p-5 overflow-x-auto">
        <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {ta('Sales')} {mode === 'revenue' ? ta('Revenue') : ta('Orders')} {ta('Heatmap (Weekday × Hour)')}
        </h3>
        {data && (
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="p-1 text-left text-muted-foreground font-medium w-12" />
                {HOUR_LABELS.map((label, i) => (
                  <th key={i} className={`p-1 text-center font-medium w-8 ${i >= 6 && i < 18 ? 'text-amber-600' : 'text-indigo-400'}`}>
                    {i === 6 ? <SunIcon className="h-3 w-3 inline" /> : i === 18 ? <Moon className="h-3 w-3 inline" /> : null}
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.grid.map((d: any) => (
                <tr key={d.day}>
                  <td className="p-1 font-medium text-navy text-left">{d.day}</td>
                  {d.hours.map((h: any) => {
                    const val = mode === 'revenue' ? h.revenue : h.count
                    return (
                      <td
                        key={h.hour}
                        className={`p-1 text-center rounded cursor-default ${getHeatColor(val, maxVal)}`}
                        title={`${d.day} ${HOUR_LABELS[h.hour]}: ${mode === 'revenue' ? formatCurrency(h.revenue) : `${h.count} ${ta('orders')}`}`}
                      >
                        <span className="text-[10px] font-medium text-gray-700">
                          {mode === 'revenue' ? (h.revenue > 0 ? 'E£' + (h.revenue / 1000).toFixed(0) + 'k' : '') : (h.count > 0 ? h.count : '')}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
          <span>{ta('Low')}</span>
          <div className="flex gap-0.5">
            <div className="h-3 w-6 rounded bg-gray-50 border border-border" />
            <div className="h-3 w-6 rounded bg-amber-50 border border-amber-100" />
            <div className="h-3 w-6 rounded bg-amber-100 border border-amber-200" />
            <div className="h-3 w-6 rounded bg-amber-200 border border-amber-300" />
            <div className="h-3 w-6 rounded bg-amber-300 border border-amber-400" />
            <div className="h-3 w-6 rounded bg-amber-400 border border-amber-500" />
          </div>
          <span>{ta('High')}</span>
        </div>
      </div>
    </motion.div>
  )
}
