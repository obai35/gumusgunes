'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

export default function BillsTab() {
  const { ta, fmtCurrency, fmtDate } = useAdminTranslate()
  const [bills, setBills] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function fetchBills() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/bills?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setBills(d.bills || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => { toast.error(ta('Failed to load bills')); setLoading(false) })
  }

  useEffect(() => { fetchBills() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/accounting/bills/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success(ta(`Bill ${status}`)); fetchBills() }
    else toast.error(ta('Failed to update'))
  }

  async function deleteBill(id: string) {
    if (!confirm(ta('Delete this bill?'))) return
    const res = await fetch(`/api/admin/accounting/bills/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success(ta('Bill deleted')); fetchBills() }
    else toast.error(ta('Failed to delete'))
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder={ta('Search bills...')} value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchBills() }} className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">{ta('All statuses')}</option>
          <option value="pending">{ta('Pending')}</option>
          <option value="approved">{ta('Approved')}</option>
          <option value="paid">{ta('Paid')}</option>
          <option value="overdue">{ta('Overdue')}</option>
          <option value="cancelled">{ta('Cancelled')}</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> {ta('Create Bill')}
        </button>
        <button onClick={() => {
          const csv = ['Bill#,Supplier,Total,Status,Issued,Due'].join(',') + '\n' + bills.map(b => `"${b.billNumber}","${b.supplierName}",${b.total},"${b.status}","${new Date(b.issuedAt).toLocaleDateString()}","${b.dueAt ? new Date(b.dueAt).toLocaleDateString() : ''}"`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'bills.csv'; a.click()
        }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">{ta('Bill #')}</th><th className="p-3 font-medium">{ta('Supplier')}</th><th className="p-3 font-medium text-right">{ta('Total')}</th><th className="p-3 font-medium text-center">{ta('Status')}</th><th className="p-3 font-medium">{ta('Issued')}</th><th className="p-3 font-medium">{ta('Due')}</th><th className="p-3 font-medium text-center">{ta('Actions')}</th></tr></thead>
          <tbody>
            {bills.map(b => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-navy">{b.billNumber}</td>
                <td className="p-3 text-navy">{b.supplierName}</td>
                <td className="p-3 text-right font-semibold">{fmtCurrency(b.total)}</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[b.status] || 'bg-gray-100'}`}>{b.status}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{fmtDate(b.issuedAt)}</td>
                <td className="p-3 text-muted-foreground text-xs">{b.dueAt ? fmtDate(b.dueAt) : '-'}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {b.status === 'pending' && <button onClick={() => updateStatus(b.id, 'approved')} className="p-1 hover:bg-blue-50 rounded" title={ta('Approve')}><Clock className="h-3.5 w-3.5 text-blue-600" /></button>}
                    {(b.status === 'pending' || b.status === 'approved') && <button onClick={() => updateStatus(b.id, 'paid')} className="p-1 hover:bg-green-50 rounded" title={ta('Mark Paid')}><CheckCircle className="h-3.5 w-3.5 text-green-600" /></button>}
                    {b.status !== 'paid' && b.status !== 'cancelled' && <button onClick={() => updateStatus(b.id, 'cancelled')} className="p-1 hover:bg-red-50 rounded" title={ta('Cancel')}><XCircle className="h-3.5 w-3.5 text-red-600" /></button>}
                    {b.status === 'pending' && <button onClick={() => deleteBill(b.id)} className="p-1 hover:bg-red-50 rounded" title={ta('Delete')}><XCircle className="h-3.5 w-3.5 text-slate-400" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {bills.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{ta('No bills found')}</td></tr>}
          </tbody>
        </table>
      </div>

      {Math.ceil(total / 20) > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.ceil(total / 20) }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 text-sm rounded-lg ${page === i + 1 ? 'bg-navy text-silver' : 'bg-white text-muted-foreground border border-border hover:text-navy'}`}>{i + 1}</button>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-navy mb-4">{ta('Create Bill')}</h3>
            <p className="text-sm text-muted-foreground">{ta('Bill creation form: supplier, line items, totals, due date.')}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">{ta('Cancel')}</button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/accounting/bills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ supplierName: 'New Supplier', subtotal: 0, total: 0, items: [] }) })
                if (res.ok) { toast.success(ta('Bill created')); setShowCreateModal(false); fetchBills() }
                else toast.error(ta('Failed to create'))
              }} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">{ta('Create')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
