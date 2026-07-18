'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Download, Send, CheckCircle, XCircle } from 'lucide-react'
import { formatCurrency } from './page'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-700',
}

export default function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)

  function fetchInvoices() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(page))
    fetch(`/api/admin/accounting/invoices?${params}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setInvoices(d.invoices || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => { toast.error('Failed to load invoices'); setLoading(false) })
  }

  useEffect(() => { fetchInvoices() }, [page, statusFilter])

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/admin/accounting/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success(`Invoice ${status}`); fetchInvoices() }
    else toast.error('Failed to update')
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Delete this invoice?')) return
    const res = await fetch(`/api/admin/accounting/invoices/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Invoice deleted'); fetchInvoices() }
    else toast.error('Failed to delete')
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchInvoices() }} className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-border rounded-lg text-sm">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
        <button onClick={() => {
          const csv = ['Invoice#,Customer,Total,Status,Issued,Due'].join(',') + '\n' + invoices.map(i => `"${i.invoiceNumber}","${i.customerName}",${i.total},"${i.status}","${new Date(i.issuedAt).toLocaleDateString()}","${i.dueAt ? new Date(i.dueAt).toLocaleDateString() : ''}"`).join('\n')
          const blob = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'invoices.csv'; a.click()
        }} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-1.5">
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-muted-foreground border-b border-border bg-gray-50"><th className="p-3 font-medium">Invoice #</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium text-right">Total</th><th className="p-3 font-medium text-center">Status</th><th className="p-3 font-medium">Issued</th><th className="p-3 font-medium">Due</th><th className="p-3 font-medium text-center">Actions</th></tr></thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="p-3 font-mono text-xs text-navy">{inv.invoiceNumber}</td>
                <td className="p-3 text-navy">{inv.customerName}</td>
                <td className="p-3 text-right font-semibold">{formatCurrency(inv.total)}</td>
                <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || 'bg-gray-100'}`}>{inv.status}</span></td>
                <td className="p-3 text-muted-foreground text-xs">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                <td className="p-3 text-muted-foreground text-xs">{inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : '-'}</td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    {inv.status === 'draft' && <button onClick={() => updateStatus(inv.id, 'sent')} className="p-1 hover:bg-blue-50 rounded" title="Send"><Send className="h-3.5 w-3.5 text-blue-600" /></button>}
                    {inv.status === 'sent' && <button onClick={() => updateStatus(inv.id, 'paid')} className="p-1 hover:bg-green-50 rounded" title="Mark Paid"><CheckCircle className="h-3.5 w-3.5 text-green-600" /></button>}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && <button onClick={() => updateStatus(inv.id, 'cancelled')} className="p-1 hover:bg-red-50 rounded" title="Cancel"><XCircle className="h-3.5 w-3.5 text-red-600" /></button>}
                    {inv.status === 'draft' && <button onClick={() => deleteInvoice(inv.id)} className="p-1 hover:bg-red-50 rounded" title="Delete"><XCircle className="h-3.5 w-3.5 text-slate-400" /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices found</td></tr>}
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
            <h3 className="text-lg font-semibold text-navy mb-4">Create Invoice</h3>
            <p className="text-sm text-muted-foreground">Invoice creation form: customer details, line items, totals.</p>
            <p className="text-xs text-muted-foreground mt-2">Option: Create from Order (enter order ID to auto-fill).</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-navy">Cancel</button>
              <button onClick={async () => {
                const res = await fetch('/api/admin/accounting/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customerName: 'New Customer', subtotal: 0, total: 0, items: [] }) })
                if (res.ok) { toast.success('Invoice created'); setShowCreateModal(false); fetchInvoices() }
                else toast.error('Failed to create')
              }} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium">Create Draft</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
