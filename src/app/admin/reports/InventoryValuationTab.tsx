'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { ExportButton } from '@/components/admin/ExportButton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { Warehouse, AlertTriangle, DollarSign, Package } from 'lucide-react'

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899']

export default function InventoryValuationTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [slowDays, setSlowDays] = useState(90)
  const [view, setView] = useState<'all' | 'slow'>('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports/inventory-valuation?slowDays=${slowDays}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load inventory')); setLoading(false) })
  }, [slowDays])

  if (loading) return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-muted-foreground text-sm">{ta('No data')}</div>

  const items = view === 'slow' ? data.slowMoving : data.items
  const pieData = [
    { name: ta('Retail Value'), value: data.summary.totalRetailValue },
    { name: ta('Cost Value'), value: data.summary.totalCostValue },
    { name: ta('Potential Profit'), value: data.summary.totalPotentialProfit },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView('all')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === 'all' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('All Items')}
          </button>
          <button onClick={() => setView('slow')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === 'slow' ? 'bg-white text-navy shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            {ta('Slow Moving')} ({fmtNum(data.summary.slowMovingCount)})
          </button>
        </div>
        <label className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {ta('Slow after')}
          <select value={slowDays} onChange={e => setSlowDays(parseInt(e.target.value))}
            className="px-2 py-1 border border-border rounded text-xs">
            <option value={30}>{ta('30 days')}</option>
            <option value={60}>{ta('60 days')}</option>
            <option value={90}>{ta('90 days')}</option>
            <option value={180}>{ta('180 days')}</option>
          </select>
        </label>
        <ExportButton
          filename={`inventory-valuation-${view}`}
          columns={[
            { header: ta('Product'), key: 'productName' },
            { header: ta('SKU'), key: 'sku' },
            { header: ta('Category'), key: 'category' },
            { header: ta('Stock'), key: 'totalStock' },
            { header: ta('Retail Value'), key: 'retailValue' },
            { header: ta('Cost Value'), key: 'costValue' },
            { header: ta('Potential Profit'), key: 'potentialProfit' },
            { header: ta('Last Sold'), key: 'lastSoldDate' },
            { header: ta('Days Since Sale'), key: 'daysSinceLastSale' },
          ]}
          data={items}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-navy" /><p className="text-xs text-muted-foreground uppercase tracking-wide">{ta('Total Products')}</p></div>
          <p className="text-xl font-bold text-navy">{fmtNum(data.summary.totalProducts)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><Warehouse className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">{ta('Total Stock')}</p></div>
          <p className="text-xl font-bold text-blue-600">{fmtNum(data.summary.totalStock)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">{ta('Retail Value')}</p></div>
          <p className="text-xl font-bold text-green-600">{fmtCurrency(data.summary.totalRetailValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-orange-600" /><p className="text-xs text-muted-foreground uppercase tracking-wide">{ta('At Cost')}</p></div>
          <p className="text-xl font-bold text-orange-600">{fmtCurrency(data.summary.totalCostValue)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">{ta('Inventory Value Breakdown')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value }) => `${name}: ${fmtCurrency(value)}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-navy mb-4">{ta('Top 10 by Value')}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.items.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 9 }} width={120} />
              <Tooltip formatter={(v: number) => fmtCurrency(v)} />
              <Bar dataKey="retailValue" fill="#10b981" radius={[0, 4, 4, 0]} name={ta('Retail Value')} />
              <Bar dataKey="costValue" fill="#f59e0b" radius={[0, 4, 4, 0]} name={ta('Cost Value')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="p-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-navy">{ta(view === 'slow' ? 'Slow-Moving Items' : 'All Inventory')}</h3>
          <span className="text-xs text-muted-foreground">{fmtNum(items.length)} {ta('items')}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Product')}</th>
              <th className="p-3 font-medium">{ta('SKU')}</th>
              <th className="p-3 font-medium">{ta('Category')}</th>
              <th className="p-3 font-medium text-right">{ta('Stock')}</th>
              <th className="p-3 font-medium text-right">{ta('Retail Value')}</th>
              <th className="p-3 font-medium text-right">{ta('Cost Value')}</th>
              <th className="p-3 font-medium text-right">{ta('Potential Profit')}</th>
              <th className="p-3 font-medium text-right">{ta('Last Sold')}</th>
              <th className="p-3 font-medium text-right">{ta('Days')}</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 100).map((i: any) => (
              <tr key={i.productId} className={`border-b border-border/50 hover:bg-gray-50 ${i.isSlowMoving ? 'bg-red-50/30' : ''}`}>
                <td className="p-3 font-medium text-navy max-w-[200px] truncate">{i.productName}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground">{i.sku}</td>
                <td className="p-3 text-muted-foreground">{i.category}</td>
                <td className="p-3 text-right font-medium text-navy">{fmtNum(i.totalStock)}</td>
                <td className="p-3 text-right text-green-600">{fmtCurrency(i.retailValue)}</td>
                <td className="p-3 text-right text-orange-600">{fmtCurrency(i.costValue)}</td>
                <td className="p-3 text-right font-medium text-navy">{fmtCurrency(i.potentialProfit)}</td>
                <td className="p-3 text-right text-muted-foreground">{i.lastSoldDate ? fmtDate(i.lastSoldDate) : '-'}</td>
                <td className={`p-3 text-right font-medium ${i.isSlowMoving ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {i.daysSinceLastSale != null ? `${i.daysSinceLastSale}d` : '-'}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-muted-foreground">{ta('No items found')}</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
