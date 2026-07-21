'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Package, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency } from './format'

export default function InventoryValuationTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState('weighted')

  function fetchValuation() {
    setLoading(true)
    fetch(`/api/admin/accounting/inventory-valuation?date=${date}&method=${method}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load inventory valuation'); setLoading(false) })
  }

  useEffect(() => { fetchValuation() }, [date, method])

  if (loading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <select value={method} onChange={e => setMethod(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm">
          <option value="weighted">Weighted Average</option>
          <option value="fifo">FIFO</option>
        </select>
        <button onClick={() => {
          const csv = ['SKU,Name,Quantity,UnitCost,TotalValue'].join(',') + '\n' + data.items.map((i: any) => `"${i.sku}","${i.name}",${i.quantity},${i.unitCost},${i.totalValue}`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'inventory-valuation.csv'; a.click()
        }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><Package className="h-4 w-4 text-blue-600" /><p className="text-xs text-muted-foreground">Total Products</p></div>
          <p className="text-2xl font-bold text-navy">{data.totalProducts}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><DollarSign className="h-4 w-4 text-green-600" /><p className="text-xs text-muted-foreground">Total Value</p></div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalValue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-purple-600" /><p className="text-xs text-muted-foreground">Total COGS</p></div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.totalCOGS)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-600" /><p className="text-xs text-muted-foreground">Gross Margin</p></div>
          <p className={`text-2xl font-bold ${data.grossMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{data.grossMargin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border">
          <h3 className="font-semibold text-navy">Inventory Items</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white"><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">SKU</th><th className="p-3 font-medium">Name</th><th className="p-3 font-medium text-right">Qty</th><th className="p-3 font-medium text-right">Unit Cost</th><th className="p-3 font-medium text-right">Total Value</th></tr></thead>
            <tbody>
              {data.items.map((item: any) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="p-3 font-medium text-navy">{item.name}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">{formatCurrency(item.unitCost)}</td>
                  <td className="p-3 text-right font-semibold">{formatCurrency(item.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
