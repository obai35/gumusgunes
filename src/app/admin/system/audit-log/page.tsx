'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, X, Activity, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { DataTable } from '@/components/admin/DataTable'
import { PageHeader } from '@/components/admin/PageHeader'
import type { ColumnDef } from '@tanstack/react-table'

type AuditLog = {
  id: string
  adminId: string | null
  adminName: string | null
  action: string
  resource: string
  resourceId: string | null
  details: string | null
  createdAt: string
}

type Filters = {
  action: string
  resource: string
  startDate: string
  endDate: string
}

export default function AdminAuditLog() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [availableActions, setAvailableActions] = useState<{ value: string; count: number }[]>([])
  const [availableResources, setAvailableResources] = useState<{ value: string; count: number }[]>([])
  const [filters, setFilters] = useState<Filters>({ action: '', resource: '', startDate: '', endDate: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '50')
      if (filters.action) params.set('action', filters.action)
      if (filters.resource) params.set('resource', filters.resource)
      if (filters.startDate) params.set('startDate', filters.startDate)
      if (filters.endDate) params.set('endDate', filters.endDate)
      const res = await fetch(`/api/admin/system/audit-log?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setLogs(data.logs || [])
      setTotalPages(data.pagination?.totalPages || 1)
      if (data.filters) {
        setAvailableActions(data.filters.actions || [])
        setAvailableResources(data.filters.resources || [])
      }
    } catch {
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [page, filters])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const clearFilters = () => {
    setFilters({ action: '', resource: '', startDate: '', endDate: '' })
    setPage(1)
  }

  const hasFilters = Object.values(filters).some(v => v)

  const filteredLogs = search
    ? logs.filter(l =>
        (l.adminName || '').toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.resource.toLowerCase().includes(search.toLowerCase()) ||
        (l.resourceId || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.details || '').toLowerCase().includes(search.toLowerCase())
      )
    : logs

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Time',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: 'adminName',
      header: 'Admin',
      cell: ({ row }) => (
        <span className="text-sm font-medium text-navy">{row.original.adminName || 'System'}</span>
      ),
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: ({ row }) => {
        const colorMap: Record<string, string> = {
          create: 'text-green-600 bg-green-50',
          update: 'text-blue-600 bg-blue-50',
          delete: 'text-red-600 bg-red-50',
          login: 'text-purple-600 bg-purple-50',
          logout: 'text-gray-600 bg-gray-50',
        }
        const cls = colorMap[row.original.action] || 'text-gray-600 bg-gray-50'
        return (
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
            {row.original.action}
          </span>
        )
      },
    },
    {
      accessorKey: 'resource',
      header: 'Resource',
      cell: ({ row }) => (
        <span className="text-sm text-gray-700">{row.original.resource}</span>
      ),
    },
    {
      accessorKey: 'resourceId',
      header: 'Resource ID',
      cell: ({ row }) => (
        <span className="text-xs font-mono text-gray-400">{row.original.resourceId || '—'}</span>
      ),
    },
    {
      accessorKey: 'details',
      header: 'Details',
      cell: ({ row }) => {
        const details = row.original.details
        if (!details) return <span className="text-gray-400">—</span>
        try {
          const parsed = JSON.parse(details)
          return <span className="text-xs text-gray-500 max-w-[200px] truncate block">{JSON.stringify(parsed)}</span>
        } catch {
          return <span className="text-xs text-gray-500 max-w-[200px] truncate block">{details}</span>
        }
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Track all admin actions across the system"
      />

      <div className="bg-white rounded-xl border border-border mb-6">
        <div className="p-4 flex items-center gap-3 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-navy/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm transition-colors ${
              hasFilters ? 'bg-navy text-silver border-navy' : 'hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 rounded-full bg-gold" />}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-600">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border bg-gray-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Action</label>
                <select
                  value={filters.action}
                  onChange={e => { setFilters(f => ({ ...f, action: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white"
                >
                  <option value="">All Actions</option>
                  {availableActions.map(a => (
                    <option key={a.value} value={a.value}>{a.value} ({a.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Resource</label>
                <select
                  value={filters.resource}
                  onChange={e => { setFilters(f => ({ ...f, resource: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-white"
                >
                  <option value="">All Resources</option>
                  {availableResources.map(r => (
                    <option key={r.value} value={r.value}>{r.value} ({r.count})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        loading={loading}
        emptyTitle="No audit logs found"
        emptyDescription={hasFilters ? 'Try adjusting your filters' : 'No admin actions have been recorded yet'}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
