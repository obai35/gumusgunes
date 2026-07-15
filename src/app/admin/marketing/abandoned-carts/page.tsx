'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Mail, Clock, ShoppingCart, RefreshCw } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { Pagination } from '@/components/admin/Pagination'
import { SearchInput } from '@/components/admin/SearchInput'
import { StatsCard } from '@/components/admin/StatsCard'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type Cart = { id: string; email: string; name: string | null; items: string; total: number; remindedCount: number; reminderSentAt: string | null; createdAt: string }

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]); const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const [totalPages, setTotalPages] = useState(0)
  const [search, setSearch] = useState('')

  function fetchCarts() {
    setLoading(true); const p = new URLSearchParams({ page: String(page) }); if (search) p.set('search', search)
    fetch('/api/abandoned-carts?' + p).then(r => r.json()).then(d => { setCarts(d.carts || []); setTotal(d.total); setTotalPages(d.totalPages) }).catch(() => toast.error('Failed')).finally(() => setLoading(false))
  }
  useEffect(() => { setPage(1) }, [search]); useEffect(() => { fetchCarts() }, [page])

  async function sendReminder(cartId: string) {
    setSendingId(cartId)
    try { const res = await fetch('/api/abandoned-carts/send-reminder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cartId }) }); if (res.ok) { toast.success('Sent'); setCarts(prev => prev.map(c => c.id === cartId ? { ...c, remindedCount: c.remindedCount + 1, reminderSentAt: new Date().toISOString() } : c)) } else toast.error('Failed') } catch { toast.error('Failed') }
    finally { setSendingId(null) }
  }

  function timeSince(date: string) { const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000); if (m < 60) return m + 'm ago'; const h = Math.floor(m / 60); if (h < 24) return h + 'h ago'; return Math.floor(h / 24) + 'd ago' }

  const itemCount = useMemo(() => carts.reduce((s, c) => { try { return s + JSON.parse(c.items).length } catch { return s } }, 0), [carts])

  const columns: ColumnDef<Cart>[] = [
    { accessorKey: 'email', header: 'Customer', cell: ({ row }) => <div><span className="font-medium text-navy">{row.original.email}</span>{row.original.name && <p className="text-xs text-muted-foreground">{row.original.name}</p>}</div> },
    { accessorKey: 'items', header: 'Items', cell: ({ row }) => { try { const items = JSON.parse(row.original.items) as { name: string; quantity: number }[]; return <span className="text-sm">{items.map(i => i.name + ' x' + i.quantity).join(', ')}</span> } catch { return <span className="text-muted-foreground">—</span> } } },
    { accessorKey: 'total', header: 'Total', cell: ({ row }) => <span className="font-medium text-navy">${row.original.total.toFixed(2)}</span> },
    { accessorKey: 'createdAt', header: 'Abandoned', cell: ({ row }) => <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeSince(row.original.createdAt)}</span> },
    { accessorKey: 'remindedCount', header: 'Reminders', cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.remindedCount}x{row.original.reminderSentAt ? ' (last ' + timeSince(row.original.reminderSentAt) + ')' : ''}</span> },
    { id: 'actions', header: '', cell: ({ row }) => (
      <div className="text-right">
        <button onClick={() => sendReminder(row.original.id)} disabled={sendingId === row.original.id} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gold/10 text-gold text-xs font-medium hover:bg-gold/20 disabled:opacity-50">
          {sendingId === row.original.id ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />} Send Reminder
        </button>
      </div>
    )},
  ]

  return (
    <div>
      <PageHeader title="Abandoned Carts" backHref="/admin/marketing" subtitle={total + ' abandoned carts'} />
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard icon={ShoppingCart} label="Abandoned" value={String(total)} />
        <StatsCard icon={Mail} label="Reminders Sent" value={String(carts.reduce((s, c) => s + c.remindedCount, 0))} />
        <StatsCard icon={Clock} label="Total Items" value={String(itemCount)} />
      </div>
      <div className="mb-5"><SearchInput value={search} onChange={setSearch} placeholder="Search by email or name..." className="max-w-sm" /></div>
      <DataTable columns={columns} data={carts} loading={loading} keyExtractor={c => c.id} emptyTitle="No abandoned carts" emptyDescription="Carts will appear when customers add items but don't checkout." />
      <Pagination page={page} totalPages={totalPages} totalItems={total} onPageChange={setPage} />
    </div>
  )
}
