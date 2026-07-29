'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, DollarSign, Filter, X, Building2, Download, TrendingUp, TrendingDown, Receipt, Wallet, Banknote, CreditCard, ArrowUpRight, ArrowDownRight, Plus, Trash2 } from 'lucide-react'
import { ErrorBoundary } from '@/components/admin/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import JournalTab from './JournalTab'
import AccountsTab from './AccountsTab'
import TrialBalanceTab from './TrialBalanceTab'
import ProfitLossTab from './ProfitLossTab'
import BalanceSheetTab from './BalanceSheetTab'
import AuditTab from './AuditTab'
import AgingTab from './AgingTab'
import TaxTab from './TaxTab'
import BudgetTab from './BudgetTab'
import CashFlowTab from './CashFlowTab'
import ReconciliationTab from './ReconciliationTab'
import InvoicesTab from './InvoicesTab'
import BillsTab from './BillsTab'
import InventoryValuationTab from './InventoryValuationTab'
import ReportsTab from './ReportsTab'
import EmployeeTab from './EmployeeTab'
import PayrollTab from './PayrollTab'
import BankFeedTab from './BankFeedTab'
import ConsolidationTab from './ConsolidationTab'
import PurchasingTab from './PurchasingTab'
import FixedAssetsTab from './FixedAssetsTab'
import FpnaTab from './FpnaTab'
import ComplianceTab from './ComplianceTab'
import { formatCurrency } from './format'

