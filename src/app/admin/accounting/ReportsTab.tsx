'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, TrendingUp, TrendingDown, DollarSign, Receipt, Wallet, Banknote, BarChart3, PieChart as PieIcon, LineChart, FileSpreadsheet, Building2, CreditCard, ArrowUpRight, ArrowDownRight, Percent, Calendar } from 'lucide-react'
import { formatCurrency } from './format'
import { generatePdf } from '@/lib/pdf-export'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart as RechartsLine, Line, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#ef4444', '#14b8a6']

type ReportType = 'executive-summary' | 'revenue-analysis' | 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'expense-analysis' | 'tax-summary' | 'budget-vs-actual' | 'financial-ratios' | 'comprehensive'

const REPORT_LABELS: Record<ReportType, string> = {
  'executive-summary': 'Executive Summary',
  'revenue-analysis': 'Revenue Analysis',
  'profit-loss': 'Profit & Loss',
  'balance-sheet': 'Balance Sheet',
  'cash-flow': 'Cash Flow',
  'expense-analysis': 'Expense Analysis',
  'tax-summary': 'Tax Summary',
  'budget-vs-actual': 'Budget vs Actual',
  'financial-ratios': 'Financial Ratios',
  'comprehensive': 'Comprehensive Report',
}

const REPORT_ICONS: Record<ReportType, any> = {
  'executive-summary': BarChart3,
  'revenue-analysis': TrendingUp,
  'profit-loss': DollarSign,
  'balance-sheet': Wallet,
  'cash-flow': Banknote,
  'expense-analysis': Receipt,
  'tax-summary': FileSpreadsheet,
  'budget-vs-actual': Percent,
  'financial-ratios': LineChart,
  'comprehensive': PieIcon,
}

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom'

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
  { value: 'custom', label: 'Custom' },
]

