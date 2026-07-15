'use client'

import { useState, useEffect, useCallback } from 'react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { PageHeader } from '@/components/admin/PageHeader'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Search, Trash2, Edit, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

type GiftCard = { id: string; code: string; recipientEmail: string | null; initialBalance: number; balance: number; isActive: boolean; expiresAt: string | null; issuedAt: string }

export default function GiftCardsPage() {
  const [cards, setCards] = useState<GiftCard[]>([]); const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [tp, setTp] = useState(0); const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false); const [editCard, setEditCard] = useState<GiftCard | null>(null); const [deleteId, setDeleteId] = useState<string | null>(null); const [saving, setSaving] = useState(false); const [copiedId, setCopiedId] = useState<string | null>(null)

  const [form, setForm] = useState({ code: '', recipientEmail: '', initialBalance: '50', expiresAt: '' })

  function fetchCards() { setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search); fetch('/api/admin/gift-cards?' + p).then(r => r.json()).then(d => { setCards(d.giftCards || []); setTotal(d.total); setTp(d.totalPages) }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchCards() }, [page])

  async function handleCreate(e: React.FormEvent) { e.preventDefault(); setSaving(true); const r = await fetch('/api/admin/gift-cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }); if (r.ok) { toast.success('Created'); setShowCreate(false); setForm({ code: '', recipientEmail: '', initialBalance: '50', expiresAt: '' }); fetchCards() } else { toast.error('Failed') }; setSaving(false) }

  async function handleEdit() { if (!editCard) return; setSaving(true); const r = await fetch('/api/admin/gift-cards/' + editCard.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editCard) }); if (r.ok) { toast.success('Updated'); setEditCard(null); fetchCards() } else { toast.error('Failed') }; setSaving(false) }

  async function handleDelete() { if (!deleteId) return; const r = await fetch('/api/admin/gift-cards/' + deleteId, { method: 'DELETE' }); if (r.ok) { toast.success('Deleted'); setDeleteId(null); fetchCards() } else { toast.error('Failed') } }

  const copyCode = useCallback((code: string, id: string) => { navigator.clipboard.writeText(code); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000) }, [])

  const columns: ColumnDef<GiftCard>[] = [
    { accessorKey: 'code', header: 'Code', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-navy bg-gray-100 px-2 py-0.5 rounded">{row.original.code}</span>
        <button onClick={() => copyCode(row.original.code, row.original.id)} className="text-muted-foreground hover:text-navy">
          {copiedId === row.original.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    )},
    { accessorKey: 'recipientEmail', header: 'Email', cell: ({ row }) => <span className="text-sm">{row.original.recipientEmail || '—'}</span> },
    { accessorKey: 'initialBalance', header: 'Amount', cell: ({ row }) => <span className="text-sm font-medium">${row.original.initialBalance.toFixed(2)}</span> },
    { accessorKey: 'balance', header: 'Remaining', cell: ({ row }) => {
      const pct = (row.original.balance / row.original.initialBalance) * 100
      return <div className="flex items-center gap-2"><span className="text-sm">${row.original.balance.toFixed(2)}</span><div className="w-16 h-1.5 bg-gray-200 rounded-full"><div className="h-full rounded-full bg-navy" style={{ width: pct + '%' }} /></div></div>
    }},
    { id: 'status', header: 'Status', cell: ({ row }) => {
      const expired = row.original.expiresAt && new Date(row.original.expiresAt) < new Date()
      const s = expired ? 'expired' : (row.original.isActive ? (row.original.balance > 0 ? 'active' : 'redeemed') : 'inactive')
      return <span className={'px-2 py-0.5 rounded text-xs font-medium ' + (s === 'active' ? 'bg-green-100 text-green-700' : s === 'redeemed' ? 'bg-blue-100 text-blue-700' : s === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{s}</span>
    }},
    { accessorKey: 'expiresAt', header: 'Expires', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.expiresAt ? new Date(row.original.expiresAt).toLocaleDateString() : 'Never'}</span> },
    { id: 'actions', cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button onClick={() => setEditCard(row.original)} className="p-1.5 text-muted-foreground hover:text-navy rounded-lg hover:bg-gray-100"><Edit className="h-4 w-4" /></button>
        <button onClick={() => setDeleteId(row.original.id)} className="p-1.5 text-muted-foreground hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
      </div>
    )},
  ]

  const modalBg = 'bg-white rounded-xl border border-border p-6 max-w-lg mx-auto'
  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg text-sm'
  const labelCls = 'text-xs font-medium text-muted-foreground block mb-1'

  return (
    <div>
      <PageHeader title="Gift Cards" backHref="/admin/marketing" actions={<button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium"><Plus className="h-4 w-4" /> Create</button>} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-bold text-navy">{total}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-green-600">{cards.filter(c => c.isActive && c.balance > 0).length}</p></div>
        <div className="bg-white rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">Issued</p><p className="text-xl font-bold text-blue-600">{cards.length}</p></div>
      </div>

      <div className="mb-5"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by code or email..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-border text-sm" /></div></div>
      <DataTable columns={columns} data={cards} loading={loading} keyExtractor={c => c.id} emptyTitle="No gift cards" emptyDescription="Create your first gift card to get started." />
      <Pagination page={page} totalPages={tp} totalItems={total} onPageChange={setPage} />

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className={modalBg} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-navy mb-4">New Gift Card</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className={labelCls}>Code (leave blank for auto)</label><input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Auto-generated" className={inputCls} /></div>
              <div><label className={labelCls}>Recipient Email (optional)</label><input value={form.recipientEmail} onChange={e => setForm(p => ({ ...p, recipientEmail: e.target.value }))} placeholder="customer@example.com" className={inputCls} /></div>
              <div><label className={labelCls}>Amount</label><input type="number" step="0.01" value={form.initialBalance} onChange={e => setForm(p => ({ ...p, initialBalance: e.target.value }))} required className={inputCls} /></div>
              <div><label className={labelCls}>Expires At (optional)</label><input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))} className={inputCls} /></div>
              <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button><button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {editCard && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditCard(null)}>
          <div className={modalBg} onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-navy mb-4">Edit Gift Card</h3>
            <div className="space-y-4">
              <div><label className={labelCls}>Initial Balance</label><input type="number" step="0.01" value={editCard.initialBalance} onChange={e => setEditCard({ ...editCard, initialBalance: parseFloat(e.target.value) })} className={inputCls} /></div>
              <div><label className={labelCls}>Current Balance</label><input type="number" step="0.01" value={editCard.balance} onChange={e => setEditCard({ ...editCard, balance: parseFloat(e.target.value) })} className={inputCls} /></div>
              <div><label className={labelCls}>Active</label><select value={editCard.isActive ? 'true' : 'false'} onChange={e => setEditCard({ ...editCard, isActive: e.target.value === 'true' })} className={inputCls}><option value="true">Active</option><option value="false">Inactive</option></select></div>
              <div className="flex gap-3 pt-2"><button onClick={handleEdit} disabled={saving} className="px-4 py-2 bg-navy text-silver rounded-lg text-sm font-medium disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button><button onClick={() => setEditCard(null)} className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground">Cancel</button></div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={o => { if (!o) setDeleteId(null) }} title="Delete Gift Card" description="Are you sure? This cannot be undone." confirmLabel="Delete" onConfirm={handleDelete} destructive />
    </div>
  )
}
