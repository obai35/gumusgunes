'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, BarChart3, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart, Area } from 'recharts'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type FpnaTabType = 'budget-vs-actual' | 'monthly' | 'projections' | 'kpi'

export default function FpnaTab() {
  const { ta, fmtCurrency } = useAdminTranslate()
  const [tab, setTab] = useState<FpnaTabType>('budget-vs-actual')
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (tab) {
        case 'budget-vs-actual':
          endpoint = `/api/admin/accounting/fpna/budget-vs-actual?year=${year}`
          break
        case 'monthly':
          endpoint = `/api/admin/accounting/fpna/monthly?year=${year}`
          break
        case 'projections':
          endpoint = `/api/admin/accounting/fpna/projections?baseYear=${year}`
          break
        case 'kpi':
          endpoint = `/api/admin/accounting/fpna/kpi?year=${year}`
          break
      }
      const res = await fetch(endpoint)
      const json = await res.json()
      setData(json)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [tab, year])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tabs: { key: FpnaTabType; label: string; icon: React.ReactNode }[] = [
    { key: 'budget-vs-actual', label: ta('Budget vs Actual'), icon: <Target className="h-4 w-4" /> },
    { key: 'monthly', label: ta('Monthly Trend'), icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'projections', label: ta('Financial Projections'), icon: <TrendingUp className="h-4 w-4" /> },
    { key: 'kpi', label: ta('KPI Dashboard'), icon: <DollarSign className="h-4 w-4" /> },
  ]

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>{ta('Financial Planning & Analysis')}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <Button variant="outline" size="icon" onClick={fetchData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>{ta('Budget variance, financial projections, and key performance indicators')}</CardDescription>
          <div className="flex gap-1 mt-2 flex-wrap">
            {tabs.map(t => (
              <Button
                key={t.key}
                variant={tab === t.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1"
              >
                {t.icon}
                {t.label}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <>
              {tab === 'budget-vs-actual' && data && (
                <BudgetVsActualView data={data} formatCurrency={fmtCurrency} />
              )}
              {tab === 'monthly' && data && (
                <MonthlyView data={data} formatCurrency={fmtCurrency} />
              )}
              {tab === 'projections' && data && (
                <ProjectionsView data={data} formatCurrency={fmtCurrency} />
              )}
              {tab === 'kpi' && data && (
                <KpiView data={data} formatCurrency={fmtCurrency} />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function BudgetVsActualView({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  const { ta } = useAdminTranslate()
  if (!data.items || data.items.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{ta('No budget data found for this year. Add budgets first.')}</div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Total Budgeted')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-600">{formatCurrency(data.totalBudgeted)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Total Actual')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalActual)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Variance')}</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.totalVariance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.items}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="accountName" angle={-45} textAnchor="end" height={80} interval={0} fontSize={10} />
          <YAxis />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="budgeted" name={ta('Budgeted')} fill="#3b82f6" />
          <Bar dataKey="actual" name={ta('Actual')} fill="#22c55e" />
        </BarChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">{ta('Account')}</th>
              <th className="text-right py-2 px-2">{ta('Budgeted')}</th>
              <th className="text-right py-2 px-2">{ta('Actual')}</th>
              <th className="text-right py-2 px-2">{ta('Variance')}</th>
              <th className="text-right py-2 px-2">{ta('%')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: any) => (
              <tr key={item.accountCode} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{item.accountName} <span className="text-muted-foreground">({item.accountCode})</span></td>
                <td className="text-right py-2 px-2">{formatCurrency(item.budgeted)}</td>
                <td className="text-right py-2 px-2">{formatCurrency(item.actual)}</td>
                <td className={`text-right py-2 px-2 ${item.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(item.variance)}
                </td>
                <td className={`text-right py-2 px-2 ${item.variancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.variancePct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MonthlyView({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  const { ta } = useAdminTranslate()
  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-center py-12 text-muted-foreground">{ta('No monthly data available.')}</div>
  }

  const chartData = data.map((d: any) => ({
    month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.month - 1],
    Budgeted: d.budgeted,
    Actual: d.actual,
    Variance: d.variance,
  }))

  return (
    <div className="space-y-6">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="Budgeted" fill="#3b82f6" opacity={0.7} />
          <Bar dataKey="Actual" fill="#22c55e" opacity={0.7} />
          <Line dataKey="Variance" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">{ta('Month')}</th>
              <th className="text-right py-2 px-2">{ta('Budgeted')}</th>
              <th className="text-right py-2 px-2">{ta('Actual')}</th>
              <th className="text-right py-2 px-2">{ta('Variance')}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d: any) => (
              <tr key={d.month} className="border-b hover:bg-muted/50">
                <td className="py-2 px-2">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.month - 1]}</td>
                <td className="text-right py-2 px-2">{formatCurrency(d.budgeted)}</td>
                <td className="text-right py-2 px-2">{formatCurrency(d.actual)}</td>
                <td className={`text-right py-2 px-2 ${d.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(d.variance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProjectionsView({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  const { ta } = useAdminTranslate()
  if (!data) return null

  const chartData = [
    ...data.historicalData.map((d: any) => ({ year: d.year.toString(), Revenue: d.revenue, Expenses: d.expenses, type: 'Historical' })),
    ...data.projections.map((d: any) => ({ year: d.year.toString(), Revenue: d.projectedRevenue, Expenses: d.projectedExpenses, type: 'Projected' })),
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Last Year Revenue')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(data.historicalData[data.historicalData.length - 1]?.revenue || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Revenue Trend')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              {data.trends.revenue.slope >= 0 ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-600" />}
              <span className="text-lg font-bold">{(data.trends.revenue.growthRate * 100).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('R² Confidence')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{data.trends.revenue.r2 !== undefined ? data.trends.revenue.r2.toFixed(2) : 'N/A'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Projection Years')}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{data.projections.length}</p>
          </CardContent>
        </Card>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Legend />
          <Bar dataKey="Revenue" fill="#22c55e" opacity={0.7} />
          <Bar dataKey="Expenses" fill="#ef4444" opacity={0.7} />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 px-2">{ta('Year')}</th>
              <th className="text-right py-2 px-2">{ta('Projected Revenue')}</th>
              <th className="text-right py-2 px-2">{ta('Projected Expenses')}</th>
              <th className="text-right py-2 px-2">{ta('Projected Profit')}</th>
              <th className="text-right py-2 px-2">{ta('Margin')}</th>
            </tr>
          </thead>
          <tbody>
            {data.projections.map((p: any) => {
              const margin = p.projectedRevenue !== 0 ? (p.projectedProfit / p.projectedRevenue) * 100 : 0
              return (
                <tr key={p.year} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2 font-medium">{p.year}</td>
                  <td className="text-right py-2 px-2 text-green-600">{formatCurrency(p.projectedRevenue)}</td>
                  <td className="text-right py-2 px-2 text-red-600">{formatCurrency(p.projectedExpenses)}</td>
                  <td className={`text-right py-2 px-2 ${p.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(p.projectedProfit)}
                  </td>
                  <td className="text-right py-2 px-2">{margin.toFixed(1)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function KpiView({ data, formatCurrency }: { data: any; formatCurrency: (v: number) => string }) {
  const { ta } = useAdminTranslate()
  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Revenue')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalRevenue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Net Profit')}</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netProfit)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Profit Margin')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.profitMargin.toFixed(1)}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Expense Ratio')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{data.expenseRatio.toFixed(1)}%</p></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Total Assets')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(data.totalAssets)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Total Liabilities')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalLiabilities)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Current Ratio')}</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${data.currentRatio >= 1.5 ? 'text-green-600' : 'text-red-600'}`}>
              {data.currentRatio.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{ta('Budget Utilization')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{data.budgetUtilization.toFixed(1)}%</p></CardContent>
        </Card>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={[
          { metric: ta('Revenue'), value: data.totalRevenue },
          { metric: ta('Expenses'), value: data.totalExpenses },
          { metric: ta('Profit'), value: data.netProfit },
          { metric: ta('Assets'), value: data.totalAssets },
          { metric: ta('Liabilities'), value: data.totalLiabilities },
        ]}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="metric" />
          <YAxis />
          <Tooltip formatter={(v: number) => formatCurrency(v)} />
          <Bar dataKey="value" fill="#3b82f6">
            {data && [
              <rect key="r" />,
              <rect key="e" />,
              <rect key="p" />,
              <rect key="a" />,
              <rect key="l" />,
            ]}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
