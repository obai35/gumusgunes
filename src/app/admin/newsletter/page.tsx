'use client'

import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { ColumnDef } from '@tanstack/react-table'
import { Mail, Trash2, RefreshCw, Users, UserPlus } from 'lucide-react'
import { DataTable } from '@/components/admin/DataTable'
import { SearchInput } from '@/components/admin/SearchInput'
import { Pagination } from '@/components/admin/Pagination'
import { StatsCard } from '@/components/admin/StatsCard'
import { ExportButton } from '@/components/admin/ExportButton'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { PageHeader } from '@/components/admin/PageHeader'
import { useAdminTranslate } from '@/lib/i18n/admin-ui'

type Subscriber = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export default function AdminNewsletter() {
  const { ta, fmtNum, fmtDate, fmtDateTime, fmtCurrency } = useAdminTranslate()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalThisMonth, setTotalThisMonth] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function fetchSubscribers() {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (searchQuery) params.set('search', searchQuery)

    fetch(`/api/admin/newsletter?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) {
          setSubscribers(Array.isArray(d.subscribers) ? d.subscribers : [])
          setTotal(d.total)
          setTotalThisMonth(d.totalThisMonth)
          setTotalPages(d.totalPages)
        } else {
          toast.error(d.error || ta('Failed to load subscribers'))
        }
      })
      .catch(() => toast.error(ta('Failed to load subscribers')))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  useEffect(() => {
    fetchSubscribers()
  }, [page])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(deleteId)
    setDeleteId(null)
    try {
      const res = await fetch(`/api/admin/newsletter?id=${deleteId}`, {
        method: 'DELETE',
      })
      const d = await res.json()
      if (d.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== deleteId))
        setTotal(prev => prev - 1)
        toast.success(ta('Subscriber deleted'))
      } else {
        toast.error(d.error || ta('Failed to delete subscriber'))
      }
    } catch {
      toast.error(ta('Failed to delete subscriber'))
    } finally {
      setDeleting(null)
    }
  }

  const columns: ColumnDef<Subscriber>[] = useMemo(() => [
    {
      accessorKey: 'email',
      header: ta('Email'),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-navy">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: ta('Name'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.name || '—'}</span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ta('Subscribed Date'),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-right">
          <button
            disabled={deleting === row.original.id}
            onClick={() => setDeleteId(row.original.id)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title={ta('Delete')}
          >
            {deleting === row.original.id ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      ),
    },
  ], [deleting])

  const exportData = useMemo(() =>
    subscribers.map(s => ({
      Email: s.email,
      Name: s.name || '',
      'Subscribed Date': new Date(s.createdAt).toLocaleDateString(),
    })),
  [subscribers])

  return (
    <div>
      <PageHeader
        title={ta('Newsletter Subscribers')}
        subtitle={`${total} ${ta(total !== 1 ? 'subscribers' : 'subscriber')}`}
        actions={
          <ExportButton
            filename={`newsletter-${new Date().toISOString().split('T')[0]}`}
            columns={[
              { header: ta('Email'), key: 'Email' },
              { header: ta('Name'), key: 'Name' },
              { header: ta('Subscribed Date'), key: 'Subscribed Date' },
            ]}
            data={exportData}
          />
        }
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatsCard icon={Users} label={ta('Total Subscribers')} value={String(total)} />
        <StatsCard icon={UserPlus} label={ta('Subscribed This Month')} value={String(totalThisMonth)} />
      </div>

      <div className="flex flex-wrap gap-3 mb-5 items-center">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={ta('Search by email or name...')}
          className="flex-1 min-w-[200px] max-w-sm"
        />
        <button
          onClick={fetchSubscribers}
          className="px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-navy flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {ta('Refresh')}
        </button>
      </div>

      <DataTable
        columns={columns}
        data={subscribers}
        loading={loading}
        responsiveCards
        keyExtractor={item => item.id}
        emptyTitle={ta('No subscribers found')}
        emptyDescription={ta('No newsletter subscribers match your search.')}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={open => { if (!open) setDeleteId(null) }}
        title={ta('Delete subscriber')}
        description={ta('Are you sure you want to delete this subscriber? This action cannot be undone.')}
        confirmLabel={ta('Delete')}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  )
}