type Period = 'day' | 'week' | 'month' | 'year' | 'custom'

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function exportCSVRows(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899']

function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (!Array.isArray(data) || data.length === 0) return null

  const isMonthly = data.length > 0 && data[0].date.length <= 7

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-navy mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => isMonthly ? v.slice(5) : v.slice(5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
          <Line type="monotone" dataKey="revenue" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 3, fill: '#1e3a5f' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function calcCompare(current: number, previous: number | undefined): { pct: string; positive: boolean } | null {
  if (previous === undefined || previous === 0) return null
  const diff = ((current - previous) / previous) * 100
  return { pct: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, positive: diff >= 0 }
}

const PERIOD_LABELS: Record<string, string> = { day: 'Today', week: 'This Week', month: 'This Month', year: 'This Year', custom: 'Custom' }

export default function AccountingPage() {
  const [tab, setTab] = useState('overview')
  const [period, setPeriod] = useState<Period>('day')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [overviewData, setOverviewData] = useState<any>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => setRefreshKey(k => k + 1), 30000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh])

  useEffect(() => {
    if (tab !== 'overview') return
    setOverviewLoading(true)
    const params = new URLSearchParams()
    params.set('period', period)
    if (period === 'custom' && customStart && customEnd) {
      params.set('customStart', customStart)
      params.set('customEnd', customEnd)
    }
    fetch(`/api/admin/accounting/overview?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setOverviewData(data); setOverviewLoading(false) })
      .catch(() => { toast.error('Failed to load data'); setOverviewLoading(false) })
  }, [period, customStart, customEnd, refreshKey, tab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-semibold text-navy">Accounting</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(Object.entries(PERIOD_LABELS) as [Period, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  period === key ? 'bg-white text-navy shadow-sm' : 'text-muted-foreground hover:text-navy'
                }`}
              >
                {label}
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
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
              autoRefresh ? 'bg-green-50 text-green-700 border-green-300' : 'bg-white text-muted-foreground border-border hover:text-navy'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            Auto
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {(['overview', 'journal', 'accounts', 'trial-balance', 'pl', 'balance-sheet', 'cash-flow', 'reconciliation', 'aging', 'tax', 'invoices', 'bills', 'purchasing', 'inventory-valuation', 'budget', 'audit', 'orders', 'branches', 'expenses', 'reports', 'employees', 'payroll', 'bank-feeds', 'consolidation', 'fixed-assets', 'fpna', 'compliance'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t ? 'border-navy text-navy' : 'border-transparent text-muted-foreground hover:text-navy'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <ErrorBoundary>
        {tab === 'overview' && <OverviewTab data={overviewData} loading={overviewLoading} period={period} compareEnabled={false} customStart={customStart} customEnd={customEnd} />}
        {tab === 'journal' && <JournalTab />}
        {tab === 'accounts' && <AccountsTab />}
        {tab === 'trial-balance' && <TrialBalanceTab />}
        {tab === 'pl' && <ProfitLossTab />}
        {tab === 'balance-sheet' && <BalanceSheetTab />}
        {tab === 'cash-flow' && <CashFlowTab />}
        {tab === 'reconciliation' && <ReconciliationTab />}
        {tab === 'aging' && <AgingTab />}
        {tab === 'tax' && <TaxTab />}
        {tab === 'invoices' && <InvoicesTab />}
        {tab === 'bills' && <BillsTab />}
        {tab === 'inventory-valuation' && <InventoryValuationTab />}
        {tab === 'budget' && <BudgetTab />}
        {tab === 'audit' && <AuditTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'branches' && <BranchesTab />}
        {tab === 'expenses' && <ExpensesTab refreshKey={refreshKey} />}
        {tab === 'reports' && <ReportsTab />}
        {tab === 'employees' && <EmployeeTab />}
        {tab === 'payroll' && <PayrollTab />}
        {tab === 'bank-feeds' && <BankFeedTab />}
        {tab === 'consolidation' && <ConsolidationTab />}
        {tab === 'purchasing' && <PurchasingTab />}
        {tab === 'fixed-assets' && <FixedAssetsTab />}
        {tab === 'fpna' && <FpnaTab />}
        {tab === 'compliance' && <ComplianceTab />}
      </ErrorBoundary>
    </div>
  )
}

function OverviewTab({ data, loading, period, compareEnabled, customStart, customEnd }: { data: any; loading: boolean; period: Period; compareEnabled: boolean; customStart: string; customEnd: string }) {
  const [localCompare, setLocalCompare] = useState(false)
  const [compareData, setCompareData] = useState<any>(null)
  const [ratios, setRatios] = useState<any>(null)
  const [drillDown, setDrillDown] = useState<{ type: string; data: any } | null>(null)
  const cp1000 = (data.cashPosition as any)?.['1000']?.balance || 0
  const cp1100 = (data.cashPosition as any)?.['1100']?.balance || 0
  const totalLiquid = cp1000 + cp1100
  const expenseTotal = (data.expenseBreakdown || []).reduce((s: number, e: any) => s + e.balance, 0)

  useEffect(() => {
    fetch('/api/admin/accounting/ratios')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setRatios(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!localCompare) { setCompareData(null); return }
    const params = new URLSearchParams()
    params.set('period', period)
    params.set('comparePeriod', 'previous')
    if (period === 'custom' && customStart && customEnd) {
      params.set('customStart', customStart)
      params.set('customEnd', customEnd)
    }
    fetch(`/api/admin/accounting/overview?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setCompareData(d.compare || null))
      .catch(() => {})
  }, [localCompare, period])

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-xl border border-border p-4 h-24" />
        ))}
      </div>
    )
  }

  function statCompare(current: number, compareKey: string) {
    if (!compareData) return null
    const prev = compareData[compareKey]
    return calcCompare(current, prev)
  }

  function handleExportCSV() {
    const rows: Record<string, any>[] = [
      { Metric: 'Period', Value: period },
      { Metric: 'Total Revenue', Value: data.totalRevenue },
      { Metric: 'Net Revenue', Value: data.netRevenue },
      { Metric: 'Total Orders', Value: data.totalOrders },
      { Metric: 'Avg Order Value', Value: data.avgOrderValue },
      { Metric: 'Returns', Value: data.totalReturns },
      { Metric: 'Expenses', Value: data.totalExpenses },
      { Metric: 'Pending Orders', Value: data.pendingOrders },
      { Metric: 'Unreconciled Payments', Value: data.unreconciledOrders },
      { Metric: 'Open Shifts', Value: data.openShifts },
    ]
    Object.entries(data.paymentBreakdown || {}).forEach(([k, v]) => {
      rows.push({ Metric: `Payment - ${k}`, Value: v as number })
    })
    Object.entries(data.branchRevenue || {}).forEach(([k, v]) => {
      rows.push({ Metric: `Branch - ${k}`, Value: v as number })
    })
    ;(Array.isArray(data.dailyRevenue) ? data.dailyRevenue : []).forEach((d: any) => {
      rows.push({ Metric: `Revenue ${d.date}`, Value: d.revenue })
    })
    exportCSVRows(rows, `overview-${period}.csv`)
  }

  function StatCard({ label, value, icon: Icon, color, bg, compareKey, onClick }: {
    label: string; value: string | number; icon: any; color: string; bg: string; compareKey?: string; onClick?: () => void
  }) {
    const cmp = compareKey ? statCompare(parseFloat(String(value).replace(/[^0-9.-]/g, '')), compareKey) : null
    return (
      <div className={`bg-white rounded-xl border border-border p-4 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
        {cmp && (
          <p className={`text-xs mt-1 flex items-center gap-0.5 ${cmp.positive ? 'text-green-600' : 'text-red-600'}`}>
            {cmp.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {cmp.pct} vs previous
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocalCompare(!localCompare)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              localCompare ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'
            }`}
          >
            vs Previous
          </button>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
        <button
          onClick={() => {
            const rows = [['Metric', 'Value']]
            for (const [key, val] of Object.entries({
              'Total Revenue': data.totalRevenue, 'Net Revenue': data.netRevenue,
              'Total Orders': data.totalOrders, 'Avg Order Value': data.avgOrderValue,
              'Returns': data.totalReturns, 'Expenses': data.totalExpenses,
              'Pending Orders': data.pendingOrders, 'Unreconciled Payments': data.unreconciledOrders,
              'Open Shifts': data.openShifts,
            })) rows.push([key, String(val)])
            const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `overview-${period}.xls`; a.click()
          }}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Excel
        </button>
        <button
          onClick={async () => {
            const { generatePdf } = await import('@/lib/pdf-export')
            const rows = [['Metric', 'Value'],
              ['Period', period], ['Total Revenue', formatCurrency(data.totalRevenue)],
              ['Net Revenue', formatCurrency(data.netRevenue)], ['Total Orders', String(data.totalOrders)],
              ['Avg Order Value', formatCurrency(data.avgOrderValue)], ['Returns', formatCurrency(data.totalReturns)],
              ['Expenses', formatCurrency(data.totalExpenses)], ['Pending Orders', String(data.pendingOrders)],
              ['Unreconciled Payments', String(data.unreconciledOrders)], ['Open Shifts', String(data.openShifts)],
            ]
            await generatePdf({
              title: 'Accounting Overview',
              subtitle: PERIOD_LABELS[period],
              columns: ['Metric', 'Value'],
              rows,
            })
          }}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> PDF
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} color="text-green-600" bg="bg-green-50" compareKey="compareRevenue" onClick={() => setDrillDown({ type: 'Total Revenue', data: { revenue: data.totalRevenue, period } })} />
        <StatCard label="Net Revenue" value={formatCurrency(data.netRevenue)} icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" compareKey="compareNetRevenue" onClick={() => setDrillDown({ type: 'Net Revenue', data: { netRevenue: data.netRevenue, totalRevenue: data.totalRevenue, returns: data.totalReturns, expenses: data.totalExpenses, period } })} />
        <StatCard label="Total Orders" value={data.totalOrders} icon={Receipt} color="text-navy" bg="bg-blue-50" compareKey="compareTotalOrders" onClick={() => setDrillDown({ type: 'Orders', data: { totalOrders: data.totalOrders, pendingOrders: data.pendingOrders, period } })} />
        <StatCard label="Avg Order" value={formatCurrency(data.avgOrderValue)} icon={Wallet} color="text-purple-600" bg="bg-purple-50" onClick={() => setDrillDown({ type: 'Avg Order Value', data: { avgOrderValue: data.avgOrderValue, totalRevenue: data.totalRevenue, totalOrders: data.totalOrders, period } })} />
        <StatCard label="Returns" value={formatCurrency(data.totalReturns)} icon={TrendingDown} color="text-red-600" bg="bg-red-50" onClick={() => setDrillDown({ type: 'Returns', data: { totalReturns: data.totalReturns, period } })} />
        <StatCard label="Expenses" value={formatCurrency(data.totalExpenses)} icon={Banknote} color="text-orange-600" bg="bg-orange-50" />
      </div>

      {data.budgetComparison && data.budgetComparison.budgeted > 0 && (
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget vs Actual</p>
            <span className={`text-xs font-medium ${data.budgetComparison.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.budgetComparison.variance >= 0 ? '+' : ''}{data.budgetComparison.variancePct}%
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Actual</span>
                <span className="font-medium text-navy">{formatCurrency(data.budgetComparison.actual)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((data.budgetComparison.actual / data.budgetComparison.budgeted) * 100, 100)}%` }} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-medium text-navy">{formatCurrency(data.budgetComparison.budgeted)}</p>
            </div>
          </div>
        </div>
      )}

      {data.totalRevenue > 0 && data.totalReturns !== undefined && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-3">COGS Reconciliation</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">COGS {data.totalCOGS === undefined && '(Est.)'}</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(data.totalCOGS ?? data.totalRevenue * 0.6)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gross Margin</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(data.totalRevenue - (data.totalCOGS ?? data.totalRevenue * 0.6))}
                {data.grossMargin !== undefined && <> ({data.grossMargin.toFixed(1)}%)</>}
              </p>
            </div>
          </div>
        </div>
      )}

      <RevenueChart data={data.dailyRevenue || []} />

      {ratios && (
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">Financial Ratios</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(ratios.profitability || {}).map(([key, r]: [string, any]) => (
              <div key={key} className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>
                  {(r.value * 100).toFixed(1)}%
                </p>
                {r.benchmark !== undefined && (
                  <p className="text-xs text-muted-foreground mt-0.5">Benchmark: {(r.benchmark * 100).toFixed(0)}%</p>
                )}
              </div>
            ))}
            {Object.entries(ratios.liquidity || {}).map(([key, r]: [string, any]) => (
              <div key={key} className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-1">{r.label}</p>
                <p className={`text-lg font-bold ${r.benchmark !== undefined ? (r.value >= r.benchmark ? 'text-green-600' : 'text-red-600') : 'text-navy'}`}>
                  {r.value.toFixed(2)}
                </p>
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
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Payment Breakdown
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Cash', value: data.paymentBreakdown?.cash || 0 },
                    { name: 'Card', value: data.paymentBreakdown?.card || 0 },
                    { name: 'Split', value: data.paymentBreakdown?.split || 0 },
                    { name: 'Bank Transfer', value: data.paymentBreakdown?.bank_transfer || 0 },
                    { name: 'InstaPay', value: data.paymentBreakdown?.instapay || 0 },
                    { name: 'Wallet', value: data.paymentBreakdown?.wallet || 0 },
                  ].filter(d => d.value > 0)}
                  cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                  dataKey="value"
                >
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
                  <span className="font-medium text-navy">{formatCurrency(data.paymentBreakdown?.[key] || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            Branch Revenue
          </h3>
          {Object.entries(data.branchRevenue || {}).length === 0 ? (
            <p className="text-sm text-muted-foreground">No data for this period</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={Object.entries(data.branchRevenue || {}).map(([name, amount]) => ({ name, revenue: amount }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="revenue" fill="#1e3a5f" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Cash Position
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#059669" strokeWidth="8" strokeDasharray={`${251.2 * Math.min(cp1000 / Math.max(totalLiquid, 1), 1)} 251.2`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-navy">{formatCurrency(totalLiquid)}</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Cash</span>
                <span className="font-medium text-navy">{formatCurrency(cp1000)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Bank</span>
                <span className="font-medium text-navy">{formatCurrency(cp1100)}</span>
              </div>
              <div className="pt-1 border-t border-border">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Total Liquid</span>
                  <span className="text-navy">{formatCurrency(totalLiquid)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
            Expense Breakdown
          </h3>
          {(data.expenseBreakdown || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No expenses this period</p>
          ) : (
            <div className="space-y-2">
              {data.expenseBreakdown.slice(0, 8).map((exp: any) => {
                const pct = expenseTotal > 0 ? (exp.balance / expenseTotal) * 100 : 0
                return (
                  <div key={exp.code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-navy font-medium truncate">{exp.nameAr || exp.name}</span>
                      <span className="font-semibold text-navy">{formatCurrency(exp.balance)}</span>
                    </div>
                    <MiniBar value={exp.balance} max={expenseTotal} color="bg-rose-500" />
                    <span className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
              {(data.expenseBreakdown?.length || 0) > 8 && (
                <p className="text-xs text-muted-foreground text-center pt-1">+{data.expenseBreakdown.length - 8} more</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Pending Orders</p>
          <p className="text-2xl font-bold text-amber-600">{data.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Unreconciled Payments</p>
          <p className="text-2xl font-bold text-red-600">{data.unreconciledOrders}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Open Shifts</p>
          <p className={`text-2xl font-bold ${data.openShifts > 0 ? 'text-amber-600' : 'text-green-600'}`}>{data.openShifts}</p>
          {data.openShiftBranches?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">{data.openShiftBranches.join(', ')}</p>
          )}
        </div>
      </div>

      <div className="bg-gradient-to-r from-navy to-navy/90 rounded-xl p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Net Revenue</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(data.netRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-60">{PERIOD_LABELS[period]}</p>
            <p className={`text-sm font-medium mt-1 flex items-center gap-1 ${data.netRevenue >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {data.netRevenue >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              Revenue - Returns - Expenses
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20 text-sm">
          <div>
            <p className="text-xs opacity-60">Revenue</p>
            <p className="font-semibold text-green-300">+{formatCurrency(data.totalRevenue)}</p>
          </div>
          <div>
            <p className="text-xs opacity-60">Returns</p>
            <p className="font-semibold text-red-300">-{formatCurrency(data.totalReturns)}</p>
          </div>
          <div>
            <p className="text-xs opacity-60">Expenses</p>
            <p className="font-semibold text-orange-300">-{formatCurrency(data.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {drillDown && (
        <div className="bg-gray-50 rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-navy">Drill-down: {drillDown.type}</h4>
            <button onClick={() => setDrillDown(null)} className="text-xs text-muted-foreground hover:text-navy">Close</button>
          </div>
          <pre className="text-xs text-muted-foreground max-h-60 overflow-auto">{JSON.stringify(drillDown.data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [page, setPage] = useState(1)

  function fetchOrders() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)
    params.set('page', String(page))
      fetch(`/api/admin/accounting/orders?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((data) => { setOrders(data.orders || []); setTotal(data.total || 0) })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [page])

  async function handleFulfill(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/orders/${id}/fulfill`, { method: 'POST' })
      if (res.ok) { toast.success('Order fulfilled'); fetchOrders() }
      else toast.error('Failed to fulfill')
    } catch { toast.error('Failed to fulfill') }
  }

  async function handleReconcile(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/orders/${id}/reconcile`, { method: 'POST' })
      if (res.ok) { toast.success('Payment reconciled'); fetchOrders() }
      else toast.error('Failed to reconcile')
    } catch { toast.error('Failed to reconcile') }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700', processing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const paymentLabels: Record<string, string> = {
    cash: 'Cash', card: 'Card', split: 'Split',
    bank_transfer: 'Bank Transfer', instapay: 'InstaPay', wallet: 'Wallet',
  }

  if (selectedOrder) {
    return (
      <div>
        <button onClick={() => setSelectedOrder(null)} className="text-sm text-navy hover:text-gold mb-4 flex items-center gap-1">
          <X className="h-4 w-4" /> Back to orders
        </button>
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Order #</p><p className="font-medium text-navy">{selectedOrder.receiptNumber || selectedOrder.orderNumber}</p></div>
            <div><p className="text-muted-foreground">Customer</p><p className="font-medium text-navy">{selectedOrder.fullName}</p></div>
            <div><p className="text-muted-foreground">Branch</p><p className="font-medium text-navy">{selectedOrder.shift?.branch?.name || '-'}</p></div>
            <div><p className="text-muted-foreground">Total</p><p className="font-bold text-navy">{formatCurrency(selectedOrder.totalAmount)}</p></div>
            <div><p className="text-muted-foreground">Status</p><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[selectedOrder.status] || ''}`}>{selectedOrder.status}</span></div>
            <div><p className="text-muted-foreground">Payment</p><p className="font-medium text-navy">{paymentLabels[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p></div>
            <div><p className="text-muted-foreground">Payment Status</p><p className="font-medium text-navy">{selectedOrder.paymentStatus}</p></div>
            <div><p className="text-muted-foreground">Date</p><p className="font-medium text-navy">{new Date(selectedOrder.createdAt).toLocaleString()}</p></div>
            {selectedOrder.fulfilledAt && <div><p className="text-muted-foreground">Fulfilled</p><p className="font-medium text-green-600">{new Date(selectedOrder.fulfilledAt).toLocaleString()}</p></div>}
            {selectedOrder.reconciledAt && <div><p className="text-muted-foreground">Reconciled</p><p className="font-medium text-green-600">{new Date(selectedOrder.reconciledAt).toLocaleString()}</p></div>}
          </div>
          {selectedOrder.items?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy mb-2">Items</h3>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="pb-2 font-medium">Product</th><th className="pb-2 font-medium text-right">Qty</th><th className="pb-2 font-medium text-right">Price</th><th className="pb-2 font-medium text-right">Total</th></tr></thead>
                <tbody>
                  {selectedOrder.items.map((item: any, i: number) => (
                    <tr key={item.id || i} className="border-b border-border/50">
                      <td className="py-2 text-navy font-medium">{item.product?.name || item.product?.productName || '-'}</td>
                      <td className="py-2 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.price)}</td>
                      <td className="py-2 text-right text-navy font-medium">{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            {selectedOrder.status !== 'delivered' && (
              <button onClick={() => { handleFulfill(selectedOrder.id); setSelectedOrder(null) }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" /> Mark Delivered
              </button>
            )}
            {!selectedOrder.reconciledAt && selectedOrder.paymentStatus === 'paid' && (
              <button onClick={() => { handleReconcile(selectedOrder.id); setSelectedOrder(null) }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                <DollarSign className="h-4 w-4" /> Reconcile Payment
              </button>
            )}
          </div>
        </div>
      </div>
  )
}

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            placeholder="Search by order#, receipt, name..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Payments</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
        <button onClick={() => {
          const params = new URLSearchParams()
          if (search) params.set('search', search)
          if (statusFilter) params.set('status', statusFilter)
          if (paymentFilter) params.set('paymentStatus', paymentFilter)
          window.open(`/api/admin/accounting/export/orders?${params}`, '_blank')
        }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> Export Excel
        </button>
        <button onClick={fetchOrders} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors">
          <Filter className="h-4 w-4 inline mr-1" /> Filter
        </button>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Receipt #</th>
                <th className="p-3 font-medium">Branch</th>
                <th className="p-3 font-medium">Customer</th>
                <th className="p-3 font-medium text-right">Total</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium">Payment</th>
                <th className="p-3 font-medium">Reconciled</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">No orders found</td></tr>}
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                  <td className="p-3 font-medium text-navy">#{order.receiptNumber || order.orderNumber?.slice(0, 10)}</td>
                  <td className="p-3 text-muted-foreground">{order.shift?.branch?.name || '-'}</td>
                  <td className="p-3 text-navy">{order.fullName}</td>
                  <td className="p-3 text-right font-medium text-navy">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || ''}`}>{order.status}</span></td>
                  <td className="p-3 text-muted-foreground">{paymentLabels[order.paymentMethod] || order.paymentMethod}</td>
                  <td className="p-3">{order.reconciledAt ? <span className="text-green-600 text-xs font-medium">Yes</span> : <span className="text-amber-600 text-xs font-medium">No</span>}</td>
                  <td className="p-3 text-muted-foreground text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {order.status !== 'delivered' && <button onClick={() => handleFulfill(order.id)} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">Fulfill</button>}
                      {!order.reconciledAt && order.paymentStatus === 'paid' && <button onClick={() => handleReconcile(order.id)} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">Reconcile</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border">
            <span>{total} total orders</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.ceil(total / 30) }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded text-xs ${page === i + 1 ? 'bg-navy text-silver' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BranchesTab() {
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState('day')

  useEffect(() => {
    fetch(`/api/admin/accounting/branches?period=${period}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => toast.error('Failed to load branch data'))
  }, [period])

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['day', 'week', 'month'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={() => window.open(`/api/admin/accounting/export/branches?period=${period}`, '_blank')} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>
      {!data ? <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div> : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(Array.isArray(data.branches) ? data.branches : []).map((branch: any) => (
            <div key={branch.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-navy" />
                <h3 className="font-semibold text-navy">{branch.name}</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-bold text-navy">{formatCurrency(branch.totalRevenue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span className="font-medium text-navy">{branch.orderCount}</span></div>
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-green-600">Cash</span><span className="font-medium text-navy">{formatCurrency(branch.cashTotal)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-blue-600">Card</span><span className="font-medium text-navy">{formatCurrency(branch.cardTotal)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-purple-600">Other</span><span className="font-medium text-navy">{formatCurrency(branch.otherTotal)}</span></div>
                </div>
              </div>
            </div>
          ))}
          {(!Array.isArray(data.branches) || data.branches.length === 0) && <div className="col-span-full text-center text-muted-foreground text-sm py-8">No data for this period</div>}
        </div>
      )}
    </div>
  )
}

function ExpensesTab({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [branchFilter, setBranchFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [branches, setBranches] = useState<any[]>([])
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  useEffect(() => {
    fetch('/api/admin/accounting/branches?period=year')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setBranches(d.branches || []))
      .catch(() => {})
  }, [])

  function fetchExpenses() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('period', period)
    if (branchFilter) params.set('branchId', branchFilter)
    if (period === 'custom' && customStart && customEnd) {
      params.set('customStart', customStart)
      params.set('customEnd', customEnd)
    }
    fetch(`/api/admin/accounting/expenses?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load expenses'); setLoading(false) })
  }

  useEffect(() => { fetchExpenses() }, [period, branchFilter, customStart, customEnd, refreshKey])

  async function handleDeleteExpense(id: string) {
    try {
      const res = await fetch(`/api/admin/accounting/expenses?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Expense deleted'); fetchExpenses(); setDeleteConfirm(null) }
      else toast.error('Failed to delete')
    } catch { toast.error('Failed to delete') }
  }

  const maxMethod = Math.max(...Object.values(data?.byMethod || {}) as number[], 1)

  const methodColor: Record<string, string> = {
    cash: 'bg-green-500', card: 'bg-blue-500', bank_transfer: 'bg-amber-500',
    instapay: 'bg-cyan-500', wallet: 'bg-pink-500',
  }
  const methodLabel: Record<string, string> = {
    cash: 'Cash', card: 'Card', bank_transfer: 'Bank Transfer',
    instapay: 'InstaPay', wallet: 'Wallet',
  }

  function handleExportCSV() {
    if (!data?.expenses) return
    const rows = data.expenses.map((e: any) => ({
      Date: new Date(e.createdAt).toLocaleDateString(),
      Description: e.description,
      Amount: e.amount,
      'Payment Method': methodLabel[e.paymentMethod] || e.paymentMethod,
      Branch: e.branch?.name || '-',
      Supplier: e.supplier?.name || '-',
      Invoice: e.invoiceNumber || '-',
    }))
    exportCSVRows(rows, `expenses-${period}.csv`)
  }

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        {(['day', 'week', 'month', 'year', 'custom'] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="px-2 py-1.5 border border-border rounded-lg text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="px-2 py-1.5 border border-border rounded-lg text-xs" />
          </div>
        )}
        <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm ml-auto">
          <option value="">All Branches</option>
          {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button onClick={() => setShowModal(true)} className="px-4 py-1.5 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add Expense
        </button>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : !data ? (
        <div className="text-muted-foreground text-sm">No data</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalExpenses)}</p>
            </div>
            <div className="bg-white rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Count</p>
              <p className="text-2xl font-bold text-navy">{data.count}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-navy mb-4">Payment Method Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(data.byMethod || {}).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expenses</p>
                ) : (
                  Object.entries(data.byMethod || {}).map(([method, amount]) => (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{methodLabel[method] || method}</span>
                        <span className="font-medium text-navy">{formatCurrency(amount as number)}</span>
                      </div>
                      <MiniBar value={amount as number} max={maxMethod} color={methodColor[method] || 'bg-gray-500'} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Description</th>
                  <th className="p-3 font-medium text-right">Amount</th>
                  <th className="p-3 font-medium">Payment Method</th>
                  <th className="p-3 font-medium">Branch</th>
                  <th className="p-3 font-medium">Supplier</th>
                  <th className="p-3 font-medium">Invoice #</th>
                  <th className="p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!Array.isArray(data.expenses) || data.expenses.length === 0) && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No expenses found</td></tr>}
                {Array.isArray(data.expenses) && data.expenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 text-muted-foreground text-xs">{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-medium text-navy">{exp.description}</td>
                    <td className="p-3 text-right font-medium text-orange-600">{formatCurrency(exp.amount)}</td>
                    <td className="p-3 text-muted-foreground">{methodLabel[exp.paymentMethod] || exp.paymentMethod}</td>
                    <td className="p-3 text-muted-foreground">{exp.branch?.name || '-'}</td>
                    <td className="p-3 text-muted-foreground">{exp.supplier?.name || '-'}</td>
                    <td className="p-3 text-muted-foreground">{exp.invoiceNumber || '-'}</td>
                    <td className="p-3">
                      {deleteConfirm === exp.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleDeleteExpense(exp.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">Confirm</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(exp.id)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <AddExpenseModal
            onClose={() => setShowModal(false)}
            onSaved={() => { fetchExpenses(); setShowModal(false) }}
            branches={branches}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function AddExpenseModal({ onClose, onSaved, branches }: { onClose: () => void; onSaved: () => void; branches: any[] }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [branchId, setBranchId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/accounting/suppliers')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => setSuppliers(d.suppliers || []))
      .catch(() => {})
  }, [])

  async function handleSave() {
    if (!amount || !description || !paymentMethod) {
      toast.error('Amount, description, and payment method required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, description, paymentMethod, branchId: branchId || null, supplierId: supplierName || null, invoiceNumber: invoiceNumber || null, notes: notes || null }),
      })
      if (res.ok) { toast.success('Expense added'); onSaved() }
      else { const d = await res.json(); toast.error(d.error || 'Failed') }
    } catch { toast.error('Failed to add expense') }
    finally { setSaving(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Add Expense</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded"><X className="h-5 w-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Amount *</label>
            <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description *</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this expense for?" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Method *</label>
            <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="instapay">InstaPay</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Branch</label>
            <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">None</option>
              {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Supplier</label>
            <select value={supplierName} onChange={e => setSupplierName(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg text-sm">
              <option value="">None</option>
              {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Invoice Number</label>
            <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Optional" className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" rows={2} className="w-full px-3 py-2 border border-border rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-navy transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Expense'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}


