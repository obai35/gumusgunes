'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './page'

export default function JournalTab() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')

  function fetchJournal() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (typeFilter) params.set('type', typeFilter)
    fetch(`/api/admin/accounting/journal?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error('Failed to load journal'); setLoading(false) })
  }

  useEffect(() => { fetchJournal() }, [page, typeFilter])

  const typeColors: Record<string, string> = {
    sale: 'bg-green-100 text-green-700',
    refund: 'bg-red-100 text-red-700',
    expense: 'bg-orange-100 text-orange-700',
    reconciliation: 'bg-blue-100 text-blue-700',
    opening: 'bg-purple-100 text-purple-700',
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All Types</option>
          <option value="sale">Sales</option>
          <option value="refund">Refunds</option>
          <option value="expense">Expenses</option>
          <option value="reconciliation">Reconciliations</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Description</th>
                <th className="p-3 font-medium">Reference</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Account</th>
                <th className="p-3 font-medium text-right">Debit</th>
                <th className="p-3 font-medium text-right">Credit</th>
              </tr>
            </thead>
            <tbody>
              {(!data?.entries || data.entries.length === 0) && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No journal entries yet</td></tr>
              )}
              {data?.entries?.map((entry: any) => (
                entry.lines.map((line: any, i: number) => (
                  <tr key={`${entry.id}-${i}`} className="border-b border-border/50 hover:bg-gray-50">
                    {i === 0 && (
                      <>
                        <td className="p-3 text-xs text-muted-foreground" rowSpan={entry.lines.length}>
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-medium text-navy" rowSpan={entry.lines.length}>
                          {entry.description}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground font-mono" rowSpan={entry.lines.length}>
                          {entry.reference ? `#${entry.reference.slice(0, 8)}` : '-'}
                        </td>
                        <td className="p-3" rowSpan={entry.lines.length}>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[entry.type] || ''}`}>{entry.type}</span>
                        </td>
                      </>
                    )}
                    <td className="p-3 text-muted-foreground">{line.account?.name || line.accountId}</td>
                    <td className="p-3 text-right font-medium text-green-600">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                    <td className="p-3 text-right font-medium text-red-600">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
