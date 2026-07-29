'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './format'

const typeColors: Record<string, string> = {
  asset: 'text-green-600', liability: 'text-blue-600',
  equity: 'text-purple-600', income: 'text-emerald-600', expense: 'text-orange-600',
}

const TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    params.set('page', String(page))
    params.set('limit', String(limit))
    fetch(`/api/admin/accounting/accounts?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setAccounts(d.accounts || []); setTotal(d.total); setTotalPages(d.totalPages); setLoading(false) })
      .catch(() => { toast.error('Failed to load accounts'); setLoading(false) })
  }, [typeFilter, page])

  const grouped = accounts.reduce((acc: any, a: any) => {
    if (!acc[a.type]) acc[a.type] = []
    acc[a.type].push(a)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setTypeFilter(''); setPage(1) }}
          className={`px-3 py-1 text-xs font-medium rounded-lg border ${!typeFilter ? 'bg-navy text-white border-navy' : 'bg-white border-border hover:bg-gray-50'}`}
        >All</button>
        {TYPES.map(t => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1) }}
            className={`px-3 py-1 text-xs font-medium rounded-lg border capitalize ${typeFilter === t ? 'bg-navy text-white border-navy' : 'bg-white border-border hover:bg-gray-50'}`}
          >{t}s</button>
        ))}
      </div>

      <div className="space-y-6">
        {(typeFilter ? [typeFilter] : TYPES).map(type => (
          <div key={type} className="bg-white rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-border">
              <h3 className="font-semibold text-navy capitalize">{type}s</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border">
                  <th className="p-3 font-medium">Code</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[type] || []).map((acc: any) => (
                  <tr key={acc.id} className="border-b border-border/50 hover:bg-gray-50">
                    <td className="p-3 text-xs font-mono text-muted-foreground">{acc.code}</td>
                    <td className="p-3 font-medium text-navy">{acc.name}</td>
                    <td className={`p-3 text-right font-semibold ${typeColors[type]}`}>
                      {acc.balance >= 0 ? formatCurrency(acc.balance) : `(${formatCurrency(Math.abs(acc.balance))})`}
                    </td>
                  </tr>
                ))}
                {(grouped[type] || []).length === 0 && (
                  <tr><td colSpan={3} className="p-4 text-center text-muted-foreground">No accounts</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} total accounts</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-2 py-1 rounded text-xs border border-border hover:bg-gray-50 disabled:opacity-30"
          >Prev</button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 5, totalPages - 9))
            const p = start + i
            if (p > totalPages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                className={`px-2 py-1 rounded text-xs ${page === p ? 'bg-navy text-white' : 'border border-border hover:bg-gray-50'}`}
              >{p}</button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-2 py-1 rounded text-xs border border-border hover:bg-gray-50 disabled:opacity-30"
          >Next</button>
        </div>
      </div>
    </div>
  )
}
