'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useAdminAuth } from '@/lib/admin-auth-store'
import { Search, X, Download, ChevronLeft, ChevronRight, Trash2, RefreshCw, Mail } from 'lucide-react'

function exportCSVRows(rows: Record<string, any>[], filename: string) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const csv = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

type Subscriber = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export default function AdminNewsletter() {
  const { token } = useAdminAuth()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalThisMonth, setTotalThisMonth] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)

  function fetchSubscribers() {
    if (!token) return
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (searchQuery) params.set('search', searchQuery)

    fetch(`/api/admin/newsletter?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setSubscribers(d.subscribers)
          setTotal(d.total)
          setTotalThisMonth(d.totalThisMonth)
          setTotalPages(d.totalPages)
        } else {
          toast.error(d.error || 'Failed to load subscribers')
        }
      })
      .catch(() => toast.error('Failed to load subscribers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  useEffect(() => {
    fetchSubscribers()
  }, [token, page])

  async function deleteSubscriber(id: string) {
    if (!confirm('Delete this subscriber?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/newsletter?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      if (d.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== id))
        setTotal(prev => prev - 1)
        toast.success('Subscriber deleted')
      } else {
        toast.error(d.error || 'Failed to delete subscriber')
      }
    } catch {
      toast.error('Failed to delete subscriber')
    } finally {
      setDeleting(null)
    }
  }

  function handleExportCSV() {
    const rows = subscribers.map(s => ({
      Email: s.email,
      Name: s.name || '',
      SubscribedDate: new Date(s.createdAt).toLocaleDateString(),
    }))
    exportCSVRows(rows, `newsletter-${new Date().toISOString().split('T')[0]}.csv`)
  }

  if (loading) return <div className="p-6 text-muted-foreground">Loading subscribers...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-semibold text-navy">Newsletter Subscribers</h1>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Subscribers</p>
          <p className="text-2xl font-bold text-navy">{total}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">Subscribed This Month</p>
          <p className="text-2xl font-bold text-green-600">{totalThisMonth}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by email or name..."
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-border text-sm"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setPage(1) }} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button onClick={fetchSubscribers} className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy flex items-center gap-1">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
        <span className="text-xs text-muted-foreground">{total} subscriber{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Subscribed Date</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.map(sub => (
              <tr key={sub.id} className="border-b border-border/50 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-navy">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {sub.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{sub.name || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(sub.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    disabled={deleting === sub.id}
                    onClick={() => deleteSubscriber(sub.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    {deleting === sub.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No subscribers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
