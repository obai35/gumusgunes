'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Download, Clock, AlertTriangle } from 'lucide-react'
import { formatCurrency } from './format'

const bucketColors: Record<string, string> = {
  '0-30': 'bg-green-100 text-green-700 border-green-200',
  '31-60': 'bg-amber-100 text-amber-700 border-amber-200',
  '61-90': 'bg-orange-100 text-orange-700 border-orange-200',
  '90+': 'bg-red-100 text-red-700 border-red-200',
}

function BucketTable({ title, buckets, total, type }: { title: string; buckets: Record<string, { count: number; total: number; orders?: any[]; items?: any[] }>; total: number; type: 'ar' | 'ap' }) {
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <div className={`px-4 py-3 ${type === 'ar' ? 'bg-blue-50' : 'bg-amber-50'} border-b border-border`}>
        <h3 className="font-semibold text-navy">{title}</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="p-3 font-medium">Bucket</th>
            <th className="p-3 font-medium text-right">Count</th>
            <th className="p-3 font-medium text-right">Total</th>
            <th className="p-3 font-medium">Sample Items</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(buckets).map(([bucket, data]) => (
            <tr key={bucket} className="border-b border-border/50 hover:bg-gray-50">
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${bucketColors[bucket] || ''}`}>
                  {bucket} days
                </span>
              </td>
              <td className="p-3 text-right font-medium text-navy">{data.count}</td>
              <td className={`p-3 text-right font-semibold ${bucket === '90+' ? 'text-red-600' : 'text-navy'}`}>{formatCurrency(data.total)}</td>
              <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">
                {data.orders?.slice(0, 3).map((o: any) => `#${o.receiptNumber || o.orderNumber?.slice(0, 8)} (${o.days}d)`).join(', ') ||
                 data.items?.slice(0, 3).map((i: any) => `${i.description?.slice(0, 20)} (${i.days}d)`).join(', ') || '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold border-t-2 border-border">
            <td className="p-3 text-navy">Total {type === 'ar' ? 'AR' : 'AP'}</td>
            <td className="p-3 text-right">{Object.values(buckets).reduce((s, b) => s + b.count, 0)}</td>
            <td className="p-3 text-right text-navy">{formatCurrency(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export default function AgingTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))

  function fetchAging() {
    setLoading(true)
    fetch(`/api/admin/accounting/aging?asOf=${asOf}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load aging'); setLoading(false) })
  }

  useEffect(() => { fetchAging() }, [asOf])

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
  if (!data) return <div className="text-sm text-muted-foreground">No data</div>

  function handleExportCSV() {
    const rows: Record<string, any>[] = []
    const arBuckets = data.accountsReceivable?.buckets || {}
    const apBuckets = data.accountsPayable?.buckets || {}
    for (const [bucket, bd] of Object.entries(arBuckets)) {
      rows.push({ Type: 'AR', Bucket: `${bucket} days`, Count: (bd as any).count, Total: (bd as any).total })
    }
    for (const [bucket, bd] of Object.entries(apBuckets)) {
      rows.push({ Type: 'AP', Bucket: `${bucket} days`, Count: (bd as any).count, Total: (bd as any).total })
    }
    const csv = ['Type,Bucket,Count,Total', ...rows.map(r => `"${r.Type}","${r.Bucket}",${r.Count},${r.Total}`)].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'aging-report.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">As of:</label>
          <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-3 py-1.5 border border-border rounded-lg text-sm" />
        </div>
        <button onClick={handleExportCSV} className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          As of {new Date(data.asOfDate).toLocaleDateString()}
        </div>
      </div>

      {data.accountsReceivable?.total === 0 && data.accountsPayable?.total === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <p className="text-amber-700 font-medium">No aging data available</p>
          <p className="text-sm text-amber-600 mt-1">AR/AP aging requires paid orders and AP journal entries.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <BucketTable title="Accounts Receivable" buckets={data.accountsReceivable?.buckets || {}} total={data.accountsReceivable?.total || 0} type="ar" />
          <BucketTable title="Accounts Payable" buckets={data.accountsPayable?.buckets || {}} total={data.accountsPayable?.total || 0} type="ap" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Total AR</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(data.accountsReceivable?.total || 0)}</p>
          <p className="text-xs opacity-60 mt-1">Unreconciled paid orders</p>
        </div>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl p-5 text-white">
          <p className="text-sm opacity-80">Total AP</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(data.accountsPayable?.total || 0)}</p>
          <p className="text-xs opacity-60 mt-1">Unpaid supplier amounts</p>
        </div>
      </div>
    </div>
  )
}
