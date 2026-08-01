'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Filter } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  delete: 'bg-red-100 text-red-700',
  fulfill: 'bg-blue-100 text-blue-700',
  reconcile: 'bg-purple-100 text-purple-700',
  sync: 'bg-amber-100 text-amber-700',
  payment_verified: 'bg-teal-100 text-teal-700',
  payment_rejected: 'bg-orange-100 text-orange-700',
}

export default function AuditTab() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')

  function fetchAudit() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (actionFilter) params.set('action', actionFilter)
    if (resourceFilter) params.set('resource', resourceFilter)
    fetch(`/api/admin/accounting/audit?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load audit logs')); setLoading(false) })
  }

  useEffect(() => { fetchAudit() }, [page, actionFilter, resourceFilter])

  if (loading) return <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-48 w-full" /></div>

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">{ta('All Actions')}</option>
          {data?.filters?.actions?.map((a: string) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={resourceFilter} onChange={e => { setResourceFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">{ta('All Resources')}</option>
          {data?.filters?.resources?.map((r: string) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button onClick={fetchAudit} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Filter className="h-4 w-4" /> {ta('Refresh')}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gray-50 text-left text-muted-foreground">
              <th className="p-3 font-medium">{ta('Date')}</th>
              <th className="p-3 font-medium">{ta('Admin')}</th>
              <th className="p-3 font-medium">{ta('Action')}</th>
              <th className="p-3 font-medium">{ta('Resource')}</th>
              <th className="p-3 font-medium">{ta('Resource ID')}</th>
              <th className="p-3 font-medium">{ta('Details')}</th>
            </tr>
          </thead>
          <tbody>
            {(!data?.logs || data.logs.length === 0) && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">{ta('No audit logs found')}</td></tr>}
            {data?.logs?.map((log: any) => (
              <tr key={log.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="p-3 font-medium text-navy">{log.adminName || log.adminId?.slice(0, 8) || ta('System')}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>{log.action.replace(/_/g, ' ')}</span></td>
                <td className="p-3 text-muted-foreground capitalize">{log.resource}</td>
                <td className="p-3 text-xs font-mono text-muted-foreground">{log.resourceId ? log.resourceId.slice(0, 12) + '...' : '-'}</td>
                <td className="p-3 text-xs text-muted-foreground max-w-[200px] truncate">{log.details ? JSON.stringify(Object.fromEntries(Object.entries(log.details).filter(([_, v]) => typeof v !== 'object'))) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && (
          <div className="p-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border">
            <span>{data.total} {ta('total logs')}</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(data.totalPages || 1, 20) }, (_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`px-2 py-1 rounded text-xs ${page === i + 1 ? 'bg-navy text-silver' : 'hover:bg-gray-100'}`}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
