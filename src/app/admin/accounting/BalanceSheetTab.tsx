'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Scale, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from './format'
import { generatePdf } from '@/lib/pdf-export'

export default function BalanceSheetTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  function fetchBS() {
    setLoading(true)
    fetch(`/api/admin/accounting/balance-sheet?date=${date}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load balance sheet'); setLoading(false) })
  }

  useEffect(() => { fetchBS() }, [date])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  const sectionColors: Record<string, { text: string; bg: string; label: string }> = {
    asset: { text: 'text-green-600', bg: 'bg-green-50', label: 'Assets' },
    liability: { text: 'text-blue-600', bg: 'bg-blue-50', label: 'Liabilities' },
    equity: { text: 'text-purple-600', bg: 'bg-purple-50', label: 'Equity' },
  }

  function handleExportCSV() {
    const rows: Record<string, any>[] = []
    for (const [type, items] of Object.entries(data.groups || {})) {
      for (const item of items as any[]) {
        rows.push({ Type: sectionColors[type]?.label || type, Account: item.name, Balance: item.balance })
      }
    }
    rows.push({ Type: '', Account: 'Total Assets', Balance: data.totalAssets })
    rows.push({ Type: '', Account: 'Total Liabilities', Balance: data.totalLiabilities })
    rows.push({ Type: '', Account: 'Total Equity', Balance: data.totalEquity })
    const csv = ['Type,Account,Balance', ...rows.map(r => `"${r.Type}","${r.Account}",${r.Balance}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'balance-sheet.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of date:</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
        <button
          onClick={() => {
            const rows = [['Type', 'Account', 'Balance']]
            for (const [type, items] of Object.entries(data.groups || {})) {
              for (const item of items as any[]) {
                rows.push([sectionColors[type]?.label || type, item.name, String(item.balance)])
              }
            }
            rows.push(['', 'Total Assets', String(data.totalAssets)])
            rows.push(['', 'Total Liabilities', String(data.totalLiabilities)])
            rows.push(['', 'Total Equity', String(data.totalEquity)])
            const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
            const blob = new Blob([csv], { type: 'application/vnd.ms-excel' })
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'balance-sheet.xls'; a.click()
          }}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> Excel
        </button>
        <button
          onClick={async () => {
            const rows: (string | number)[][] = []
            for (const [type, items] of Object.entries(data.groups || {})) {
              for (const item of items as any[]) {
                rows.push([type.charAt(0).toUpperCase() + type.slice(1), item.name, formatCurrency(item.balance)])
              }
            }
            await generatePdf({
              title: 'Balance Sheet',
              subtitle: `As of ${new Date(data.asOfDate).toLocaleDateString()}`,
              columns: ['Type', 'Account', 'Balance'],
              rows,
              footers: [
                { label: 'Total Assets', value: formatCurrency(data.totalAssets) },
                { label: 'Total Liabilities', value: formatCurrency(data.totalLiabilities) },
                { label: 'Total Equity', value: formatCurrency(data.totalEquity) },
              ],
            })
          }}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> PDF
        </button>
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${data.balanced ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {data.balanced ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {data.balanced ? 'Balanced' : 'Out of Balance'}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Object.entries(sectionColors).map(([type, cfg]) => (
          <div key={type} className={`${cfg.bg} rounded-xl border border-border p-4`}>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{cfg.label}</p>
            <p className={`text-2xl font-bold ${cfg.text}`}>
              {type === 'asset' ? formatCurrency(data.totalAssets) : type === 'liability' ? formatCurrency(data.totalLiabilities) : formatCurrency(data.totalEquity)}
            </p>
          </div>
        ))}
      </div>

      {Object.entries(sectionColors).map(([type, cfg]) => {
        const items = data.groups?.[type] || []
        return (
          <div key={type} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className={`px-4 py-3 ${cfg.bg}`}>
              <h3 className="font-semibold text-navy">{cfg.label}</h3>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">Account</th><th className="p-3 font-medium text-right">Balance</th></tr></thead>
              <tbody>
                {items.length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">No accounts</td></tr>}
                {items.map((item: any) => (
                  <tr key={item.code} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-navy">{item.name}</td>
                    <td className={`p-3 text-right font-semibold ${cfg.text}`}>{formatCurrency(item.balance)}</td>
                  </tr>
                ))}
                <tr className={`${cfg.bg} font-semibold border-t-2 border-border`}>
                  <td className="p-3 text-navy">Total {cfg.label}</td>
                  <td className={`p-3 text-right ${cfg.text}`}>
                    {formatCurrency(type === 'asset' ? data.totalAssets : type === 'liability' ? data.totalLiabilities : data.totalEquity)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      })}

      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 opacity-80" />
          <div>
            <p className="text-sm opacity-80">Accounting Equation</p>
            <p className="text-lg font-bold mt-1">Assets = Liabilities + Equity</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-mono opacity-90">{formatCurrency(data.totalAssets)} = {formatCurrency(data.totalLiabilities)} + {formatCurrency(data.totalEquity)}</p>
            <p className={`text-xs mt-1 font-medium ${data.balanced ? 'text-green-300' : 'text-red-300'}`}>
              {data.balanced ? '✓ Balanced' : '✗ Out of balance by ' + formatCurrency(Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)))}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
