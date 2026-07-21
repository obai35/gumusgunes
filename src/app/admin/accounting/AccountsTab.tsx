'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from './format'

const typeColors: Record<string, string> = {
  asset: 'text-green-600', liability: 'text-blue-600',
  equity: 'text-purple-600', income: 'text-emerald-600', expense: 'text-orange-600',
}

export default function AccountsTab() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/accounting/accounts')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setAccounts(d.accounts || []); setLoading(false) })
      .catch(() => { toast.error('Failed to load accounts'); setLoading(false) })
  }, [])

  const grouped = accounts.reduce((acc: any, a: any) => {
    if (!acc[a.type]) acc[a.type] = []
    acc[a.type].push(a)
    return acc
  }, {} as Record<string, any[]>)

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>

  return (
    <div className="space-y-6">
      {['asset', 'liability', 'equity', 'income', 'expense'].map(type => (
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
  )
}
