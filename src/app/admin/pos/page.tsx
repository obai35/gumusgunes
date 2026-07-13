'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { DollarSign, ShoppingCart, Receipt, RotateCcw } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

import { PageHeader } from '@/components/admin/PageHeader'
import { PeriodSelector, type Period } from '@/components/admin/PeriodSelector'
import { RevenueChart } from '@/components/admin/RevenueChart'
import { StatsCard } from '@/components/admin/StatsCard'
import { DataTable } from '@/components/admin/DataTable'
import { ErrorBoundary } from '@/components/admin/ErrorBoundary'

type AnalyticsData = {
  overview: { totalSales: number; orderCount: number; avgOrderValue: number; totalReturns: number }
  revenueTrend: { date: string; revenue: number; orders: number }[]
  topProducts: { name: string; sku: string; quantity: number; revenue: number }[]
  paymentBreakdown: { method: string; total: number; count: number }[]
  shiftPerformance: { shiftId: string; branchName: string; startedAt: string; closedAt: string | null; totalSales: number; orderCount: number; avgOrderValue: number }[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function getDateRangeFromPeriod(period: Period): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10)
  let start: string

  switch (period) {
    case 'today':
      start = end
      break
    case 'week': {
      const d = new Date(now)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      start = d.toISOString().slice(0, 10)
      break
    }
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      break
    default:
      start = end
  }

  return { dateFrom: start, dateTo: end }
}

export default function AdminPOSAnalyticsPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (p: Period, from: string, to: string, cp: 'daily' | 'weekly' | 'monthly') => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ period: cp, dateFrom: from, dateTo: to })
      const res = await fetch(`/api/admin/pos/analytics?${params}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to fetch analytics')
      setData(json)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const range = period === 'custom' && dateFrom && dateTo
      ? { dateFrom, dateTo }
      : getDateRangeFromPeriod(period)
    fetchData(period, range.dateFrom, range.dateTo, chartPeriod)
  }, [period, dateFrom, dateTo, chartPeriod, fetchData])

  const handlePeriodChange = (p: Period) => {
    setPeriod(p)
    if (p !== 'custom') {
      setDateFrom('')
      setDateTo('')
    }
  }

  const handleDateRangeChange = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
  }

  const topProductColumns: ColumnDef<AnalyticsData['topProducts'][0]>[] = [
    {
      header: 'Rank',
      id: 'rank',
      cell: ({ row }) => row.index + 1,
      size: 50,
    },
    { header: 'Product Name', accessorKey: 'name' },
    { header: 'SKU', accessorKey: 'sku' },
    {
      header: 'Quantity Sold',
      accessorKey: 'quantity',
      cell: ({ row }) => row.original.quantity.toLocaleString(),
    },
    {
      header: 'Revenue',
      accessorKey: 'revenue',
      cell: ({ row }) => `\u00A3${row.original.revenue.toFixed(2)}`,
    },
  ]

  const shiftColumns: ColumnDef<AnalyticsData['shiftPerformance'][0]>[] = [
    { header: 'Branch', accessorKey: 'branchName' },
    {
      header: 'Started',
      accessorKey: 'startedAt',
      cell: ({ row }) => new Date(row.original.startedAt).toLocaleString(),
    },
    {
      header: 'Closed',
      accessorKey: 'closedAt',
      cell: ({ row }) => (row.original.closedAt ? new Date(row.original.closedAt).toLocaleString() : '\u2014'),
    },
    {
      header: 'Sales',
      accessorKey: 'totalSales',
      cell: ({ row }) => `\u00A3${row.original.totalSales.toFixed(2)}`,
    },
    { header: 'Orders', accessorKey: 'orderCount' },
    {
      header: 'Avg Order',
      accessorKey: 'avgOrderValue',
      cell: ({ row }) => `\u00A3${row.original.avgOrderValue.toFixed(2)}`,
    },
  ]

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-6">
        <PageHeader
          title="POS Analytics"
          subtitle="Sales performance and insights"
          actions={
            <PeriodSelector
              value={period}
              onChange={handlePeriodChange}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateRangeChange={handleDateRangeChange}
            />
          }
        />

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={DollarSign}
              label="Total Sales"
              value={data ? `\u00A3${data.overview.totalSales.toFixed(2)}` : '\u2014'}
            />
            <StatsCard
              icon={ShoppingCart}
              label="Order Count"
              value={data ? data.overview.orderCount.toLocaleString() : '\u2014'}
            />
            <StatsCard
              icon={Receipt}
              label="Avg Order Value"
              value={data ? `\u00A3${data.overview.avgOrderValue.toFixed(2)}` : '\u2014'}
            />
            <StatsCard
              icon={RotateCcw}
              label="Total Returns"
              value={data ? `\u00A3${data.overview.totalReturns.toFixed(2)}` : '\u2014'}
            />
          </motion.div>

          <motion.div variants={item}>
            <RevenueChart
              data={data?.revenueTrend || []}
              period={chartPeriod}
              onPeriodChange={setChartPeriod}
              loading={loading}
            />
          </motion.div>

          <motion.div variants={item}>
            <h3 className="text-sm font-semibold text-navy mb-3">Top Products</h3>
            <DataTable
              columns={topProductColumns}
              data={data?.topProducts || []}
              loading={loading}
              keyExtractor={(p) => p.sku}
            />
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-navy mb-3">Payment Breakdown</h3>
              {loading ? (
                <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  {data?.paymentBreakdown.map((pm) => (
                    <div
                      key={pm.method}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-b-0"
                    >
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {pm.method.replace(/_/g, ' ')}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-navy">
                          \u00A3{pm.total.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({pm.count} orders)
                        </span>
                      </div>
                    </div>
                  ))}
                  {(!data?.paymentBreakdown || data.paymentBreakdown.length === 0) && (
                    <div className="p-8 text-center text-gray-400">No payment data found</div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-navy mb-3">Recent Shifts</h3>
              <DataTable
                columns={shiftColumns}
                data={data?.shiftPerformance || []}
                loading={loading}
                keyExtractor={(s) => s.shiftId}
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </ErrorBoundary>
  )
}
