'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

export default function CashFlowTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ operating: true, investing: false, financing: false })
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()

  function fetchCF() {
    setLoading(true)
    fetch(`/api/admin/accounting/cash-flow?period=${period}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load cash flow')); setLoading(false) })
  }

  useEffect(() => { fetchCF() }, [period])

  if (loading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">{ta('No data')}</div>

  const sections = [
    { key: 'operating', label: ta('Operating Activities'), color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'investing', label: ta('Investing Activities'), color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'financing', label: ta('Financing Activities'), color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap items-center">
        {['day', 'week', 'month', 'year'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${period === p ? 'bg-navy text-silver border-navy' : 'bg-white text-muted-foreground border-border hover:text-navy'}`}>
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        <button onClick={() => {
          const rows = [[ta('Section'), ta('Label'), ta('Amount')]]
          for (const s of sections) {
            for (const item of data[s.key]?.items || []) {
              rows.push([s.label, item.label, String(item.amount)])
            }
            rows.push([s.label, ta(`Net ${s.label}`), String(data[s.key]?.netOperating || data[s.key]?.netInvesting || data[s.key]?.netFinancing || 0)])
          }
          rows.push([ta('Summary'), ta('Net Cash Flow'), String(data.netCashFlow)])
          const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `cash-flow-${period}.csv`; a.click()
        }} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Download className="h-4 w-4" /> {ta('CSV')}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Opening Cash')}</p>
          <p className="text-xl font-bold text-navy">{fmtCurrency(data.openingCash)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Net Cash Flow')}</p>
          <p className={`text-xl font-bold ${data.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtCurrency(data.netCashFlow)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Closing Cash')}</p>
          <p className="text-xl font-bold text-navy">{fmtCurrency(data.closingCash)}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{ta('Operating Cash Flow')}</p>
          <p className={`text-xl font-bold ${data.operating?.netOperating >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtCurrency(data.operating?.netOperating || 0)}</p>
        </div>
      </div>

      {sections.map(({ key, label, color, bg }) => {
        const section = data[key]
        if (!section) return null
        const isExpanded = expanded[key]
        const net = section.netOperating ?? section.netInvesting ?? section.netFinancing ?? 0
        return (
          <div key={key} className="bg-white rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(prev => ({ ...prev, [key]: !prev[key] }))} className={`w-full px-4 py-3 ${bg} flex items-center justify-between hover:opacity-80 transition-opacity`}>
              <div className="flex items-center gap-2">
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <h3 className="font-semibold text-navy">{label}</h3>
              </div>
              <span className={`text-sm font-medium ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtCurrency(net)}</span>
            </button>
            {isExpanded && (
              <table className="w-full text-sm">
                <thead><tr className="text-left text-muted-foreground border-b border-border"><th className="p-3 font-medium">{ta('Description')}</th><th className="p-3 font-medium text-right">{ta('Amount')}</th></tr></thead>
                <tbody>
                  {(section.items || []).length === 0 && <tr><td colSpan={2} className="p-4 text-center text-muted-foreground">{ta('No transactions')}</td></tr>}
                  {(section.items || []).map((item: any, i: number) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-gray-50">
                      <td className="p-3 text-navy">{item.label}</td>
                      <td className={`p-3 text-right font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  <tr className={`${bg} font-semibold border-t-2 border-border`}>
                    <td className="p-3 text-navy">{ta(`Net ${label}`)}</td>
                    <td className={`p-3 text-right ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmtCurrency(net)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )
      })}
    </div>
  )
}