function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, icon: Icon, color, bg, trend, onClick }: { label: string; value: string | number; icon: any; color: string; bg: string; trend?: { pct: string; positive: boolean } | null; onClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl border border-border p-4 hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg ${bg}`}><Icon className={`h-4 w-4 ${color}`} /></div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1 flex items-center gap-0.5 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {trend.pct}
        </p>
      )}
    </motion.div>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

function DataTable({ columns, rows, keyColumn }: { columns: { key: string; label: string; align?: 'left' | 'right'; format?: 'currency' | 'number' | 'text' }[]; rows: any[]; keyColumn: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground text-center py-8">No data</p>
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            {columns.map(col => (
              <th key={col.key} className={`p-3 font-medium ${col.align === 'right' ? 'text-right' : ''}`}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row[keyColumn] || i} className="border-b border-border/50 hover:bg-gray-50 transition-colors">
              {columns.map(col => {
                let val = row[col.key]
                if (col.format === 'currency') val = formatCurrency(val)
                if (col.format === 'number' && val != null) val = Number(val).toLocaleString()
                return (
                  <td key={col.key} className={`p-3 ${col.align === 'right' ? 'text-right' : ''} text-navy`}>{val ?? '-'}</td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReportsTab() {
  const [reportType, setReportType] = useState<ReportType>('executive-summary')
  const [period, setPeriod] = useState<Period>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [comparison, setComparison] = useState(false)
  const [branchFilter, setBranchFilter] = useState('')
  const [branches, setBranches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [compareData, setCompareData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/admin/accounting/branches?period=year')
      .then(r => r.ok ? r.json() : { branches: [] })
      .then(d => setBranches(d.branches || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('period', period)
    if (customStart) params.set('customStart', customStart)
    if (customEnd) params.set('customEnd', customEnd)
    if (branchFilter) params.set('branchId', branchFilter)

    const fetches: Promise<any>[] = []

    if (reportType === 'executive-summary' || reportType === 'comprehensive') {
      fetches.push(
        fetch(`/api/admin/accounting/overview?${params}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/accounting/reports?type=${period === 'day' ? 'daily' : period === 'week' ? 'weekly' : 'monthly'}`).then(r => r.ok ? r.json() : null),
        fetch('/api/admin/accounting/ratios').then(r => r.ok ? r.json() : null),
      )
    } else if (reportType === 'revenue-analysis') {
      fetches.push(
        fetch(`/api/admin/accounting/reports?type=${period === 'day' ? 'daily' : period === 'week' ? 'weekly' : 'monthly'}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/accounting/overview?${params}`).then(r => r.ok ? r.json() : null),
      )
    } else if (reportType === 'profit-loss') {
      fetches.push(fetch(`/api/admin/accounting/pl?period=${period}`).then(r => r.ok ? r.json() : null))
    } else if (reportType === 'balance-sheet') {
      fetches.push(fetch(`/api/admin/accounting/balance-sheet`).then(r => r.ok ? r.json() : null))
    } else if (reportType === 'cash-flow') {
      fetches.push(fetch(`/api/admin/accounting/cash-flow?period=${period}`).then(r => r.ok ? r.json() : null))
    } else if (reportType === 'expense-analysis') {
      fetches.push(fetch(`/api/admin/accounting/expenses?${params}`).then(r => r.ok ? r.json() : null))
    } else if (reportType === 'tax-summary') {
      fetches.push(fetch(`/api/admin/accounting/tax?period=${period}`).then(r => r.ok ? r.json() : null))
    } else if (reportType === 'budget-vs-actual') {
      fetches.push(
        fetch(`/api/admin/accounting/budgets/actual?period=${period}`).then(r => r.ok ? r.json() : null),
        fetch(`/api/admin/accounting/overview?${params}`).then(r => r.ok ? r.json() : null),
      )
    } else if (reportType === 'financial-ratios') {
      fetches.push(fetch('/api/admin/accounting/ratios').then(r => r.ok ? r.json() : null))
    }

    Promise.all(fetches)
      .then(results => {
        setData(results)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Failed to load report data')
        setLoading(false)
      })

    if (comparison) {
      const compParams = new URLSearchParams(params)
      compParams.set('comparePeriod', 'previous')
      fetch(`/api/admin/accounting/overview?${compParams}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => setCompareData(d?.compare || null))
        .catch(() => {})
    } else {
      setCompareData(null)
    }
  }, [reportType, period, customStart, customEnd, branchFilter, comparison])

  function getTrend(current: number, previous: number | undefined): { pct: string; positive: boolean } | null {
    if (previous === undefined || previous === 0) return null
    const diff = ((current - previous) / previous) * 100
    return { pct: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, positive: diff >= 0 }
  }

  function handleExportCSV() {
    if (!data) return
    const rows: Record<string, any>[] = []
    const report = data[0] || data

    if (reportType === 'executive-summary' || reportType === 'comprehensive') {
      const overview = data[0]
      if (overview) {
        rows.push({ Metric: 'Total Revenue', Value: overview.totalRevenue })
        rows.push({ Metric: 'Net Revenue', Value: overview.netRevenue })
        rows.push({ Metric: 'Total Orders', Value: overview.totalOrders })
        rows.push({ Metric: 'Avg Order Value', Value: overview.avgOrderValue })
        rows.push({ Metric: 'Returns', Value: overview.totalReturns })
        rows.push({ Metric: 'Expenses', Value: overview.totalExpenses })
      }
      const rep = data[1]
      if (rep?.periods) {
        rep.periods.forEach((p: any) => rows.push({ Period: p.period, Revenue: p.revenue, Orders: p.orderCount, 'Avg Order': p.avgOrderValue }))
      }
    } else if (reportType === 'revenue-analysis') {
      const rep = data[0]
      if (rep?.periods) {
        rep.periods.forEach((p: any) => rows.push({ Period: p.period, Revenue: p.revenue, Orders: p.orderCount, 'Avg Order': p.avgOrderValue }))
      }
    } else if (reportType === 'expense-analysis') {
      const exp = data[0]
      if (exp?.expenses) {
        exp.expenses.forEach((e: any) => rows.push({ Date: new Date(e.createdAt).toLocaleDateString(), Description: e.description, Amount: e.amount, Method: e.paymentMethod, Branch: e.branch?.name || '-' }))
      }
    } else if (reportType === 'financial-ratios') {
      const ratios = data[0]
      if (ratios) {
        Object.entries(ratios).forEach(([cat, items]: [string, any]) => {
          Object.entries(items).forEach(([key, r]: [string, any]) => {
            rows.push({ Category: cat, Ratio: r.label, Value: r.value, Benchmark: r.benchmark ?? '-' })
          })
        })
      }
    }

    if (rows.length) exportCSV(rows, `${reportType}-${period}.csv`)
  }

  async function handleExportPDF() {
    const { generatePdf: genPdf } = await import('@/lib/pdf-export')
    const rows: [string, string][] = []

    if (reportType === 'executive-summary' || reportType === 'comprehensive') {
      const overview = data?.[0]
      if (overview) {
        rows.push(['Total Revenue', formatCurrency(overview.totalRevenue)])
        rows.push(['Net Revenue', formatCurrency(overview.netRevenue)])
        rows.push(['Total Orders', String(overview.totalOrders)])
        rows.push(['Avg Order Value', formatCurrency(overview.avgOrderValue)])
        rows.push(['Returns', formatCurrency(overview.totalReturns)])
        rows.push(['Expenses', formatCurrency(overview.totalExpenses)])
      }
    }

    await genPdf({
      title: REPORT_LABELS[reportType],
      subtitle: PERIOD_OPTIONS.find(p => p.value === period)?.label,
      columns: ['Metric', 'Value'],
      rows: rows.length ? rows : [['No data', '']],
    })
  }

  function renderOverview(overview: any, ratios: any) {
    if (!overview) return null
    const netTrend = getTrend(overview.netRevenue, compareData?.compareNetRevenue)
    const revTrend = getTrend(overview.totalRevenue, compareData?.compareRevenue)
    const orderTrend = getTrend(overview.totalOrders, compareData?.compareTotalOrders)

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(overview.totalRevenue)} icon={DollarSign} color="text-green-600" bg="bg-green-50" trend={revTrend} />
          <StatCard label="Net Revenue" value={formatCurrency(overview.netRevenue)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" trend={netTrend} />
          <StatCard label="Total Orders" value={overview.totalOrders} icon={Receipt} color="text-navy" bg="bg-blue-50" trend={orderTrend} />
          <StatCard label="Avg Order" value={formatCurrency(overview.avgOrderValue)} icon={Wallet} color="text-purple-600" bg="bg-purple-50" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Returns" value={formatCurrency(overview.totalReturns)} icon={TrendingDown} color="text-red-600" bg="bg-red-50" />
          <StatCard label="Expenses" value={formatCurrency(overview.totalExpenses)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
          <StatCard label="Pending Orders" value={overview.pendingOrders} icon={Receipt} color="text-amber-600" bg="bg-amber-50" />
          <StatCard label="Unreconciled" value={overview.unreconciledOrders} icon={CreditCard} color="text-red-600" bg="bg-red-50" />
        </div>

        <div className="bg-gradient-to-r from-navy to-navy/90 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Net Revenue</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(overview.netRevenue)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">Revenue - Returns - Expenses</p>
              <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${overview.netRevenue >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {overview.netRevenue >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                Net Result
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
            <div>
              <p className="text-xs opacity-60">Revenue</p>
              <p className="font-semibold text-green-300">+{formatCurrency(overview.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Returns</p>
              <p className="font-semibold text-red-300">-{formatCurrency(overview.totalReturns)}</p>
            </div>
            <div>
              <p className="text-xs opacity-60">Expenses</p>
              <p className="font-semibold text-orange-300">-{formatCurrency(overview.totalExpenses)}</p>
            </div>
          </div>
        </div>

        {overview.paymentBreakdown && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> Payment Breakdown</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={140} height={140}>
                  <PieChart>
                    <Pie data={[
                      { name: 'Cash', value: overview.paymentBreakdown.cash || 0 },
                      { name: 'Card', value: overview.paymentBreakdown.card || 0 },
                      { name: 'Split', value: overview.paymentBreakdown.split || 0 },
                      { name: 'Bank Transfer', value: overview.paymentBreakdown.bank_transfer || 0 },
                      { name: 'InstaPay', value: overview.paymentBreakdown.instapay || 0 },
                      { name: 'Wallet', value: overview.paymentBreakdown.wallet || 0 },
                    ].filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                      {CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {[
                    { key: 'cash', label: 'Cash', color: '#10b981' },
                    { key: 'card', label: 'Card', color: '#3b82f6' },
                    { key: 'split', label: 'Split', color: '#8b5cf6' },
                    { key: 'bank_transfer', label: 'Bank Transfer', color: '#f59e0b' },
                    { key: 'instapay', label: 'InstaPay', color: '#06b6d4' },
                    { key: 'wallet', label: 'Wallet', color: '#ec4899' },
                  ].map(({ key, label, color }) => (
                    <div key={key} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />{label}</span>
                      <span className="font-medium text-navy">{formatCurrency(overview.paymentBreakdown[key] || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {overview.branchRevenue && Object.keys(overview.branchRevenue).length > 0 && (
              <div className="bg-white rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-muted-foreground" /> Branch Revenue</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={Object.entries(overview.branchRevenue).map(([name, amount]) => ({ name, revenue: amount }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="revenue" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {ratios && renderRatios(ratios)}
      </div>
    )
  }

  function renderRevenueAnalysis(reports: any, overview: any) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Revenue" value={formatCurrency(reports?.summary?.totalRevenue || 0)} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
          <StatCard label="Total Orders" value={reports?.summary?.totalOrders || 0} icon={Receipt} color="text-navy" bg="bg-blue-50" />
          <StatCard label="Avg Order Value" value={formatCurrency(reports?.summary?.avgOrderValue || 0)} icon={Wallet} color="text-purple-600" bg="bg-purple-50" />
          <StatCard label="Periods" value={reports?.periods?.length || 0} icon={Calendar} color="text-cyan-600" bg="bg-cyan-50" />
        </div>

        {reports?.periods && reports.periods.length > 0 && (
          <>
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={reports.periods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" fill="#1e3a5f" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Revenue vs Orders</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={reports.periods}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[3, 3, 0, 0]} name="Revenue" />
                  <Bar yAxisId="right" dataKey="orderCount" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {overview?.paymentBreakdown && (
          <div className="bg-white rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-navy mb-4">Revenue by Payment Method</h3>
            <div className="space-y-3">
              {Object.entries(overview.paymentBreakdown).filter(([, v]) => (v as number) > 0).map(([method, amount], i) => (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground capitalize">{method.replace('_', ' ')}</span>
                    <span className="font-medium text-navy">{formatCurrency(amount as number)}</span>
                  </div>
                  <MiniBar value={amount as number} max={Math.max(...Object.values(overview.paymentBreakdown) as number[], 1)} color={`bg-[${CHART_COLORS[i % CHART_COLORS.length]}]`} />
                </div>
              ))}
            </div>
          </div>
        )}

        <DataTable
          columns={[
            { key: 'period', label: 'Period' },
            { key: 'revenue', label: 'Revenue', align: 'right', format: 'currency' },
            { key: 'orderCount', label: 'Orders', align: 'right', format: 'number' },
            { key: 'avgOrderValue', label: 'Avg Order', align: 'right', format: 'currency' },
          ]}
          rows={reports?.periods || []}
          keyColumn="period"
        />
      </div>
    )
  }

  function renderExpenseAnalysis(expenses: any) {
    if (!expenses) return null
    const maxMethod = Math.max(...Object.values(expenses.byMethod || {}) as number[], 1)
    const methodLabel: Record<string, string> = { cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer', instapay: 'InstaPay', wallet: 'Wallet' }
    const methodColor: Record<string, string> = { cash: 'bg-green-500', card: 'bg-blue-500', bank_transfer: 'bg-amber-500', instapay: 'bg-cyan-500', wallet: 'bg-pink-500' }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Expenses" value={formatCurrency(expenses.totalExpenses)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
          <StatCard label="Count" value={expenses.count || 0} icon={Receipt} color="text-navy" bg="bg-blue-50" />
          <StatCard label="Avg per Transaction" value={expenses.count > 0 ? formatCurrency(expenses.totalExpenses / expenses.count) : formatCurrency(0)} icon={DollarSign} color="text-purple-600" bg="bg-purple-50" />
        </div>

        {Object.keys(expenses.byMethod || {}).length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">By Payment Method</h3>
              <div className="space-y-3">
                {Object.entries(expenses.byMethod).map(([method, amount]) => (
                  <div key={method}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{methodLabel[method] || method}</span>
                      <span className="font-medium text-navy">{formatCurrency(amount as number)}</span>
                    </div>
                    <MiniBar value={amount as number} max={maxMethod} color={methodColor[method] || 'bg-gray-500'} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={Object.entries(expenses.byMethod).map(([name, value], i) => ({ name: methodLabel[name] || name, value }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {CHART_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {Array.isArray(expenses.expenses) && expenses.expenses.length > 0 && (
          <DataTable
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'description', label: 'Description' },
              { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
              { key: 'method', label: 'Method' },
              { key: 'branch', label: 'Branch' },
            ]}
            rows={expenses.expenses.map((e: any) => ({ ...e, date: new Date(e.createdAt).toLocaleDateString(), method: methodLabel[e.paymentMethod] || e.paymentMethod, branch: e.branch?.name || '-', description: e.description }))}
            keyColumn="createdAt"
          />
        )}
      </div>
    )
  }

  function renderRatios(ratios: any) {
    if (!ratios) return null
    return (
      <div className="bg-white rounded-xl border border-border p-5">
        <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2"><LineChart className="h-4 w-4" /> Financial Ratios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(ratios.profitability || {}).map(([key, r]: [string, any]) => (
            <div key={key} className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
              <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>
                {(r.value * 100).toFixed(1)}%
              </p>
              {r.benchmark !== undefined && <p className="text-xs text-muted-foreground mt-0.5">Benchmark: {(r.benchmark * 100).toFixed(0)}%</p>}
            </div>
          ))}
          {Object.entries(ratios.liquidity || {}).map(([key, r]: [string, any]) => (
            <div key={key} className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
              <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>{r.value.toFixed(2)}</p>
              {r.benchmark !== undefined && <p className="text-xs text-muted-foreground mt-0.5">Benchmark: {r.benchmark.toFixed(1)}</p>}
            </div>
          ))}
          {Object.entries(ratios.efficiency || {}).map(([key, r]: [string, any]) => (
            <div key={key} className="p-3 rounded-lg bg-gray-50">
              <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
              <p className="text-lg font-bold text-navy">{r.value.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  function renderContent() {
    if (!data) return null

    if (reportType === 'executive-summary') {
      return renderOverview(data[0], data[2])
    }

    if (reportType === 'revenue-analysis') {
      return renderRevenueAnalysis(data[0], data[1])
    }

    if (reportType === 'profit-loss') {
      const pl = data[0]
      if (!pl) return <p className="text-sm text-muted-foreground">No P&L data available</p>
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Revenue" value={formatCurrency(pl.totalRevenue)} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Total Expenses" value={formatCurrency(pl.totalExpenses)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Net Income" value={formatCurrency(pl.netIncome)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
          </div>
          {pl.income && pl.income.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Income Breakdown</h3>
              <div className="space-y-3">
                {pl.income.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{item.category || item.name || 'Revenue'}</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(item.amount || item.revenue || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {pl.expenses && pl.expenses.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {pl.expenses.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{item.category || item.name || 'Expense'}</span>
                    <span className="text-sm font-medium text-orange-600">{formatCurrency(item.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DataTable
            columns={[
              { key: 'category', label: 'Category' },
              { key: 'amount', label: 'Amount', align: 'right', format: 'currency' },
            ]}
            rows={[...(pl.income || []).map((i: any) => ({ category: i.category || i.name || 'Revenue', amount: i.amount || i.revenue || 0 })), ...(pl.expenses || []).map((e: any) => ({ category: e.category || e.name || 'Expense', amount: e.amount || 0 }))]}
            keyColumn="category"
          />
        </div>
      )
    }

    if (reportType === 'balance-sheet') {
      const bs = data[0]
      if (!bs) return <p className="text-sm text-muted-foreground">No balance sheet data available</p>
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Assets" value={formatCurrency(bs.totalAssets)} icon={Wallet} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Total Liabilities" value={formatCurrency(bs.totalLiabilities)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Equity" value={formatCurrency(bs.totalEquity)} icon={TrendingUp} color="text-purple-600" bg="bg-purple-50" />
          </div>
          {bs.assets && bs.assets.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Assets</h3>
              <div className="space-y-2">
                {bs.assets.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{a.name || a.account || a.category}</span>
                    <span className="text-sm font-medium text-green-600">{formatCurrency(a.balance || a.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bs.liabilities && bs.liabilities.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Liabilities</h3>
              <div className="space-y-2">
                {bs.liabilities.map((l: any, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{l.name || l.account || l.category}</span>
                    <span className="text-sm font-medium text-orange-600">{formatCurrency(l.balance || l.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {bs.equity && bs.equity.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Equity</h3>
              <div className="space-y-2">
                {bs.equity.map((e: any, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{e.name || e.account || e.category}</span>
                    <span className="text-sm font-medium text-purple-600">{formatCurrency(e.balance || e.amount || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (reportType === 'cash-flow') {
      const cf = data[0]
      if (!cf) return <p className="text-sm text-muted-foreground">No cash flow data available</p>
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Operating" value={formatCurrency(cf.operating || 0)} icon={TrendingUp} color={cf.operating >= 0 ? 'text-green-600' : 'text-red-600'} bg={cf.operating >= 0 ? 'bg-green-50' : 'bg-red-50'} />
            <StatCard label="Investing" value={formatCurrency(cf.investing || 0)} icon={Banknote} color={cf.investing >= 0 ? 'text-green-600' : 'text-orange-600'} bg={cf.investing >= 0 ? 'bg-green-50' : 'bg-orange-50'} />
            <StatCard label="Financing" value={formatCurrency(cf.financing || 0)} icon={CreditCard} color={cf.financing >= 0 ? 'text-green-600' : 'text-purple-600'} bg={cf.financing >= 0 ? 'bg-green-50' : 'bg-purple-50'} />
            <StatCard label="Net Change" value={formatCurrency(cf.netChange || 0)} icon={DollarSign} color={cf.netChange >= 0 ? 'text-green-600' : 'text-red-600'} bg={cf.netChange >= 0 ? 'bg-green-50' : 'bg-red-50'} />
          </div>
          {cf.operatingDetails && cf.operatingDetails.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Operating Activities</h3>
              <div className="space-y-2">
                {cf.operatingDetails.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-sm text-navy">{d.description || d.name || d.category}</span>
                    <span className={`text-sm font-medium ${(d.amount || d.value || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(d.amount || d.value || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (reportType === 'expense-analysis') {
      return renderExpenseAnalysis(data[0])
    }

    if (reportType === 'tax-summary') {
      const tax = data[0]
      if (!tax) return <p className="text-sm text-muted-foreground">No tax data available</p>
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Tax Collected" value={formatCurrency(tax.taxCollected || 0)} icon={DollarSign} color="text-green-600" bg="bg-green-50" />
            <StatCard label="Tax Paid" value={formatCurrency(tax.taxPaid || 0)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
            <StatCard label="Net Tax Liability" value={formatCurrency(tax.netLiability || 0)} icon={TrendingDown} color="text-red-600" bg="bg-red-50" />
          </div>
          {tax.rates && tax.rates.length > 0 && (
            <DataTable
              columns={[
                { key: 'rate', label: 'Tax Rate' },
                { key: 'taxable', label: 'Taxable Amount', align: 'right', format: 'currency' },
                { key: 'tax', label: 'Tax Amount', align: 'right', format: 'currency' },
              ]}
              rows={tax.rates}
              keyColumn="rate"
            />
          )}
        </div>
      )
    }

    if (reportType === 'budget-vs-actual') {
      const budget = data[0]
      const overview = data[1]
      if (!budget && !overview) return <p className="text-sm text-muted-foreground">No budget data available</p>
      return (
        <div className="space-y-6">
          {overview?.budgetComparison && (
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Budget vs Actual</h3>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${overview.budgetComparison.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  Variance: {overview.budgetComparison.variance >= 0 ? '+' : ''}{overview.budgetComparison.variancePct}%
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex-1 space-y-3">
                  <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Budget</span><span className="font-medium text-navy">{formatCurrency(overview.budgetComparison.budgeted)}</span></div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((overview.budgetComparison.budgeted / overview.budgetComparison.budgeted) * 100, 100)}%` }} /></div></div>
                  <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Actual</span><span className="font-medium text-navy">{formatCurrency(overview.budgetComparison.actual)}</span></div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((overview.budgetComparison.actual / overview.budgetComparison.budgeted) * 100, 100)}%` }} /></div></div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg min-w-[120px]">
                  <p className="text-xs text-muted-foreground">Variance</p>
                  <p className={`text-xl font-bold ${overview.budgetComparison.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {overview.budgetComparison.variance >= 0 ? '+' : ''}{formatCurrency(overview.budgetComparison.variance)}
                  </p>
                </div>
              </div>
            </div>
          )}
          {(budget?.actual || budget?.budget) && (
            <DataTable
              columns={[
                { key: 'category', label: 'Category' },
                { key: 'budget', label: 'Budget', align: 'right', format: 'currency' },
                { key: 'actual', label: 'Actual', align: 'right', format: 'currency' },
                { key: 'variance', label: 'Variance', align: 'right', format: 'currency' },
              ]}
              rows={budget.actual?.map?.((a: any, i: number) => ({
                category: a.category || a.name || a.account,
                budget: (budget.budget?.[i]?.amount || 0),
                actual: a.amount || a.value || 0,
                variance: (a.amount || a.value || 0) - (budget.budget?.[i]?.amount || 0),
              })) || []}
              keyColumn="category"
            />
          )}
        </div>
      )
    }

    if (reportType === 'financial-ratios') {
      return <div className="space-y-6">{renderRatios(data[0])}</div>
    }

    if (reportType === 'comprehensive') {
      return (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-navy">Executive Overview</h3>
          {renderOverview(data[0], data[2])}
          <h3 className="text-sm font-semibold text-navy pt-4 border-t border-border">Revenue Detail</h3>
          {renderRevenueAnalysis(data[1], data[0])}
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(Object.entries(REPORT_LABELS) as [ReportType, string][]).slice(0, 5).map(([key, label]) => {
            const Icon = REPORT_ICONS[key]
            return (
              <button key={key} onClick={() => setReportType(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${reportType === key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            )
          })}
          <div className="relative">
            <select value={reportType} onChange={e => setReportType(e.target.value as ReportType)}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-transparent text-muted-foreground hover:text-navy appearance-none cursor-pointer">
              {REPORT_LABELS['budget-vs-actual'] && (Object.entries(REPORT_LABELS) as [ReportType, string][]).slice(5).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === opt.value ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'}`}>
              {opt.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-2 py-1.5 border border-border rounded-lg text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-2 py-1.5 border border-border rounded-lg text-xs" />
          </div>
        )}
        {branches.length > 0 && (
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-xs">
            <option value="">All Branches</option>
            {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        )}
        <button onClick={() => setComparison(!comparison)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${comparison ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
          vs Previous
        </button>
        <button onClick={handleExportCSV} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-3.5 w-3.5" /> CSV
        </button>
        <button onClick={handleExportPDF} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5">
          <Download className="h-3.5 w-3.5" /> PDF
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <motion.div key={reportType} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {renderContent()}
        </motion.div>
      )}
    </div>
  )
}
