'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'
import { Download } from 'lucide-react'
import { generatePdf } from '@/lib/pdf-export'

export default function TrialBalanceTab() {
  const { ta, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounting/trial-balance')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load trial balance')); setLoading(false) })
  }, [])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  const typeColors: Record<string, string> = {
    asset: 'text-green-600', liability: 'text-blue-600',
    equity: 'text-purple-600', income: 'text-emerald-600', expense: 'text-orange-600',
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={async () => {
            const rows: (string | number)[][] = data.accounts.map((acc: any) => [acc.code, acc.name, acc.type, fmtCurrency(acc.totalDebit), fmtCurrency(acc.totalCredit), fmtCurrency(acc.balance)])
            await generatePdf({
              title: ta('Trial Balance'),
              columns: [ta('Code'), ta('Account'), ta('Type'), ta('Debit'), ta('Credit'), ta('Balance')],
              rows,
              footers: [
                { label: ta('Grand Total Debit'), value: fmtCurrency(data.grandTotalDebit) },
                { label: ta('Grand Total Credit'), value: fmtCurrency(data.grandTotalCredit) },
              ],
            })
          }}
          className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1.5"
        >
          <Download className="h-4 w-4" /> {ta('Export PDF')}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
            <th className="p-3 font-medium">{ta('Code')}</th>
            <th className="p-3 font-medium">{ta('Account')}</th>
            <th className="p-3 font-medium">{ta('Type')}</th>
            <th className="p-3 font-medium text-right">{ta('Debit')}</th>
            <th className="p-3 font-medium text-right">{ta('Credit')}</th>
            <th className="p-3 font-medium text-right">{ta('Balance')}</th>
          </tr>
        </thead>
        <tbody>
          {data?.accounts?.map((acc: any) => (
            <tr key={acc.id} className="border-b border-border/50 hover:bg-gray-50">
              <td className="p-3 text-xs font-mono text-muted-foreground">{acc.code}</td>
              <td className="p-3 font-medium text-navy">{acc.name}</td>
              <td className={`p-3 text-xs font-medium capitalize ${typeColors[acc.type]}`}>{acc.type}</td>
              <td className="p-3 text-right text-green-600">{acc.totalDebit > 0 ? fmtCurrency(acc.totalDebit) : '-'}</td>
              <td className="p-3 text-right text-red-600">{acc.totalCredit > 0 ? fmtCurrency(acc.totalCredit) : '-'}</td>
              <td className={`p-3 text-right font-semibold ${typeColors[acc.type]}`}>{fmtCurrency(acc.balance)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold text-navy border-t-2 border-border">
            <td colSpan={3} className="p-3 text-right">{ta('Totals')}</td>
            <td className="p-3 text-right text-green-600">{fmtCurrency(data?.grandTotalDebit || 0)}</td>
            <td className="p-3 text-right text-red-600">{fmtCurrency(data?.grandTotalCredit || 0)}</td>
            <td className="p-3 text-right" />
          </tr>
        </tfoot>
      </table>
    </div>
    </div>
  )
}
